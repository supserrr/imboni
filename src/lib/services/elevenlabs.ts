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
        let isQuotaError = false
        let quotaDetails: any = null
        
        if (contentType && contentType.includes("application/json")) {
          try {
            const error = await response.json()
            
            // Check for quota exceeded error from ElevenLabs API
            if (error.detail?.status === "quota_exceeded" || 
                error.detail?.message?.toLowerCase().includes("quota") ||
                error.message?.toLowerCase().includes("quota")) {
              isQuotaError = true
              quotaDetails = error.detail
              // Create user-friendly quota error message
              const quotaMsg = error.detail?.message || error.message || "Quota exceeded"
              errorMessage = `ElevenLabs API quota exceeded: ${quotaMsg}. Please check your account limits or upgrade your plan.`
            } else {
              errorMessage = error.error || error.detail?.message || error.message || errorMessage
            }
          } catch {
            // If JSON parsing fails, use status text
            errorMessage = `${response.status} ${response.statusText}`
          }
        } else {
          // If not JSON, try to get text
          try {
            const text = await response.text()
            // Check if text contains quota error
            if (text.toLowerCase().includes("quota")) {
              isQuotaError = true
              errorMessage = `ElevenLabs API quota exceeded. ${text}`
            } else {
              errorMessage = text || `${response.status} ${response.statusText}`
            }
          } catch {
            errorMessage = `${response.status} ${response.statusText}`
          }
        }
        
        // Create a more informative error for quota issues
        if (isQuotaError) {
          const quotaError = new Error(errorMessage)
          ;(quotaError as any).isQuotaError = true
          ;(quotaError as any).quotaDetails = quotaDetails
          ;(quotaError as any).statusCode = response.status
          throw quotaError
        }
        
        throw new Error(errorMessage)
      }

      // Get audio blob
      const blob = await response.blob()
      
      // Check if blob is valid and has content
      if (!blob || blob.size === 0) {
        throw new Error("Received empty audio blob from server")
      }
      
      // Check content type to ensure it's audio
      const contentType = blob.type || response.headers.get("content-type") || ""
      
      // Validate blob is actually audio data by checking first few bytes
      const arrayBuffer = await blob.slice(0, 12).arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      
      // Check for common audio file signatures
      const isMP3 = uint8Array[0] === 0xFF && (uint8Array[1] & 0xE0) === 0xE0 // MP3 header
      const isWAV = uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46 && uint8Array[3] === 0x46 // RIFF (WAV)
      const isOGG = uint8Array[0] === 0x4F && uint8Array[1] === 0x67 && uint8Array[2] === 0x67 && uint8Array[3] === 0x53 // OGG
      
      if (!isMP3 && !isWAV && !isOGG && blob.size > 12) {
        console.warn("[ElevenLabs] Blob doesn't appear to be valid audio data. First bytes:", 
          Array.from(uint8Array.slice(0, 8)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '))
      }
      
      if (!contentType.includes("audio") && !contentType.includes("mpeg") && !contentType.includes("mp3")) {
        console.warn("[ElevenLabs] Unexpected content type:", contentType, "Expected audio format. Blob size:", blob.size, "bytes")
      }
      
      // Log blob info in development
      if (process.env.NODE_ENV === 'development') {
        console.log("[ElevenLabs] Audio blob received:", {
          size: blob.size,
          type: blob.type || contentType,
          hasMP3Header: isMP3,
          hasWAVHeader: isWAV,
          hasOGGHeader: isOGG,
        })
      }
      
      const audioUrl = URL.createObjectURL(blob)

      // Play audio
      // Note: The audio format is determined by the blob's content-type
      // HTMLAudioElement doesn't have a type property, the browser detects it from the blob URL
      const audio = new Audio(audioUrl)
      
      // Add canplaythrough event to verify audio can be loaded
      audio.addEventListener('canplaythrough', () => {
        if (process.env.NODE_ENV === 'development') {
          console.log("[ElevenLabs] Audio can play through, ready to play")
        }
      }, { once: true })
      
      // Add loadedmetadata event to verify audio metadata loaded
      audio.addEventListener('loadedmetadata', () => {
        if (process.env.NODE_ENV === 'development') {
          console.log("[ElevenLabs] Audio metadata loaded:", {
            duration: audio.duration,
            readyState: audio.readyState,
            networkState: audio.networkState,
          })
        }
      }, { once: true })
      
      // Add stalled event to detect loading issues
      audio.addEventListener('stalled', () => {
        console.warn("[ElevenLabs] Audio loading stalled")
      }, { once: true })
      
      // Add suspend event to detect loading suspension
      audio.addEventListener('suspend', () => {
        console.warn("[ElevenLabs] Audio loading suspended")
      }, { once: true })
      
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
        const mediaError = target?.error
        
        // Extract meaningful error information
        if (mediaError) {
          try {
            const errorCode = mediaError.code ?? -1
            const errorMessage = mediaError.message || `Media error code: ${errorCode}`
            
            // Only log if it's not an abort error (which is expected when stopping)
            if (errorCode !== MediaError.MEDIA_ERR_ABORTED) {
              // Build error details with explicit property access to ensure serialization
              const codeName = this.getMediaErrorCodeName(errorCode)
              const networkStateName = this.getNetworkStateName(audio.networkState)
              const readyStateName = this.getReadyStateName(audio.readyState)
              const audioSrc = audio.src || 'unknown'
              
              // Create error details object with primitive values only for proper serialization
              const errorDetails = {
                code: Number(errorCode),
                message: String(errorMessage),
                codeName: String(codeName),
                audioSrc: String(audioSrc),
                networkState: Number(audio.networkState ?? -1),
                readyState: Number(audio.readyState ?? -1),
                networkStateName: String(networkStateName),
                readyStateName: String(readyStateName),
              }
              
              // Log with explicit string formatting to avoid serialization issues
              console.error(
                "[ElevenLabs] Audio playback error:",
                `Code: ${errorCode} (${codeName}),`,
                `Message: ${errorMessage},`,
                `NetworkState: ${networkStateName},`,
                `ReadyState: ${readyStateName},`,
                `Src: ${audioSrc}`
              )
              
              // Also log the structured object for debugging (using JSON.stringify to ensure serialization)
              if (process.env.NODE_ENV === 'development') {
                try {
                  console.error("[ElevenLabs] Error details:", JSON.stringify(errorDetails, null, 2))
                } catch (e) {
                  // Fallback if JSON.stringify fails
                  console.error("[ElevenLabs] Error details (fallback):", {
                    code: errorDetails.code,
                    message: errorDetails.message,
                    codeName: errorDetails.codeName,
                  })
                }
              }
              
              // If it's a format not supported error, provide helpful message
              if (errorCode === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
                console.error(
                  "[ElevenLabs] Audio format not supported by browser.",
                  "This may indicate:",
                  "1. The audio codec is not supported by this browser",
                  "2. The blob is corrupted or empty",
                  "3. The Content-Type header is incorrect",
                  "4. Browser autoplay policy is blocking playback",
                  `Blob size: ${blob?.size || 'unknown'} bytes,`,
                  `Content-Type: ${contentType || 'unknown'}`
                )
                
                // Try to provide more diagnostic info
                if (process.env.NODE_ENV === 'development') {
                  console.error("[ElevenLabs] Diagnostic info:", {
                    userAgent: navigator.userAgent,
                    audioElementReadyState: audio.readyState,
                    audioElementNetworkState: audio.networkState,
                    audioElementSrc: audio.src,
                    blobSize: blob?.size,
                    blobType: blob?.type,
                    contentType: contentType,
                  })
                }
              }
            }
          } catch (err) {
            // Fallback if accessing MediaError properties fails
            console.error("[ElevenLabs] Audio playback error (fallback):", {
              errorType: error.type,
              target: target ? 'HTMLAudioElement' : 'null',
              hasMediaError: !!mediaError,
              audioSrc: audio?.src || 'unknown',
              networkState: audio?.networkState ?? -1,
              readyState: audio?.readyState ?? -1,
              extractionError: err instanceof Error ? err.message : String(err),
            })
          }
        } else {
          // If no media error but event fired, log basic info
          console.error("[ElevenLabs] Audio error event fired but no MediaError available:", {
            errorType: error.type,
            eventTarget: target ? 'HTMLAudioElement' : 'null',
            networkState: audio.networkState ?? -1,
            readyState: audio.readyState ?? -1,
            src: audio.src || 'unknown',
            networkStateName: this.getNetworkStateName(audio.networkState),
            readyStateName: this.getReadyStateName(audio.readyState),
          })
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

        // Check if audio context needs to be resumed (browser autoplay policy)
        if (this.audioContext && this.audioContext.state === "suspended") {
          try {
            await this.audioContext.resume()
            if (process.env.NODE_ENV === 'development') {
              console.log("[ElevenLabs] Audio context resumed from suspended state")
            }
          } catch (ctxError) {
            console.warn("[ElevenLabs] Failed to resume audio context:", ctxError)
          }
        }
        
        const playPromise = audio.play()
        
        // Handle the promise with proper error handling
        await playPromise
        
        // Verify audio actually started playing
        if (audio.paused) {
          throw new Error("Audio failed to start playing - may be blocked by browser autoplay policy")
        }
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
      
      // Handle quota errors with a more user-friendly message
      if (error.isQuotaError || error.message?.includes("quota")) {
        const quotaError = new Error(
          "ElevenLabs API quota exceeded. Your account has reached its usage limit. " +
          "Please upgrade your plan or wait for your quota to reset."
        )
        ;(quotaError as any).isQuotaError = true
        ;(quotaError as any).quotaDetails = error.quotaDetails
        throw quotaError
      }
      
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
   * Get human-readable name for MediaError code
   */
  private getMediaErrorCodeName(code: number): string {
    try {
      switch (code) {
        case MediaError.MEDIA_ERR_ABORTED:
          return "MEDIA_ERR_ABORTED"
        case MediaError.MEDIA_ERR_NETWORK:
          return "MEDIA_ERR_NETWORK"
        case MediaError.MEDIA_ERR_DECODE:
          return "MEDIA_ERR_DECODE"
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          return "MEDIA_ERR_SRC_NOT_SUPPORTED"
        default:
          return `UNKNOWN_ERROR_${code}`
      }
    } catch {
      return `ERROR_CODE_${code}`
    }
  }

  /**
   * Get human-readable name for network state
   */
  private getNetworkStateName(state: number | undefined): string {
    if (state === undefined || state === null) return "UNKNOWN"
    const states = [
      "NETWORK_EMPTY",
      "NETWORK_IDLE",
      "NETWORK_LOADING",
      "NETWORK_NO_SOURCE",
    ]
    return states[state] || `UNKNOWN_NETWORK_STATE_${state}`
  }

  /**
   * Get human-readable name for ready state
   */
  private getReadyStateName(state: number | undefined): string {
    if (state === undefined || state === null) return "UNKNOWN"
    const states = [
      "HAVE_NOTHING",
      "HAVE_METADATA",
      "HAVE_CURRENT_DATA",
      "HAVE_FUTURE_DATA",
      "HAVE_ENOUGH_DATA",
    ]
    return states[state] || `UNKNOWN_READY_STATE_${state}`
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

