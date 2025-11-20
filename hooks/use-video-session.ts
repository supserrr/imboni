import { useCameraPermissions, CameraType, CameraView } from 'expo-camera';
import { useState, useEffect, useRef, useCallback } from 'react';

export interface VideoSessionOptions {
  autoRequestPermission?: boolean;
  defaultFacing?: CameraType;
  captureInterval?: number;
  inactivityTimeout?: number;
}

/**
 * Hook for managing video session: camera, permissions, frame capture.
 * 
 * Features:
 * - Camera permissions management
 * - Camera facing (front/back) with auto-mirroring
 * - Frame capture with interval control
 * - Inactivity timeout handling
 * - Frame-to-base64 conversion
 */
export function useVideoSession(options: VideoSessionOptions = {}) {
  const {
    autoRequestPermission = true,
    defaultFacing = 'back',
    captureInterval = 3000,
    inactivityTimeout,
  } = options;

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>(defaultFacing);
  const [isActive, setIsActive] = useState(true);
  const cameraRef = useRef<CameraView>(null);
  const lastCaptureRef = useRef(0);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const frameCaptureCallbackRef = useRef<((base64: string) => void) | null>(null);

  // Auto-request permission
  useEffect(() => {
    if (autoRequestPermission && !permission?.granted) {
      requestPermission();
    }
  }, [autoRequestPermission, permission, requestPermission]);

  // Inactivity timeout
  useEffect(() => {
    if (inactivityTimeout && isActive) {
      inactivityTimerRef.current = setTimeout(() => {
        setIsActive(false);
      }, inactivityTimeout);

      return () => {
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
      };
    }
  }, [inactivityTimeout, isActive]);

  /**
   * Toggle between front and back camera.
   */
  const toggleCameraFacing = useCallback(() => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }, []);

  /**
   * Set camera facing explicitly.
   */
  const setCameraFacing = useCallback((newFacing: CameraType) => {
    setFacing(newFacing);
  }, []);

  /**
   * Capture a frame and return as base64.
   */
  const takePicture = useCallback(async (): Promise<string | null> => {
    if (!cameraRef.current || !permission?.granted) {
      return null;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5,
      });

      if (photo?.base64) {
        return photo.base64;
      }

      return null;
    } catch (error) {
      console.error('Failed to take picture:', error);
      return null;
    }
  }, [permission]);

  /**
   * Register a callback for automatic frame capture.
   * The callback will be called at the specified interval.
   */
  const registerFrameCapture = useCallback(
    (callback: (base64: string) => void) => {
      frameCaptureCallbackRef.current = callback;
    },
    []
  );

  /**
   * Start automatic frame capture at the specified interval.
   * Returns cleanup function or undefined.
   */
  const startAutoCapture = useCallback((): (() => void) | undefined => {
    if (!permission?.granted || !isActive) {
      return undefined;
    }

    const captureFrame = async () => {
      const now = Date.now();
      if (now - lastCaptureRef.current >= captureInterval) {
        lastCaptureRef.current = now;
        
        const base64 = await takePicture();
        if (base64 && frameCaptureCallbackRef.current) {
          frameCaptureCallbackRef.current(base64);
        }
      }
    };

    // Initial capture
    captureFrame();

    // Set up interval
    const intervalId = setInterval(captureFrame, captureInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [permission, isActive, captureInterval, takePicture]);

  /**
   * Manually trigger a frame capture.
   */
  const captureFrame = useCallback(async (): Promise<string | null> => {
    return takePicture();
  }, [takePicture]);

  /**
   * Activate the video session.
   */
  const activate = useCallback(() => {
    setIsActive(true);
  }, []);

  /**
   * Deactivate the video session.
   */
  const deactivate = useCallback(() => {
    setIsActive(false);
  }, []);

  /**
   * Check if front camera is being used (for auto-mirroring).
   */
  const isFrontCamera = facing === 'front';

  return {
    // State
    permission,
    facing,
    isActive,
    isFrontCamera,
    
    // Refs
    cameraRef,
    
    // Actions
    requestPermission,
    toggleCameraFacing,
    setCameraFacing,
    captureFrame,
    registerFrameCapture,
    startAutoCapture,
    activate,
    deactivate,
  };
}

