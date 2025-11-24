"use client"

import { useState, useEffect, useCallback } from "react"
import { getElevenLabsService, type ElevenLabsVoice, type ElevenLabsOptions } from "@/lib/services/elevenlabs"

export function useElevenLabs() {
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const service = getElevenLabsService()

  // Load voices on mount
  useEffect(() => {
    const loadVoices = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const availableVoices = await service.getVoices()
        setVoices(availableVoices)
        setError(null)
      } catch (err: any) {
        const errorMessage = err.message || "Failed to load voices. Please check your API key configuration."
        setError(errorMessage)
        console.error("Error loading voices:", err)
        // Don't throw - just set error state
      } finally {
        setIsLoading(false)
      }
    }

    loadVoices()
  }, [service])

  // Check speaking status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const isCurrentlyPlaying = service.getIsPlaying()
      // Only update if state changed to avoid unnecessary re-renders
      setIsSpeaking(prev => {
        if (prev !== isCurrentlyPlaying) {
          console.log("[useElevenLabs] Speaking state changed:", isCurrentlyPlaying)
          return isCurrentlyPlaying
        }
        return prev
      })
    }, 100)

    return () => clearInterval(interval)
  }, [service])

  const speak = useCallback(
    async (text: string, options: ElevenLabsOptions = {}) => {
      try {
        setError(null)
        setIsSpeaking(true)
        await service.speak(text, options)
      } catch (err: any) {
        setError(err.message || "Failed to speak")
        setIsSpeaking(false)
        throw err
      }
    },
    [service]
  )

  const stop = useCallback(() => {
    service.stop()
    setIsSpeaking(false)
  }, [service])

  return {
    voices,
    isLoading,
    isSpeaking,
    error,
    speak,
    stop,
  }
}

