"use client"

export interface ElevenLabsVoice {
  id: string
  name: string
  category: string
  description: string
  previewUrl: string | null
  language?: string
  rawLabels?: any
}

export interface ElevenLabsOptions {
  voiceId?: string
  stability?: number // 0.0 to 1.0
  similarityBoost?: number // 0.0 to 1.0
  style?: number // 0.0 to 1.0
  useSpeakerBoost?: boolean
  language?: string // Language code for multilingual synthesis
}

export class ElevenLabsService {
  private audioContext: AudioContext | null = null
  private currentAudio: HTMLAudioElement | null = null
  private isPlaying = false

  constructor() {
    if (typeof window !== "undefined") {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  /**
   * Fetch available voices from ElevenLabs
   */
  async getVoices(): Promise<ElevenLabsVoice[]> {
    try {
      const response = await fetch("/api/tts/voices")
      if (!response.ok) {
        // Try to get error message from response
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json()
          throw new Error(error.error || `Failed to fetch voices: ${response.status}`)
        } else {
          const text = await response.text()
          throw new Error(`Failed to fetch voices: ${response.status} ${response.statusText}`)
        }
      }
      const data = await response.json()
      return data.voices || []
    } catch (error: any) {
      console.error("Error fetching ElevenLabs voices:", error)
      throw error // Re-throw to let the hook handle it
    }
  }

  /**
   * Convert text to speech using ElevenLabs
   */
  async speak(
    text: string,
    options: ElevenLabsOptions = {}
  ): Promise<void> {
    try {
      // Stop any current playback
      this.stop()

      const response = await fetch("/api/tts/speak", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voiceId: options.voiceId,
          stability: options.stability,
          similarityBoost: options.similarityBoost,
          style: options.style,
          useSpeakerBoost: options.useSpeakerBoost,
          language: options.language,
        }),
      })

      if (!response.ok) {
        // Try to get error message from response
        const contentType = response.headers.get("content-type")
        let errorMessage = "Failed to generate speech"
        
        if (contentType && contentType.includes("application/json")) {
          try {
            const error = await response.json()
            errorMessage = error.error || errorMessage
          } catch {
            // If JSON parsing fails, use status text
            errorMessage = `${response.status} ${response.statusText}`
          }
        } else {
          // If not JSON, try to get text
          try {
            const text = await response.text()
            errorMessage = text || `${response.status} ${response.statusText}`
          } catch {
            errorMessage = `${response.status} ${response.statusText}`
          }
        }
        
        throw new Error(errorMessage)
      }

      // Get audio blob
      const blob = await response.blob()
      const audioUrl = URL.createObjectURL(blob)

      // Play audio
      const audio = new Audio(audioUrl)
      this.currentAudio = audio
      this.isPlaying = true

      audio.onended = () => {
        this.isPlaying = false
        URL.revokeObjectURL(audioUrl)
        this.currentAudio = null
      }

      audio.onerror = (error) => {
        console.error("Audio playback error:", error)
        this.isPlaying = false
        URL.revokeObjectURL(audioUrl)
        this.currentAudio = null
      }

      await audio.play()
    } catch (error: any) {
      console.error("ElevenLabs speak error:", error)
      this.isPlaying = false
      throw error
    }
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
    this.isPlaying = false
  }

  /**
   * Check if currently speaking
   */
  getIsPlaying(): boolean {
    return this.isPlaying
  }
}

// Singleton instance
let elevenLabsServiceInstance: ElevenLabsService | null = null

export function getElevenLabsService(): ElevenLabsService {
  if (!elevenLabsServiceInstance) {
    elevenLabsServiceInstance = new ElevenLabsService()
  }
  return elevenLabsServiceInstance
}

