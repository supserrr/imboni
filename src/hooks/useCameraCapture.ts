"use client"

import { useEffect, useRef, useState, useCallback } from "react"

export interface CameraCaptureState {
  stream: MediaStream | null
  videoElement: HTMLVideoElement | null
  error: Error | null
  isActive: boolean
  facingMode: "user" | "environment"
}

/**
 * Hook for managing camera access and video capture
 * Based on useLiveVideo pattern from the reference implementation
 */
export function useCameraCapture(initialFacingMode: "user" | "environment" = "environment") {
  const [state, setState] = useState<CameraCaptureState>({
    stream: null,
    videoElement: null,
    error: null,
    isActive: false,
    facingMode: initialFacingMode,
  })

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  /**
   * Request camera access and start video stream
   */
  const startCamera = useCallback(async (facingMode?: "user" | "environment") => {
    const targetFacingMode = facingMode || state.facingMode

    try {
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: targetFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      streamRef.current = stream

      // Set stream on video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
        } catch (error: any) {
          // Handle AbortError gracefully (occurs during navigation/unmount)
          if (error.name !== 'AbortError') {
            console.error("[useCameraCapture] Error playing video:", error)
          }
          // Clean up stream if play failed
          stream.getTracks().forEach((track) => track.stop())
          throw error
        }
      }

      setState({
        stream,
        videoElement: videoRef.current,
        error: null,
        isActive: true,
        facingMode: targetFacingMode,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      setState((prev) => ({
        ...prev,
        error: err,
        isActive: false,
      }))
      throw err
    }
  }, [state.facingMode])

  /**
   * Stop camera stream
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setState((prev) => ({
      ...prev,
      stream: null,
      videoElement: null,
      isActive: false,
    }))
  }, [])

  /**
   * Switch between front and back camera
   */
  const switchCamera = useCallback(async () => {
    const newFacingMode = state.facingMode === "user" ? "environment" : "user"
    await startCamera(newFacingMode)
  }, [state.facingMode, startCamera])

  /**
   * Set video element reference
   */
  const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element
    if (element && streamRef.current) {
      element.srcObject = streamRef.current
      element.play().catch((error: any) => {
        // Only log non-AbortError errors (AbortError is expected during navigation/unmount)
        if (error.name !== 'AbortError') {
          console.error("[useCameraCapture] Error playing video:", error)
        }
      })
    }
    setState((prev) => ({
      ...prev,
      videoElement: element,
    }))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  return {
    ...state,
    videoRef,
    setVideoRef,
    startCamera,
    stopCamera,
    switchCamera,
  }
}

