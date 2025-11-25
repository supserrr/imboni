"use client"

import { useState, useCallback, useRef } from "react"
import { queryMoondream } from "@/lib/services/moondream"
import { captureFrameFromVideo, compressImageDataUrl } from "@/lib/utils/frame-capture"

export interface AnalysisResult {
  prompt: string
  answer: string
  timestamp: number
  imageDataUrl?: string
}

export interface UseMoondreamAnalysisOptions {
  debounceMs?: number
  compressImage?: boolean
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

/**
 * Hook for analyzing video frames with Moondream AI
 * Based on useFrameAnalysis pattern from the reference implementation
 */
export function useMoondreamAnalysis(options: UseMoondreamAnalysisOptions = {}) {
  const {
    debounceMs = 2000,
    compressImage = true,
    maxWidth = 1280,
    maxHeight = 720,
    quality = 0.7,
  } = options

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastResult, setLastResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [history, setHistory] = useState<AnalysisResult[]>([])

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastFrameRef = useRef<string | null>(null)

  /**
   * Analyze a video frame with a custom prompt
   */
  const analyzeFrame = useCallback(
    async (videoElement: HTMLVideoElement, prompt: string, includeImage: boolean = false) => {
      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Debounce the analysis
      return new Promise<AnalysisResult>((resolve, reject) => {
        debounceTimerRef.current = setTimeout(async () => {
          try {
            setIsAnalyzing(true)
            setError(null)

            // Capture frame
            const frameDataUrl = captureFrameFromVideo(videoElement)
            if (!frameDataUrl) {
              // Don't throw error - video might not be ready yet, just skip this analysis
              console.warn("Skipping analysis: Video frame not ready", {
                readyState: videoElement.readyState,
                videoWidth: videoElement.videoWidth,
                videoHeight: videoElement.videoHeight,
              })
              setIsAnalyzing(false)
              // Return a placeholder result instead of throwing
              const placeholder: AnalysisResult = {
                prompt,
                answer: "Waiting for camera to be ready...",
                timestamp: Date.now(),
              }
              resolve(placeholder)
              return
            }

            // Skip if this is the same frame as last time
            if (frameDataUrl === lastFrameRef.current) {
              setIsAnalyzing(false)
              resolve(lastResult || { prompt, answer: "", timestamp: Date.now() })
              return
            }

            lastFrameRef.current = frameDataUrl

            // Compress image if needed
            const imageToAnalyze = compressImage
              ? await compressImageDataUrl(frameDataUrl, maxWidth, maxHeight, quality)
              : frameDataUrl

            // Query Moondream API
            const answer = await queryMoondream(imageToAnalyze, prompt)

            const result: AnalysisResult = {
              prompt,
              answer,
              timestamp: Date.now(),
              imageDataUrl: includeImage ? imageToAnalyze : undefined,
            }

            setLastResult(result)
            setHistory((prev) => [result, ...prev.slice(0, 49)]) // Keep last 50 results

            setIsAnalyzing(false)
            resolve(result)
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))
            setError(error)
            setIsAnalyzing(false)
            reject(error)
          }
        }, debounceMs)
      })
    },
    [debounceMs, compressImage, maxWidth, maxHeight, quality, lastResult]
  )

  /**
   * Clear analysis history
   */
  const clearHistory = useCallback(() => {
    setHistory([])
    setLastResult(null)
  }, [])

  return {
    analyzeFrame,
    isAnalyzing,
    lastResult,
    error,
    history,
    clearHistory,
  }
}

