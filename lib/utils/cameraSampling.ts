import { CameraView, Camera } from 'expo-camera';
import { analyzeFrame, MoondreamResponse } from '../services/moondream';

/**
 * Camera sampling configuration.
 */
export interface SamplingConfig {
  interval: number; // Sampling interval in milliseconds (500-1200ms)
  onFrameAnalyzed: (analysis: MoondreamResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Starts sampling camera frames at specified intervals.
 *
 * @param cameraRef - Reference to the camera component
 * @param config - Sampling configuration
 * @returns Cleanup function to stop sampling
 */
export function startSampling(
  cameraRef: React.RefObject<CameraView>,
  config: SamplingConfig
): () => void {
  let isActive = true;
  let samplingInterval: NodeJS.Timeout | null = null;
  let isProcessing = false;

  /**
   * Captures and analyzes a single frame.
   */
  const captureAndAnalyze = async () => {
    if (!isActive || isProcessing || !cameraRef.current) {
      return;
    }

    isProcessing = true;

    try {
      // Capture frame as base64
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7, // Compress to reduce size
        base64: true,
        skipProcessing: false,
      });

      if (!photo?.base64 || !isActive) {
        isProcessing = false;
        return;
      }

      // Analyze frame
      const analysis = await analyzeFrame(photo.base64);

      if (isActive) {
        config.onFrameAnalyzed(analysis);
      }
    } catch (error) {
      if (isActive && config.onError) {
        config.onError(error as Error);
      }
    } finally {
      isProcessing = false;
    }
  };

  // Start sampling loop
  samplingInterval = setInterval(captureAndAnalyze, config.interval);

  // Return cleanup function
  return () => {
    isActive = false;
    if (samplingInterval) {
      clearInterval(samplingInterval);
      samplingInterval = null;
    }
  };
}

/**
 * Compresses an image to reduce file size before API call.
 *
 * @param base64Image - Base64 encoded image
 * @param maxSizeKB - Maximum size in KB (default 1000KB = 1MB)
 * @returns Compressed base64 image
 */
export async function compressImage(
  base64Image: string,
  maxSizeKB: number = 1000
): Promise<string> {
  // Simple compression - in production, use a proper image compression library
  // For now, return as-is (API should handle compression)
  return base64Image;
}

