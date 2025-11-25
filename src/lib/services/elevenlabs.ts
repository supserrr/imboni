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
  private audioContextResumed = false

  constructor() {
    if (typeof window !== "undefined") {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  /**
   * Detect if running on mobile device
   */
  private isMobile(): boolean {
    if (typeof window === "undefined") return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  /**
   * Resume audio context with user interaction (required for mobile)
   * This should be called in response to a user interaction
   */
  async resumeAudioContext(): Promise<void> {
    if (!this.audioContext) {
      if (typeof window !== "undefined") {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      } else {
        return
      }
    }

    if (this.audioContext.state === "suspended") {
      try {
        await this.audioContext.resume()
        this.audioContextResumed = true
        if (process.env.NODE_ENV === 'development') {
          console.log("[ElevenLabs] Audio context resumed successfully")
        }
      } catch (err) {
        console.warn("[ElevenLabs] Failed to resume audio context:", err)
      }
    } else {
      this.audioContextResumed = true
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

      // Get content type from response headers first
      const contentType = response.headers.get("content-type") || "audio/mpeg"
      
      // Get audio blob
      let blob = await response.blob()
      
      // Check if blob is valid and has content
      if (!blob || blob.size === 0) {
        throw new Error("Received empty audio blob from server")
      }
      
      // Ensure blob has the correct MIME type
      // Sometimes response.blob() doesn't preserve the Content-Type header
      let needsRecreate = !blob.type || blob.type === "application/octet-stream"
      
      // Validate blob is actually audio data by checking first few bytes
      const headerArrayBuffer = await blob.slice(0, 12).arrayBuffer()
      const uint8Array = new Uint8Array(headerArrayBuffer)
      
      // If blob type is wrong, recreate it with correct MIME type
      if (needsRecreate) {
        const fullArrayBuffer = await blob.arrayBuffer()
        blob = new Blob([fullArrayBuffer], { type: contentType })
      }
      
      // Check for common audio file signatures
      // MP3 can start with ID3 tag (0x49 0x44 0x33 = "ID3") or MP3 frame sync (0xFF 0xFB/0xFA/0xF2/0xF3)
      const hasID3Tag = uint8Array[0] === 0x49 && uint8Array[1] === 0x44 && uint8Array[2] === 0x33 // ID3 tag
      const hasMP3Sync = uint8Array[0] === 0xFF && (uint8Array[1] & 0xE0) === 0xE0 // MP3 frame sync
      const isMP3 = hasID3Tag || hasMP3Sync
      const isWAV = uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46 && uint8Array[3] === 0x46 // RIFF (WAV)
      const isOGG = uint8Array[0] === 0x4F && uint8Array[1] === 0x67 && uint8Array[2] === 0x67 && uint8Array[3] === 0x53 // OGG
      
      // Only warn if we really don't recognize the format and it's not empty
      if (!isMP3 && !isWAV && !isOGG && blob.size > 12 && !contentType.includes("audio")) {
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
      
      // Create blob URL with explicit type
      const audioUrl = URL.createObjectURL(blob)

      // Play audio
      // Note: The audio format is determined by the blob's content-type
      // HTMLAudioElement doesn't have a type property, the browser detects it from the blob URL
      const audio = new Audio(audioUrl)
      
      // Optimized: Start playing as soon as we have metadata (fastest possible)
      // Only wait if absolutely necessary
      let audioReady = false
      
      // Try immediate play if already ready
      if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
        audioReady = true
        if (process.env.NODE_ENV === 'development') {
          console.log("[ElevenLabs] Audio already has metadata, proceeding immediately")
        }
      } else {
        // Wait for metadata with a very short timeout (500ms)
        // This is much faster than waiting for full data
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            // If timeout but we have metadata, proceed anyway
            if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
              if (process.env.NODE_ENV === 'development') {
                console.log("[ElevenLabs] Timeout but have metadata - proceeding")
              }
              cleanup()
              audioReady = true
              resolve()
            } else {
              cleanup()
              // Last resort: try to play anyway
              audioReady = true
              resolve()
            }
          }, 500) // Very short timeout - 500ms max wait
          
          const cleanup = () => {
            clearTimeout(timeout)
            audio.removeEventListener('loadedmetadata', onMetadata)
            audio.removeEventListener('canplay', onCanPlay)
            audio.removeEventListener('error', onError)
          }
          
          const onMetadata = () => {
            if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
              cleanup()
              audioReady = true
              if (process.env.NODE_ENV === 'development') {
                console.log("[ElevenLabs] Metadata loaded, ready to play")
              }
              resolve()
            }
          }
          
          const onCanPlay = () => {
            cleanup()
            audioReady = true
            if (process.env.NODE_ENV === 'development') {
              console.log("[ElevenLabs] Audio can play")
            }
            resolve()
          }
          
          const onError = (error: Event) => {
            cleanup()
            const target = error.target as HTMLAudioElement
            const mediaError = target?.error
            if (mediaError && mediaError.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
              reject(new Error(`Audio format not supported by browser. Content-Type: ${contentType}, Blob size: ${blob.size} bytes`))
            } else {
              // Don't reject on other errors - try to play anyway
              audioReady = true
              resolve()
            }
          }
          
          audio.addEventListener('loadedmetadata', onMetadata, { once: true })
          audio.addEventListener('canplay', onCanPlay, { once: true })
          audio.addEventListener('error', onError, { once: true })
          audio.preload = 'auto'
        })
      }
      
      // Add additional event listeners for debugging
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
        // Don't revoke URL immediately - wait a bit to ensure cleanup is complete
        setTimeout(() => {
          if (audio.src === audioUrl && (audio.ended || audio.paused)) {
            URL.revokeObjectURL(audioUrl)
          }
        }, 100)
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
        // Don't revoke URL immediately on error - wait a bit
        setTimeout(() => {
          if (audio.src === audioUrl) {
            URL.revokeObjectURL(audioUrl)
          }
        }, 100)
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

      // Set mobile-friendly properties
      const isMobileDevice = this.isMobile()
      if (isMobileDevice) {
        audio.setAttribute('playsinline', 'true')
        audio.setAttribute('webkit-playsinline', 'true')
        audio.preload = 'auto'
      }

        try {
        // Check if audio element is still valid before playing
        if (!audio || !this.currentAudio || this.currentAudio !== audio) {
          // Audio was replaced or cleaned up before play() could execute
          this.isPlaying = false
          setTimeout(() => URL.revokeObjectURL(audioUrl), 100)
          return
        }

        // For mobile, ensure audio context is resumed BEFORE playing
        // Mobile browsers are very strict about this
        if (isMobileDevice && this.audioContext) {
          if (this.audioContext.state === "suspended" || !this.audioContextResumed) {
            try {
              await this.audioContext.resume()
              this.audioContextResumed = true
              if (process.env.NODE_ENV === 'development') {
                console.log("[ElevenLabs] Audio context resumed for mobile playback")
              }
            } catch (err) {
              console.warn("[ElevenLabs] Failed to resume audio context on mobile:", err)
              // Still try to play - some mobile browsers allow it
            }
          }
        }

        // Check if audio context needs to be resumed (browser autoplay policy)
        // For desktop, we can do this in parallel
        const contextResumePromise = !isMobileDevice && this.audioContext && this.audioContext.state === "suspended"
          ? this.audioContext.resume().catch(err => {
              console.warn("[ElevenLabs] Failed to resume audio context:", err)
            })
          : Promise.resolve()
        
        // Start playing
        const playPromise = audio.play()
        
        // Wait for both (on desktop) or just play (on mobile where we already resumed)
        if (isMobileDevice) {
          await playPromise
        } else {
          await Promise.all([playPromise, contextResumePromise])
        }
        
        // Verify audio actually started playing
        if (audio.paused) {
          // On mobile, try one more time after a short delay
          if (isMobileDevice) {
            await new Promise(resolve => setTimeout(resolve, 100))
            try {
              await audio.play()
              if (process.env.NODE_ENV === 'development') {
                console.log("[ElevenLabs] Audio started on retry for mobile")
              }
            } catch (retryError) {
              throw new Error("Audio failed to start playing on mobile - may be blocked by browser autoplay policy")
            }
          } else {
            throw new Error("Audio failed to start playing - may be blocked by browser autoplay policy")
          }
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
          // Delay URL revocation to prevent ERR_FILE_NOT_FOUND
          setTimeout(() => URL.revokeObjectURL(audioUrl), 100)
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
   * Resume audio context (call this on user interaction for mobile compatibility)
   */
  async resumeContext(): Promise<void> {
    await this.resumeAudioContext()
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
        
        // Don't revoke blob URL immediately - delay it to prevent ERR_FILE_NOT_FOUND
        // The audio element might still be accessing it during the load() call
        if (audioUrl && audioUrl.startsWith('blob:')) {
          setTimeout(() => {
            try {
              // Only revoke if the audio element is no longer using this URL or element is gone
              if (!audioToStop || !audioToStop.src || audioToStop.src !== audioUrl) {
                URL.revokeObjectURL(audioUrl)
              }
            } catch (err) {
              // If element is gone or inaccessible, safe to revoke
              URL.revokeObjectURL(audioUrl)
            }
          }, 500) // Longer delay to ensure audio element is done
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

