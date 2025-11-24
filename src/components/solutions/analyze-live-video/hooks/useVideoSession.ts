"use client"

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject, ChangeEvent } from 'react';
import { useLiveVideo } from '@/hooks/useLiveVideo';
import type { VideoDisplayInfo } from '../player-types';

interface UseVideoSessionParams {
  defaultFullscreen: boolean;
}

export interface VideoSessionState {
  videoRef: RefObject<HTMLVideoElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  isStreaming: boolean;
  shouldMirror: boolean;
  displayInfo: VideoDisplayInfo;
  isFullscreen: boolean;
  error: string;
}

export interface VideoSessionActions {
  startWebcam: () => Promise<void>;
  startVideoFile: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  stopStreaming: () => void;
  enterFullscreen: () => void;
  exitFullscreen: () => void;
  captureFrame: () => string | null;
  setError: (message: string) => void;
}

export interface UseVideoSessionResult {
  state: VideoSessionState;
  actions: VideoSessionActions;
}

export function useVideoSession({ defaultFullscreen }: UseVideoSessionParams): UseVideoSessionResult {
  const { videoRef, isStreaming, shouldMirror, startWebcam, startVideo, stopStream, captureFrame } = useLiveVideo();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(defaultFullscreen);
  const [displayInfo, setDisplayInfo] = useState<VideoDisplayInfo>({
    displayWidth: 0,
    displayHeight: 0,
    offsetX: 0,
    offsetY: 0,
    containerHeight: 0,
    isLargeView: false,
  });

  const updateDisplayInfo = useCallback(() => {
    const container = containerRef.current;

    if (!container) {
      setDisplayInfo({
        displayWidth: 0,
        displayHeight: 0,
        offsetX: 0,
        offsetY: 0,
        containerHeight: 0,
        isLargeView: false,
      });
      return;
    }

    const containerRect = container.getBoundingClientRect();
    let contentWidth = 640;
    let contentHeight = 480;

    if (videoRef.current && videoRef.current.videoWidth > 0) {
      contentWidth = videoRef.current.videoWidth;
      contentHeight = videoRef.current.videoHeight;
    }

    const contentAspect = contentWidth / contentHeight;
    const containerAspect = containerRect.width / containerRect.height;

    let displayWidth;
    let displayHeight;
    let offsetX;
    let offsetY;

    if (isFullscreen) {
      displayWidth = containerRect.width;
      displayHeight = displayWidth / contentAspect;
      offsetX = 0;
      offsetY = 0;
    } else if (contentAspect > containerAspect) {
      displayWidth = containerRect.width;
      displayHeight = containerRect.width / contentAspect;
      offsetX = 0;
      offsetY = (containerRect.height - displayHeight) / 2;
    } else {
      displayWidth = containerRect.height * contentAspect;
      displayHeight = containerRect.height;
      offsetX = (containerRect.width - displayWidth) / 2;
      offsetY = 0;
    }

    setDisplayInfo({
      displayWidth,
      displayHeight,
      offsetX,
      offsetY,
      containerHeight: containerRect.height,
      isLargeView: displayWidth >= 800,
    });
  }, [isFullscreen, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    updateDisplayInfo();
    window.addEventListener('resize', updateDisplayInfo);
    video?.addEventListener('loadedmetadata', updateDisplayInfo);

    return () => {
      window.removeEventListener('resize', updateDisplayInfo);
      video?.removeEventListener('loadedmetadata', updateDisplayInfo);
    };
  }, [updateDisplayInfo, videoRef, isFullscreen, isStreaming]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isFullscreen]);

  const handleStartWebcam = useCallback(async () => {
    setError('');
    try {
      await startWebcam();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to access webcam. Please check permissions.');
    }
  }, [startWebcam]);

  const handleVideoFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      await startVideo(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load video file. Try another format.');
    }
  }, [startVideo]);

  const handleStopStreaming = useCallback(() => {
    stopStream();
  }, [stopStream]);

  return {
    state: {
      videoRef,
      containerRef,
      isStreaming,
      shouldMirror,
      displayInfo,
      isFullscreen,
      error,
    },
    actions: {
      startWebcam: handleStartWebcam,
      startVideoFile: handleVideoFileChange,
      stopStreaming: handleStopStreaming,
      enterFullscreen: () => setIsFullscreen(true),
      exitFullscreen: () => setIsFullscreen(false),
      captureFrame,
      setError,
    },
  };
}

