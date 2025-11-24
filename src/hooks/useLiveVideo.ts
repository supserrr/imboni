"use client"

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

interface UseLiveVideoOptions {
  /**
   * Media constraints forwarded to getUserMedia.
   * Defaults to 1280x720 video with audio disabled.
   */
  mediaConstraints?: MediaStreamConstraints;
}

interface UseLiveVideoReturn {
  videoRef: RefObject<HTMLVideoElement | null>;
  isStreaming: boolean;
  shouldMirror: boolean;
  startWebcam: () => Promise<void>;
  startVideo: (file: File) => Promise<void>;
  stopStream: () => void;
  captureFrame: () => string | null;
}

const FRONT_FACING_LABEL_HINTS = ['user', 'front', 'facetime', 'integrated', 'ingrated', 'selfie'];
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const isLikelyFrontFacing = (stream: MediaStream | null): boolean => {
  if (!stream) return false;

  const [track] = stream.getVideoTracks();
  if (!track) return false;

  const settings = track.getSettings();
  const facingModeValue = settings.facingMode;
  const facingMode = Array.isArray(facingModeValue)
    ? facingModeValue[0]?.toLowerCase()
    : facingModeValue?.toLowerCase();

  if (facingMode) {
    if (facingMode === 'user' || facingMode === 'front') {
      return true;
    }

    if (facingMode === 'environment' || facingMode === 'rear') {
      return false;
    }
  }

  const label = track.label?.toLowerCase() ?? '';
  return FRONT_FACING_LABEL_HINTS.some(hint => label.includes(hint));
};

export function useLiveVideo({
  mediaConstraints = { video: { width: 1280, height: 720 }, audio: false },
}: UseLiveVideoOptions = {}): UseLiveVideoReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inactivityTimerRef = useRef<number | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [shouldMirror, setShouldMirror] = useState(false);

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current === null) return;
    if (typeof window !== 'undefined') {
      window.clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = null;
  }, []);

  const stopStream = useCallback(() => {
    clearInactivityTimer();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = '';
      videoRef.current.pause();
    }
    setIsStreaming(false);
    setShouldMirror(false);
  }, [clearInactivityTimer]);

  const scheduleInactivityStop = useCallback(() => {
    if (typeof window === 'undefined') return;
    clearInactivityTimer();
    inactivityTimerRef.current = window.setTimeout(() => {
      stopStream();
    }, INACTIVITY_TIMEOUT_MS);
  }, [clearInactivityTimer, stopStream]);

  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

      if (!videoRef.current) {
        stream.getTracks().forEach(track => track.stop());
        throw new Error('Video element not ready');
      }

      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setShouldMirror(isLikelyFrontFacing(stream));
      setIsStreaming(true);
    } catch (error) {
      console.error('Error accessing webcam:', error);
      throw new Error('Failed to access webcam. Please check permissions.');
    }
  }, [mediaConstraints]);

  const startVideo = useCallback(async (file: File) => {
    if (!videoRef.current) {
      throw new Error('Video element not ready');
    }

    const video = videoRef.current;
    const canPlay = video.canPlayType(file.type);

    if (canPlay === '') {
      throw new Error(`Video format "${file.type}" not supported. Try a different video format (MP4/WebM).`);
    }

    try {
      const url = URL.createObjectURL(file);
      video.srcObject = null;
      video.src = url;
      video.loop = true;
      setShouldMirror(false);

      await new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('error', onError);
        };

        const onLoadedMetadata = () => {
          cleanup();
          resolve();
        };

        const onError = () => {
          cleanup();
          reject(new Error('Video failed to load'));
        };

        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('error', onError);
        video.load();
      });

      await video.play();
      setIsStreaming(true);
    } catch (error) {
      console.error('Video error:', error);
      throw new Error('Could not load video file. Try recording in a different format or use an existing MP4 video.');
    }
  }, []);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;

    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  useEffect(() => {
    if (!isStreaming || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const handleTabVisibility = () => {
      if (document.hidden) {
        stopStream();
      }
    };

    const handleWindowBlur = () => {
      stopStream();
    };

    const handleUserActivity = () => {
      scheduleInactivityStop();
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'pointermove',
    ];

    scheduleInactivityStop();
    document.addEventListener('visibilitychange', handleTabVisibility);
    window.addEventListener('blur', handleWindowBlur);
    activityEvents.forEach(event => window.addEventListener(event, handleUserActivity, { passive: true }));

    return () => {
      document.removeEventListener('visibilitychange', handleTabVisibility);
      window.removeEventListener('blur', handleWindowBlur);
      activityEvents.forEach(event => window.removeEventListener(event, handleUserActivity));
      clearInactivityTimer();
    };
  }, [clearInactivityTimer, isStreaming, scheduleInactivityStop, stopStream]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    videoRef,
    isStreaming,
    shouldMirror,
    startWebcam,
    startVideo,
    stopStream,
    captureFrame,
  };
}

