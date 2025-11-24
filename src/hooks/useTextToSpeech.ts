"use client"

import { useState, useCallback, useRef, useEffect } from "react"

export interface TextToSpeechOptions {
  rate?: number // 0.1 to 10, default 1
  pitch?: number // 0 to 2, default 1
  volume?: number // 0 to 1, default 1
  voice?: SpeechSynthesisVoice | null
  lang?: string
}

/**
 * Hook for text-to-speech functionality using Web Speech API
 */
export function useTextToSpeech(options: TextToSpeechOptions = {}) {
  const {
    rate = 1,
    pitch = 1,
    volume = 1,
    voice = null,
    lang = "en-US",
  } = options

  const [isSpeaking, setIsSpeaking] = useState(false)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      setAvailableVoices(voices)
    }

    loadVoices()
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }

    return () => {
      if (window.speechSynthesis.onvoiceschanged) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  /**
   * Speak text using text-to-speech
   */
  const speak = useCallback(
    (text: string, overrideOptions?: Partial<TextToSpeechOptions>) => {
      // Stop any current speech
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel()
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = overrideOptions?.rate ?? rate
      utterance.pitch = overrideOptions?.pitch ?? pitch
      utterance.volume = overrideOptions?.volume ?? volume
      utterance.lang = overrideOptions?.lang ?? lang

      if (overrideOptions?.voice || voice) {
        utterance.voice = overrideOptions?.voice || voice
      }

      utterance.onstart = () => {
        setIsSpeaking(true)
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        utteranceRef.current = null
      }

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event)
        setIsSpeaking(false)
        utteranceRef.current = null
      }

      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    },
    [rate, pitch, volume, voice, lang]
  )

  /**
   * Stop current speech
   */
  const stop = useCallback(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
    utteranceRef.current = null
  }, [])

  /**
   * Pause current speech
   */
  const pause = useCallback(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause()
      setIsSpeaking(false)
    }
  }, [])

  /**
   * Resume paused speech
   */
  const resume = useCallback(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
      setIsSpeaking(true)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    availableVoices,
  }
}

