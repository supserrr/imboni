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
      
      // Set up event handlers before assigning to currentAudio
      audio.onended = () => {
        if (process.env.NODE_ENV === 'development') {
          console.log("[ElevenLabs] Audio playback ended")
        }
        this.isPlaying = false
        if (audio.src === audioUrl) {
          URL.revokeObjectURL(audioUrl)
        }
        if (this.currentAudio === audio) {
          this.currentAudio = null
        }
      }

      audio.onerror = (error: Event | string) => {
        // Only log non-AbortError errors
        if (typeof error === 'string') {
          console.error("[ElevenLabs] Audio playback error:", error)
          this.isPlaying = false
          return
        }
        const target = error.target as HTMLAudioElement
        if (target?.error?.code !== MediaError.MEDIA_ERR_ABORTED) {
          console.error("[ElevenLabs] Audio playback error:", error)
        }
        this.isPlaying = false
        if (audio.src === audioUrl) {
          URL.revokeObjectURL(audioUrl)
        }
        if (this.currentAudio === audio) {
          this.currentAudio = null
        }
      }
      
      // Also listen for pause events (in case audio is paused/stopped externally)
      audio.onpause = () => {
        if (process.env.NODE_ENV === 'development') {
          console.log("[ElevenLabs] Audio paused")
        }
        if (audio.ended || audio.paused) {
          this.isPlaying = false
          if (this.currentAudio === audio) {
            this.currentAudio = null
          }
        }
      }

      // Set currentAudio after handlers are set up
      this.currentAudio = audio
      this.isPlaying = true

      try {
        // Check if audio element is still valid before playing
        if (!audio || !this.currentAudio || this.currentAudio !== audio) {
          // Audio was replaced or cleaned up before play() could execute
          this.isPlaying = false
          URL.revokeObjectURL(audioUrl)
          return
        }

        const playPromise = audio.play()
        
        // Handle the promise with proper error handling
        await playPromise
      } catch (playError: any) {
        // Handle AbortError and other play() interruptions gracefully
        // AbortError occurs when navigation happens or audio is interrupted
        if (playError.name === 'AbortError' || playError.name === 'NotAllowedError') {
          // Silently handle - this is expected behavior during navigation/unmount
          // Only log in development mode
          if (process.env.NODE_ENV === 'development') {
            console.log("[ElevenLabs] Audio play() was interrupted:", playError.name)
          }
          // Clean up
          this.isPlaying = false
          if (this.currentAudio === audio) {
            this.currentAudio = null
          }
          URL.revokeObjectURL(audioUrl)
          // Don't throw - this is expected when interrupting playback
          return
        }
        // Re-throw other errors
        throw playError
      }
    } catch (error: any) {
      console.error("ElevenLabs speak error:", error)
      this.isPlaying = false
      throw error
    }
  }

  /**
   * Stop current speech immediately
   */
  stop(): void {
    if (process.env.NODE_ENV === 'development') {
      console.log("[ElevenLabs] Stopping audio playback immediately")
    }
    if (this.currentAudio) {
      try {
        // Store reference before clearing
        const audioToStop = this.currentAudio
        const audioUrl = audioToStop.src
        
        // Clear reference first to prevent race conditions
        this.currentAudio = null
        this.isPlaying = false
        
        // Then stop the audio element
        audioToStop.pause()
        audioToStop.currentTime = 0
        
        // Remove event listeners to prevent callbacks after stop
        audioToStop.onended = null
        audioToStop.onerror = null
        audioToStop.onpause = null
        
        // Load empty source to completely stop playback
        // This will abort any pending play() promises
        audioToStop.load()
        
        // Clean up the object URL if it exists
        if (audioUrl && audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(audioUrl)
        }
      } catch (error) {
        // Silently handle errors during cleanup
        if (process.env.NODE_ENV === 'development') {
          console.error("[ElevenLabs] Error stopping audio:", error)
        }
        this.currentAudio = null
        this.isPlaying = false
      }
    } else {
      this.isPlaying = false
    }
  }

  /**
   * Check if currently speaking
   */
  getIsPlaying(): boolean {
    // Also check the actual audio element state as a fallback
    if (this.currentAudio) {
      // If audio has ended or is paused, update state
      if (this.currentAudio.ended || this.currentAudio.paused) {
        if (this.isPlaying) {
          console.log("[ElevenLabs] Audio ended/paused detected, updating isPlaying to false")
          this.isPlaying = false
          this.currentAudio = null
        }
        return false
      }
      // If audio is playing, ensure state matches
      if (!this.currentAudio.paused && !this.currentAudio.ended) {
        return true
      }
    }
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

