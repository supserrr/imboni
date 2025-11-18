/**
 * Camera frame capture service.
 * Handles continuous frame capture and Photo Mode snapshots.
 * Replaces lib/utils/cameraSampling.ts functionality.
 */

import { CameraView } from 'expo-camera';
import { debug, error as logError } from '@/lib/utils/logger';

/**
 * Frame capture configuration.
 */
export interface FrameCaptureConfig {
  fps: number; // Frames per second (1-4, default 2)
  quality: number; // Image quality 0-1 (default 0.7)
  shouldSkip?: () => boolean; // Optional function to check if frame should be skipped
}

/**
 * Frame capture result.
 */
export interface FrameCaptureResult {
  base64: string;
  uri?: string;
  timestamp: number;
}

/**
 * Frame capture callback.
 */
export type FrameCallback = (frame: FrameCaptureResult) => void | Promise<void>;

/**
 * Continuous frame capture manager.
 */
class ContinuousCaptureManager {
  private intervalId: NodeJS.Timeout | null = null;
  private isActive = false;
  private isProcessing = false;
  private cameraRef: React.RefObject<CameraView> | null = null;
  private config: FrameCaptureConfig | null = null;
  private callback: FrameCallback | null = null;
  private frameBuffer: FrameCaptureResult[] = [];
  private maxBufferSize = 3;

  /**
   * Starts continuous frame capture.
   *
   * @param cameraRef - Reference to camera component
   * @param fps - Frames per second (1-4)
   * @param onFrame - Callback for each frame
   * @param config - Additional configuration
   * @returns Cleanup function to stop capture
   */
  start(
    cameraRef: React.RefObject<CameraView>,
    fps: number,
    onFrame: FrameCallback,
    config: Partial<FrameCaptureConfig> = {}
  ): () => void {
    if (this.isActive) {
      debug('Continuous capture already active, stopping previous');
      this.stop();
    }

    // Clamp FPS to valid range (1-4)
    const clampedFps = Math.max(1, Math.min(4, fps));
    const interval = 1000 / clampedFps;

    this.cameraRef = cameraRef;
    this.callback = onFrame;
    this.config = {
      fps: clampedFps,
      quality: config.quality ?? 0.7,
      shouldSkip: config.shouldSkip,
    };
    this.isActive = true;
    this.frameBuffer = [];

    debug('Starting continuous frame capture', { fps: clampedFps, interval });

    // Start capture loop
    const captureFrame = async () => {
      if (!this.isActive || this.isProcessing || !this.cameraRef?.current) {
        return;
      }

      // Check if we should skip this frame
      if (this.config?.shouldSkip && this.config.shouldSkip()) {
        return;
      }

      this.isProcessing = true;

      try {
        const frame = await this.captureFrame();
        if (frame) {
          // Add to buffer (limit size)
          this.frameBuffer.push(frame);
          if (this.frameBuffer.length > this.maxBufferSize) {
            this.frameBuffer.shift(); // Remove oldest
          }

          // Call callback
          if (this.callback) {
            const result = this.callback(frame);
            await Promise.resolve(result);
          }
        }
      } catch (err) {
        logError('Error capturing frame', err instanceof Error ? err : new Error(String(err)));
      } finally {
        this.isProcessing = false;
      }
    };

    // Initial capture
    captureFrame();

    // Set up interval
    this.intervalId = setInterval(captureFrame, interval);

    // Return cleanup function
    return () => {
      this.stop();
    };
  }

  /**
   * Captures a single frame.
   *
   * @returns Frame capture result or null if failed
   */
  private async captureFrame(): Promise<FrameCaptureResult | null> {
    if (!this.cameraRef?.current) {
      return null;
    }

    try {
      const photo = await this.cameraRef.current.takePictureAsync({
        quality: this.config?.quality ?? 0.7,
        base64: true,
        skipProcessing: false,
      });

      if (!photo?.base64) {
        return null;
      }

      return {
        base64: photo.base64,
        uri: photo.uri,
        timestamp: Date.now(),
      };
    } catch (err) {
      logError('Failed to capture frame', err instanceof Error ? err : new Error(String(err)));
      return null;
    }
  }

  /**
   * Stops continuous capture.
   */
  stop(): void {
    this.isActive = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.frameBuffer = [];
    this.cameraRef = null;
    this.callback = null;
    this.config = null;
    this.isProcessing = false;

    debug('Stopped continuous frame capture');
  }
}

/**
 * Global continuous capture manager.
 */
const continuousCaptureManager = new ContinuousCaptureManager();

/**
 * Starts continuous frame capture at specified FPS.
 *
 * @param cameraRef - Reference to camera component
 * @param fps - Frames per second (1-4, default 2)
 * @param onFrame - Callback for each captured frame
 * @param config - Additional configuration
 * @returns Cleanup function to stop capture
 */
export function startContinuousCapture(
  cameraRef: React.RefObject<CameraView>,
  fps: number = 2,
  onFrame: FrameCallback,
  config: Partial<FrameCaptureConfig> = {}
): () => void {
  return continuousCaptureManager.start(cameraRef, fps, onFrame, config);
}

/**
 * Stops continuous frame capture.
 */
export function stopCapture(): void {
  continuousCaptureManager.stop();
}

/**
 * Captures a single snapshot (for Photo Mode).
 *
 * @param cameraRef - Reference to camera component
 * @param quality - Image quality 0-1 (default 0.8)
 * @returns Frame capture result
 */
export async function captureSnapshot(
  cameraRef: React.RefObject<CameraView>,
  quality: number = 0.8
): Promise<FrameCaptureResult> {
  if (!cameraRef?.current) {
    throw new Error('Camera reference is not available');
  }

  try {
    const photo = await cameraRef.current.takePictureAsync({
      quality,
      base64: true,
      skipProcessing: false,
    });

    if (!photo?.base64) {
      throw new Error('Failed to capture photo: no base64 data');
    }

    return {
      base64: photo.base64,
      uri: photo.uri,
      timestamp: Date.now(),
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logError('Failed to capture snapshot', error);
    throw error;
  }
}

