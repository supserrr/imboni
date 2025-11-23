import { WEBRTC_CONFIG, RECONNECTION_ATTEMPTS, RECONNECTION_DELAYS } from "@/lib/constants"
import { WebRTCSignaling } from "./webrtc-signaling"
import type { WebRTCConnectionState } from "@/types/webrtc"

export class WebRTCConnection {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private signaling: WebRTCSignaling | null = null
  private isInitiator = false
  private userId: string | null = null
  private otherUserId: string | null = null
  private requestId: string | null = null
  private reconnectionAttempts = 0
  private reconnectionTimeout: NodeJS.Timeout | null = null
  private iceCandidateQueue: RTCIceCandidateInit[] = []
  private remoteDescriptionSet = false
  private pendingAnswer: RTCSessionDescriptionInit | null = null
  private offerCreated = false

  private onConnectionStateChange:
    | ((state: WebRTCConnectionState) => void)
    | null = null
  private onRemoteStream: ((stream: MediaStream) => void) | null = null
  private onError: ((error: Error) => void) | null = null
  private onReconnecting: ((attempt: number) => void) | null = null

  async initialize(
    userId: string,
    otherUserId: string,
    requestId: string,
    isInitiator: boolean,
    onConnectionStateChange: (state: WebRTCConnectionState) => void,
    onRemoteStream: (stream: MediaStream) => void,
    onError: (error: Error) => void,
    onReconnecting: (attempt: number) => void,
    enableVideo: boolean = true
  ): Promise<void> {
    this.userId = userId
    this.otherUserId = otherUserId
    this.requestId = requestId
    this.isInitiator = isInitiator
    this.onConnectionStateChange = onConnectionStateChange
    this.onRemoteStream = onRemoteStream
    this.onError = onError
    this.onReconnecting = onReconnecting

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: enableVideo,
        audio: true,
      })

      this.peerConnection = new RTCPeerConnection(WEBRTC_CONFIG)

      // Add transceivers to ensure proper track negotiation
      // This is important for ensuring the remote peer receives our tracks
      if (enableVideo) {
        this.peerConnection.addTransceiver("video", {
          direction: "sendrecv",
          streams: [this.localStream]
        })
      }
      this.peerConnection.addTransceiver("audio", {
        direction: "sendrecv",
        streams: [this.localStream]
      })

      // Also add tracks explicitly for compatibility
      this.localStream.getTracks().forEach((track) => {
        if (track.kind === "video" && !enableVideo) {
          track.stop()
        } else {
          if (this.peerConnection) {
            // Check if track is already added via transceiver
            const existingSender = this.peerConnection.getSenders().find(
              sender => sender.track?.id === track.id
            )
            
            if (!existingSender) {
              this.peerConnection.addTrack(track, this.localStream!)
              console.log(`Added ${track.kind} track to peer connection:`, {
                kind: track.kind,
                enabled: track.enabled,
                readyState: track.readyState,
                id: track.id
              })
            }
          }
        }
      })
      
      console.log("Local stream tracks added:", {
        audioTracks: this.localStream.getAudioTracks().length,
        videoTracks: this.localStream.getVideoTracks().length,
        enableVideo,
        transceivers: this.peerConnection.getTransceivers().length,
        senders: this.peerConnection.getSenders().length
      })

      this.peerConnection.ontrack = (event) => {
        console.log("ontrack event received:", {
          streams: event.streams.length,
          track: event.track?.kind,
          trackId: event.track?.id,
          enabled: event.track?.enabled,
          readyState: event.track?.readyState,
          receiver: event.receiver?.track?.kind,
          transceivers: this.peerConnection?.getTransceivers().length
        })
        
        // Get or create remote stream
        if (event.streams && event.streams.length > 0) {
          // Use the stream from the event
          this.remoteStream = event.streams[0]
        } else if (event.track) {
          // Create a new stream from the track if streams array is empty
          if (!this.remoteStream) {
            this.remoteStream = new MediaStream()
          }
          // Add track if not already in stream
          const existingTrack = this.remoteStream.getTracks().find(t => t.id === event.track!.id)
          if (!existingTrack) {
            this.remoteStream.addTrack(event.track)
          }
        }
        
        // Update and notify if we have a stream
        if (this.remoteStream) {
          console.log("Remote stream updated:", {
            id: this.remoteStream.id,
            active: this.remoteStream.active,
            tracks: this.remoteStream.getTracks().map(t => ({
              kind: t.kind,
              enabled: t.enabled,
              readyState: t.readyState,
              muted: t.muted,
              id: t.id
            }))
          })
          
          // Notify callback with the stream
          this.onRemoteStream?.(this.remoteStream)
        }
      }

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.signaling && this.userId && this.otherUserId) {
          this.signaling.sendIceCandidate(
            this.userId,
            this.otherUserId,
            event.candidate
          )
        }
      }

      this.peerConnection.onconnectionstatechange = () => {
        if (this.peerConnection) {
          const state = {
            connectionState: this.peerConnection.connectionState,
            iceConnectionState: this.peerConnection.iceConnectionState,
            signalingState: this.peerConnection.signalingState,
          }
          
          this.onConnectionStateChange?.(state)

      // Log state changes for debugging (only important states)
      if (state.connectionState === "connected" || state.connectionState === "failed" || state.connectionState === "disconnected") {
        console.log("WebRTC connection state:", state.connectionState)
      }

          if (
            this.peerConnection.connectionState === "failed" &&
            this.reconnectionAttempts < RECONNECTION_ATTEMPTS
          ) {
            this.attemptReconnection()
          }

          // Handle ICE connection failures
          if (
            this.peerConnection.iceConnectionState === "failed" &&
            this.reconnectionAttempts < RECONNECTION_ATTEMPTS
          ) {
            console.warn("ICE connection failed, attempting reconnection")
            this.attemptReconnection()
          }
        }
      }

      // Monitor ICE connection state separately
      this.peerConnection.oniceconnectionstatechange = () => {
        if (this.peerConnection) {
          const iceState = this.peerConnection.iceConnectionState
          
          // Only log important state changes
          if (iceState === "failed" || iceState === "connected" || iceState === "disconnected") {
            console.log("ICE connection state:", iceState)
          }
          
          if (iceState === "failed") {
            console.warn("ICE connection failed")
            if (this.reconnectionAttempts < RECONNECTION_ATTEMPTS) {
              this.attemptReconnection()
            }
          } else if (iceState === "connected") {
            console.log("ICE connection established")
          }
        }
      }

      this.signaling = new WebRTCSignaling()
      await this.signaling.connect(
        requestId,
        userId,
        otherUserId,
        this.handleSignalingMessage.bind(this),
        (error) => this.onError?.(error)
      )

      // Wait a bit to ensure signaling is fully ready before creating offer
      await new Promise(resolve => setTimeout(resolve, 100))

      if (isInitiator) {
        await this.createOffer()
      }
    } catch (error) {
      this.onError?.(error as Error)
      throw error
    }
  }

  private async handleSignalingMessage(signal: {
    type: string
    from: string
    to: string
    data?: RTCSessionDescriptionInit | RTCIceCandidateInit | null
  }): Promise<void> {
    if (!this.peerConnection || !this.userId) return

    try {
      if (signal.type === "offer" && !this.isInitiator) {
        // Only process offer if we're in stable state
        if (this.peerConnection.signalingState !== "stable") {
          console.warn("Received offer but connection is not in stable state:", this.peerConnection.signalingState)
          return
        }

        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription(signal.data as RTCSessionDescriptionInit)
        )
        this.remoteDescriptionSet = true
        await this.processIceCandidateQueue()
        const answer = await this.peerConnection.createAnswer()
        await this.peerConnection.setLocalDescription(answer)
        if (this.signaling && this.userId && this.otherUserId) {
          await this.signaling.sendAnswer(this.userId, this.otherUserId, answer)
        }
      } else if (signal.type === "answer" && this.isInitiator) {
        // Only process answer if we're in have-local-offer state
        if (this.peerConnection.signalingState !== "have-local-offer") {
          console.warn("Received answer but connection is not in have-local-offer state:", this.peerConnection.signalingState)
          
          // If we're in stable, the offer might not have been created yet
          if (this.peerConnection.signalingState === "stable") {
            // Store the answer for later processing
            this.pendingAnswer = signal.data as RTCSessionDescriptionInit
            
            // If offer hasn't been created, wait a bit and check again
            if (!this.offerCreated) {
              console.log("Answer received before offer created, storing and waiting...")
              // Wait for offer to be created (max 5 seconds)
              let waitCount = 0
              const checkOffer = setInterval(() => {
                waitCount++
                if (this.peerConnection?.signalingState === "have-local-offer" && this.pendingAnswer) {
                  clearInterval(checkOffer)
                  // Process the stored answer
                  this.handleSignalingMessage({
                    type: "answer",
                    from: signal.from,
                    to: signal.to,
                    data: this.pendingAnswer,
                  })
                  this.pendingAnswer = null
                } else if (waitCount >= 25) { // 5 seconds max wait
                  clearInterval(checkOffer)
                  console.error("Timeout waiting for offer, answer may be lost")
                  this.pendingAnswer = null
                }
              }, 200)
              return
            }
            
            // Offer was created but state is still stable, retry a few times
            const retryCount = (signal as any).retryCount || 0
            if (retryCount < 5) {
              setTimeout(() => {
                this.handleSignalingMessage({
                  ...signal,
                  retryCount: retryCount + 1,
                } as any)
              }, 300)
            } else {
              console.error("Answer retry limit reached, connection may be in invalid state")
              // Don't try to recreate offer if we're already in the process
              // Just log the error and let the connection fail gracefully
              this.onError?.(new Error("Failed to establish connection: answer arrived before offer was ready"))
            }
            return
          }
          
          // If in have-remote-offer, we might have received an offer we shouldn't have
          if (this.peerConnection.signalingState === "have-remote-offer") {
            console.warn("Received answer while in have-remote-offer state, resetting connection")
            await this.peerConnection.setRemoteDescription(null)
            // Retry after reset
            setTimeout(() => {
              this.handleSignalingMessage(signal)
            }, 100)
            return
          }
          return
        }

        try {
          await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription(signal.data as RTCSessionDescriptionInit)
          )
          this.remoteDescriptionSet = true
          this.pendingAnswer = null // Clear any pending answer
          await this.processIceCandidateQueue()
        } catch (error) {
          console.error("Failed to set remote description (answer):", error)
          throw error
        }
      } else if (signal.type === "ice-candidate") {
        await this.handleIceCandidate(signal.data as RTCIceCandidateInit)
      } else if (signal.type === "hangup") {
        await this.endCall()
      }
    } catch (error) {
      console.error("Error handling signaling message:", error)
      this.onError?.(error as Error)
    }
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return

    if (!this.remoteDescriptionSet) {
      this.iceCandidateQueue.push(candidate)
      return
    }

    try {
      if (this.peerConnection.remoteDescription) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
      } else {
        this.iceCandidateQueue.push(candidate)
      }
    } catch (error) {
      console.warn("Failed to add ICE candidate:", error)
    }
  }

  private async processIceCandidateQueue(): Promise<void> {
    if (!this.peerConnection || this.iceCandidateQueue.length === 0) return

    while (this.iceCandidateQueue.length > 0) {
      const candidate = this.iceCandidateQueue.shift()
      if (candidate && this.peerConnection.remoteDescription) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (error) {
          console.warn("Failed to add queued ICE candidate:", error)
        }
      }
    }
  }

  private async createOffer(): Promise<void> {
    if (!this.peerConnection || !this.signaling || !this.userId || !this.otherUserId) {
      return
    }

    // Prevent multiple simultaneous offer creations
    if (this.offerCreated) {
      console.log("Offer already created, skipping")
      return
    }

    try {
      // Ensure we're in stable state before creating offer
      if (this.peerConnection.signalingState !== "stable") {
        console.warn("Cannot create offer, connection is not in stable state:", this.peerConnection.signalingState)
        // If we're in have-local-offer, offer was already created
        if (this.peerConnection.signalingState === "have-local-offer") {
          this.offerCreated = true
          return
        }
        // Reset connection if in wrong state
        if (this.peerConnection.signalingState === "have-remote-offer") {
          await this.peerConnection.setRemoteDescription(null)
        }
        return
      }

      const offer = await this.peerConnection.createOffer()
      await this.peerConnection.setLocalDescription(offer)
      
      // Verify local description was set
      if (this.peerConnection.signalingState !== "have-local-offer") {
        console.error("Failed to set local description, state:", this.peerConnection.signalingState)
        throw new Error("Failed to set local description")
      }

      this.offerCreated = true

      await this.signaling.sendOffer(this.userId, this.otherUserId, offer)
      
      // If we have a pending answer, process it now
      if (this.pendingAnswer && this.peerConnection.signalingState === "have-local-offer") {
        console.log("Processing pending answer after offer creation")
        setTimeout(() => {
          this.handleSignalingMessage({
            type: "answer",
            from: this.otherUserId!,
            to: this.userId!,
            data: this.pendingAnswer!,
          })
        }, 100)
      }
    } catch (error) {
      console.error("Error creating offer:", error)
      this.offerCreated = false // Reset on error
      this.onError?.(error as Error)
    }
  }

  private async attemptReconnection(): Promise<void> {
    if (this.reconnectionAttempts >= RECONNECTION_ATTEMPTS) {
      this.onError?.(new Error("Max reconnection attempts reached"))
      return
    }

    const delay = RECONNECTION_DELAYS[this.reconnectionAttempts] || 16000
    this.reconnectionAttempts++
    this.onReconnecting?.(this.reconnectionAttempts)

    this.reconnectionTimeout = setTimeout(async () => {
      try {
        if (this.isInitiator) {
          await this.createOffer()
        }
      } catch (error) {
        this.onError?.(error as Error)
      }
    }, delay)
  }

  async toggleMute(): Promise<boolean> {
    if (!this.localStream) return false

    const audioTrack = this.localStream.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      return audioTrack.enabled
    }
    return false
  }

  async toggleVideo(): Promise<boolean> {
    if (!this.localStream) return false

    const videoTrack = this.localStream.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled
      return videoTrack.enabled
    }
    return false
  }

  hasVideo(): boolean {
    if (!this.localStream) return false
    const videoTrack = this.localStream.getVideoTracks()[0]
    return videoTrack !== undefined
  }

  async switchCamera(): Promise<void> {
    if (!this.localStream) return

    const videoTrack = this.localStream.getVideoTracks()[0]
    if (!videoTrack) return

    const constraints = videoTrack.getConstraints()
    const facingMode =
      constraints.facingMode === "user" ? "environment" : "user"

    try {
      await videoTrack.applyConstraints({ facingMode })
    } catch (error) {
      this.onError?.(error as Error)
    }
  }

  async endCall(): Promise<void> {
    if (this.reconnectionTimeout) {
      clearTimeout(this.reconnectionTimeout)
      this.reconnectionTimeout = null
    }

    if (this.signaling && this.userId && this.otherUserId) {
      await this.signaling.sendHangup(this.userId, this.otherUserId)
      await this.signaling.disconnect()
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
      this.localStream = null
    }

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    this.remoteStream = null
    this.signaling = null
    this.reconnectionAttempts = 0
    this.iceCandidateQueue = []
    this.remoteDescriptionSet = false
    this.pendingAnswer = null
    this.offerCreated = false
  }

  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream
  }
}

