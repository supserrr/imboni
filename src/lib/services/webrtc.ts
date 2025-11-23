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
  private pendingAnswerInterval: NodeJS.Timeout | null = null
  private offerCreated = false
  private answerCreated = false // Track if answer has been created
  private isProcessingOffer = false // Track if we're currently processing an offer
  private readySignalReceived = false
  private onReadyCallback: (() => void) | null = null
  private processedSignals = new Set<string>() // Track processed offers/answers to prevent duplicates
  private callEndedNotified = false // Prevent double notifications when call ends

  private onConnectionStateChange:
    | ((state: WebRTCConnectionState) => void)
    | null = null
  private onRemoteStream: ((stream: MediaStream) => void) | null = null
  private onError: ((error: Error) => void) | null = null
  private onReconnecting: ((attempt: number) => void) | null = null
  private onCallEnded: (() => void) | null = null

  async initialize(
    userId: string,
    otherUserId: string,
    requestId: string,
    isInitiator: boolean,
    onConnectionStateChange: (state: WebRTCConnectionState) => void,
    onRemoteStream: (stream: MediaStream) => void,
    onError: (error: Error) => void,
    onReconnecting: (attempt: number) => void,
    enableVideo: boolean = true,
    onCallEnded?: () => void
  ): Promise<void> {
    this.userId = userId
    this.otherUserId = otherUserId
    this.requestId = requestId
    this.isInitiator = isInitiator
    this.onConnectionStateChange = onConnectionStateChange
    this.onRemoteStream = onRemoteStream
    this.onError = onError
    this.onReconnecting = onReconnecting
    this.onCallEnded = onCallEnded || null

    try {
      // Check if we're in a browser environment
      if (typeof window === "undefined") {
        throw new Error("WebRTC is only available in the browser")
      }

      // Check if we're in a secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        const currentUrl = window.location.href
        throw new Error(
          `WebRTC requires a secure context (HTTPS or localhost). Current URL: ${currentUrl}. Please use http://localhost:3000 instead of an IP address.`
        )
      }

      // Check if getUserMedia is available
      if (!navigator?.mediaDevices?.getUserMedia) {
        const errorMessage = !navigator?.mediaDevices
          ? "MediaDevices API is not available in this browser"
          : "getUserMedia is not supported in this browser"
        throw new Error(errorMessage)
      }

      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: enableVideo,
        audio: true,
      })

      this.peerConnection = new RTCPeerConnection(WEBRTC_CONFIG)

      // For non-initiator (volunteer), ensure we can receive video even if not sending
      // Add a video transceiver with recvonly direction BEFORE adding tracks
      // This ensures the video line is included in the SDP when offer/answer is created
      if (!enableVideo && this.peerConnection) {
        console.log("Adding video transceiver for receiving (volunteer) before adding tracks")
        const transceiver = this.peerConnection.addTransceiver("video", { direction: "recvonly" })
        console.log("Video transceiver added:", {
          direction: transceiver.direction,
          receiverTrack: transceiver.receiver.track?.kind,
          senderTrack: transceiver.sender.track?.kind
        })
      }

      // Add tracks to peer connection (matching tutorial approach)
      // Tracks must be added BEFORE creating offer/answer
      this.localStream.getTracks().forEach((track) => {
        if (track.kind === "video" && !enableVideo) {
          track.stop()
        } else {
          if (this.peerConnection) {
            this.peerConnection.addTrack(track, this.localStream!)
            console.log(`Added ${track.kind} track to peer connection:`, {
              kind: track.kind,
              enabled: track.enabled,
              readyState: track.readyState,
              muted: track.muted,
              id: track.id
            })
            
            // Monitor track mute/unmute events for debugging
            if (track.kind === "video") {
              const handleUnmute = () => {
                console.log(`Local video track unmuted (frames are now being sent):`, {
                  trackId: track.id,
                  enabled: track.enabled,
                  readyState: track.readyState
                })
              }
              
              const handleMute = () => {
                console.warn(`Local video track muted (no frames being sent):`, {
                  trackId: track.id,
                  enabled: track.enabled,
                  readyState: track.readyState
                })
              }
              
              track.addEventListener("unmute", handleUnmute)
              track.addEventListener("mute", handleMute)
              
              // Log initial muted state
              if (track.muted) {
                console.log("Local video track is initially muted - this is normal, it will unmute when frames start")
              } else {
                console.log("Local video track is unmuted - frames should be sending")
              }
            }
          }
        }
      })
      
      console.log("Local stream tracks added:", {
        audioTracks: this.localStream.getAudioTracks().length,
        videoTracks: this.localStream.getVideoTracks().length,
        enableVideo,
        senders: this.peerConnection.getSenders().length
      })

      this.peerConnection.ontrack = (event) => {
        console.log("ontrack event received:", {
          streams: event.streams.length,
          track: event.track?.kind,
          trackId: event.track?.id,
          enabled: event.track?.enabled,
          readyState: event.track?.readyState,
          muted: event.track?.muted
        })
        
        // Monitor track mute/unmute events
        if (event.track) {
          const track = event.track
          
          // Log when track unmutes (starts sending frames)
          const handleUnmute = () => {
            console.log(`Remote ${track.kind} track unmuted (frames are now being sent):`, {
              trackId: track.id,
              enabled: track.enabled,
              readyState: track.readyState
            })
          }
          
          const handleMute = () => {
            console.log(`Remote ${track.kind} track muted (no frames being sent):`, {
              trackId: track.id,
              enabled: track.enabled,
              readyState: track.readyState
            })
          }
          
          track.addEventListener("unmute", handleUnmute)
          track.addEventListener("mute", handleMute)
          
          // If track is initially muted, log it
          if (track.muted) {
            console.log(`Remote ${track.kind} track is initially muted - waiting for frames to start`)
          } else {
            console.log(`Remote ${track.kind} track is unmuted - frames should be arriving`)
          }
        }
        
        // Simplified approach: use event.streams[0] directly when available (matching tutorial)
        if (event.streams && event.streams.length > 0) {
          this.remoteStream = event.streams[0]
          console.log("Remote stream set:", {
            id: this.remoteStream.id,
            active: this.remoteStream.active,
            tracks: this.remoteStream.getTracks().map(t => ({
              kind: t.kind,
              enabled: t.enabled,
              readyState: t.readyState,
              muted: t.muted
            }))
          })
          this.onRemoteStream?.(this.remoteStream)
        } else if (event.track) {
          // Fallback: create stream from track if streams array is empty
          if (!this.remoteStream) {
            this.remoteStream = new MediaStream()
          }
          const existingTrack = this.remoteStream.getTracks().find(t => t.id === event.track!.id)
          if (!existingTrack) {
            this.remoteStream.addTrack(event.track)
            console.log("Added track to remote stream:", {
              kind: event.track.kind,
              streamId: this.remoteStream.id,
              muted: event.track.muted
            })
            this.onRemoteStream?.(this.remoteStream)
          }
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
      if (state.connectionState === "connected" || state.connectionState === "failed" || state.connectionState === "disconnected" || state.connectionState === "closed") {
        console.log("WebRTC connection state:", state.connectionState)
        
        // Notify when connection is closed or disconnected (only if not already notified)
        // Use a synchronous check-and-set pattern to prevent race conditions
        if ((state.connectionState === "closed" || state.connectionState === "disconnected")) {
          // Check and set flag atomically to prevent race conditions
          // This ensures only one path (hangup, handlePeerLeaving, or connection state change) triggers the callback
          if (!this.callEndedNotified) {
            this.callEndedNotified = true
            console.log("Connection closed/disconnected, notifying call ended")
            this.onCallEnded?.()
          }
        }
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

      // Wait a bit to ensure signaling is fully ready and both users are subscribed
      console.log("Waiting for signaling to be fully ready...")
      await new Promise(resolve => setTimeout(resolve, 500)) // Increased delay to ensure both users are subscribed

      if (isInitiator) {
        console.log("Initiator: Setting up ready callback and waiting for ready signal from peer...")
        // Set up callback BEFORE waiting (important for race condition)
        let readyResolved = false
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            if (!readyResolved) {
              console.log("Ready signal timeout (5s), creating offer anyway")
              readyResolved = true
              resolve()
            }
          }, 5000) // 5 second timeout

          this.onReadyCallback = () => {
            if (!readyResolved) {
              console.log("Ready signal received, creating offer now")
              readyResolved = true
              clearTimeout(timeout)
              resolve()
            }
          }
        })

        console.log("Initiator: Creating offer...")
        // Check if connection is still valid before creating offer
        // (might have been cleaned up if call ended due to error)
        if (this.peerConnection && this.signaling) {
          await this.createOffer()
        } else {
          console.warn("Cannot create offer: connection was cleaned up (call may have ended)")
        }
      } else {
        // Non-initiator signals they're ready (matching tutorial pattern)
        // Add a small delay to ensure initiator has set up the callback
        await new Promise(resolve => setTimeout(resolve, 200))
        console.log("Non-initiator: Sending ready signal...")
        if (this.signaling) {
          await this.signaling.sendReady()
          console.log("Non-initiator: Ready signal sent")
        } else {
          console.error("Non-initiator: Signaling is null, cannot send ready")
        }
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
        // Create a unique key for this offer to prevent duplicate processing
        const offerKey = signal.data ? `offer-${(signal.data as RTCSessionDescriptionInit).sdp?.substring(0, 50)}` : null
        
        // Check for duplicates BEFORE processing
        if (offerKey && this.processedSignals.has(offerKey)) {
          console.log("Duplicate offer received, ignoring")
          return
        }

        // Check if we're already processing an offer (prevents concurrent processing)
        if (this.isProcessingOffer) {
          console.log("Already processing an offer, ignoring duplicate")
          return
        }
        
        // Check if answer was already created (prevents processing if answer is in progress)
        if (this.answerCreated) {
          console.log("Answer already created, ignoring duplicate offer")
          return
        }
        
        // Only process offer if we're in stable state
        if (this.peerConnection.signalingState !== "stable") {
          console.warn("Received offer but connection is not in stable state:", this.peerConnection.signalingState)
          return
        }

        // Mark this offer as processed IMMEDIATELY to prevent race conditions
        if (offerKey) {
          this.processedSignals.add(offerKey)
        }
        
        // Set processing flag to prevent concurrent processing
        this.isProcessingOffer = true
        
        console.log("Non-initiator: Received offer, processing...")

        console.log("Setting remote description (offer)...")
        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription(signal.data as RTCSessionDescriptionInit)
        )
        this.remoteDescriptionSet = true
        await this.processIceCandidateQueue()
        // Check if answer was already created
        if (this.answerCreated) {
          console.log("Answer already created for this offer, ignoring duplicate")
          this.isProcessingOffer = false // Clear processing flag before returning
          return
        }

        // Check signaling state before creating answer
        if (this.peerConnection.signalingState !== "have-remote-offer") {
          console.warn("Cannot create answer, not in have-remote-offer state:", this.peerConnection.signalingState)
          this.isProcessingOffer = false // Clear processing flag on error
          return
        }

        console.log("Creating answer...")
        // Create answer - video receive should be included if offer has video
        const answer = await this.peerConnection.createAnswer()
        console.log("Answer created, setting local description...")
        console.log("Answer SDP includes video:", answer.sdp?.includes("m=video"))
        console.log("Answer SDP video line:", answer.sdp?.split("\n").find(line => line.startsWith("m=video")))
        
        // Check state again before setting local description
        if (this.peerConnection.signalingState !== "have-remote-offer") {
          console.warn("Signaling state changed before setting answer, current state:", this.peerConnection.signalingState)
          this.isProcessingOffer = false // Clear processing flag before returning
          return
        }
        
        await this.peerConnection.setLocalDescription(answer)
        this.answerCreated = true // Mark answer as created
        this.isProcessingOffer = false // Clear processing flag
        
        if (this.signaling && this.userId && this.otherUserId) {
          console.log("Sending answer...")
          await this.signaling.sendAnswer(this.userId, this.otherUserId, answer)
          console.log("Answer sent successfully")
        }
      } else if (signal.type === "answer" && this.isInitiator) {
        // Validate answer data exists
        if (!signal.data) {
          console.warn("Received answer signal with null data, ignoring")
          return
        }

        // Create a unique key for this answer to prevent duplicate processing
        const answerKey = `answer-${(signal.data as RTCSessionDescriptionInit).sdp?.substring(0, 50)}`
        if (this.processedSignals.has(answerKey)) {
          console.log("Duplicate answer received, ignoring")
          return
        }
        
        // Mark as processed immediately to prevent race conditions
        this.processedSignals.add(answerKey)

        // Check if we're already connected - if so, ignore the answer
        if (this.peerConnection.connectionState === "connected" || 
            this.peerConnection.iceConnectionState === "connected") {
          console.log("Already connected, ignoring duplicate answer")
          return
        }

        // Only process answer if we're in have-local-offer state
        if (this.peerConnection.signalingState !== "have-local-offer") {
          // If we're in stable, the offer might not have been created yet - this is expected
          if (this.peerConnection.signalingState === "stable") {
            // This is normal - answer arrived before offer was ready, we'll store it as pending
            console.log("Received answer before offer is ready (state: stable), storing as pending")
            // Store the answer for later processing
            this.pendingAnswer = signal.data as RTCSessionDescriptionInit
            
            // If offer hasn't been created or state isn't ready, wait a bit and check again
            if (!this.offerCreated || this.peerConnection.signalingState !== "have-local-offer") {
              console.log("Answer received before offer is ready, storing and waiting...", {
                offerCreated: this.offerCreated,
                signalingState: this.peerConnection.signalingState
              })
              
              // Clear any existing interval
              if (this.pendingAnswerInterval) {
                clearInterval(this.pendingAnswerInterval)
              }
              
              // Wait for offer to be ready (max 10 seconds)
              let waitCount = 0
              this.pendingAnswerInterval = setInterval(() => {
                waitCount++
                if (this.peerConnection?.signalingState === "have-local-offer" && this.pendingAnswer) {
                  if (this.pendingAnswerInterval) {
                    clearInterval(this.pendingAnswerInterval)
                    this.pendingAnswerInterval = null
                  }
                  console.log("Offer is now ready, processing stored answer")
                  // Process the stored answer
                  const answerToProcess = this.pendingAnswer
                  this.pendingAnswer = null
                  this.handleSignalingMessage({
                    type: "answer",
                    from: signal.from,
                    to: signal.to,
                    data: answerToProcess,
                  })
                } else if (waitCount >= 50) { // 10 seconds max wait (50 * 200ms)
                  if (this.pendingAnswerInterval) {
                    clearInterval(this.pendingAnswerInterval)
                    this.pendingAnswerInterval = null
                  }
                  console.warn("Timeout waiting for offer, answer may be lost.", {
                    offerCreated: this.offerCreated,
                    signalingState: this.peerConnection?.signalingState
                  })
                  this.pendingAnswer = null
                }
              }, 200)
              return
            }
            
            // Offer was created but state is still stable - this can happen briefly during state transitions
            console.log("Offer was created but state is still stable, storing answer as pending (will process when state updates)")
            // Just store as pending and let it process when offer state changes
            this.pendingAnswer = signal.data as RTCSessionDescriptionInit
            return
          }
          
          // For other states, log a warning as this is unexpected
          console.warn("Received answer but connection is in unexpected state:", this.peerConnection.signalingState)
          
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
          
          // Mark this answer as processed
          const answerKey = signal.data ? `answer-${(signal.data as RTCSessionDescriptionInit).sdp?.substring(0, 50)}` : null
          if (answerKey) {
            this.processedSignals.add(answerKey)
          }
          
          await this.processIceCandidateQueue()
          console.log("Remote description (answer) set successfully.")
        } catch (error) {
          console.error("Failed to set remote description (answer):", error)
          throw error
        }
      } else if (signal.type === "ice-candidate") {
        await this.handleIceCandidate(signal.data as RTCIceCandidateInit)
      } else if (signal.type === "hangup") {
        console.log("Received hangup signal from peer, ending call...")
        // Notify that the call was ended by the remote peer before cleaning up
        // Set flag first to prevent concurrent connection state changes from also triggering
        const shouldNotify = !this.callEndedNotified
        if (shouldNotify) {
          this.callEndedNotified = true
          this.onCallEnded?.()
        }
        // endCall() will also set the flag, but that's safe since we already set it
        await this.endCall()
      } else if (signal.type === "subscription_succeeded") {
        // Handle subscription success (matching tutorial pattern)
        const memberCount = (signal.data as any)?.memberCount
        if (memberCount !== undefined) {
          console.log("Subscription succeeded, member count:", memberCount)
          
          // Example only supports 2 users per call (matching tutorial)
          // However, in development with React Strict Mode, we might temporarily see 3 members
          // due to double-mounting. Only fail if count is persistently > 2.
          if (memberCount > 2) {
            const isDevelopment = process.env.NODE_ENV === "development"
            if (isDevelopment) {
              // In development, be more lenient due to React Strict Mode double-mounting
              console.warn(`Development mode: Detected ${memberCount} members (expected 2). This might be due to React Strict Mode. Continuing anyway...`)
              // Don't fail - let it proceed. If there are actually too many users, it will fail during negotiation
            } else {
              // In production, enforce the limit strictly
              console.warn("Too many users in call, maximum 2 allowed")
              this.onError?.(new Error("Call is full. Maximum 2 users allowed."))
              await this.endCall()
              return
            }
          }
        }
      } else if (signal.type === "member_removed") {
        // Handle peer leaving (matching tutorial pattern)
        await this.handlePeerLeaving()
      } else if (signal.type === "ready") {
        // Handle ready signal (matching tutorial pattern)
        console.log("Received ready signal from peer in handleSignalingMessage")
        this.readySignalReceived = true
        if (this.onReadyCallback) {
          console.log("Calling onReadyCallback to proceed with offer creation")
          const callback = this.onReadyCallback
          this.onReadyCallback = null // Clear before calling to prevent double call
          callback()
        } else {
          // This is expected in some cases:
          // 1. Ready signal arrived before callback was set up (handled by timeout)
          // 2. Offer creation already started via timeout
          // 3. Non-initiator received ready signal (now filtered out in signaling layer)
          console.log("Ready signal received but onReadyCallback is null (this is expected if timeout already fired or signal was filtered)")
        }
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
      console.warn("Cannot create offer: missing required components (call may have ended)", {
        peerConnection: !!this.peerConnection,
        signaling: !!this.signaling,
        userId: !!this.userId,
        otherUserId: !!this.otherUserId
      })
      // Don't throw error - this is expected if call ended during initialization
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

      console.log("Creating WebRTC offer...")
      // Create offer - video should be included if video tracks are added
      const offer = await this.peerConnection.createOffer()
      console.log("Offer created, setting local description...")
      console.log("Offer SDP includes video:", offer.sdp?.includes("m=video"))
      console.log("Offer SDP video line:", offer.sdp?.split("\n").find(line => line.startsWith("m=video")))
      await this.peerConnection.setLocalDescription(offer)
      
      // Verify local description was set
      if (this.peerConnection.signalingState !== "have-local-offer") {
        console.error("Failed to set local description, state:", this.peerConnection.signalingState)
        throw new Error("Failed to set local description")
      }

      this.offerCreated = true
      console.log("Local description set, sending offer via signaling...")

      await this.signaling.sendOffer(this.userId, this.otherUserId, offer)
      console.log("Offer sent successfully")
      
      // If we have a pending answer, process it now that offer is ready
      if (this.pendingAnswer && this.peerConnection.signalingState === "have-local-offer") {
        // Clear any pending interval since we're processing now
        if (this.pendingAnswerInterval) {
          clearInterval(this.pendingAnswerInterval)
          this.pendingAnswerInterval = null
        }
        
        console.log("Processing pending answer after offer creation")
        // Use a small delay to ensure state is fully updated
        setTimeout(() => {
          if (this.pendingAnswer && this.peerConnection?.signalingState === "have-local-offer") {
            const answerToProcess = this.pendingAnswer
            this.pendingAnswer = null
            this.handleSignalingMessage({
              type: "answer",
              from: this.otherUserId!,
              to: this.userId!,
              data: answerToProcess,
            })
          }
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

  private async handlePeerLeaving(): Promise<void> {
    console.log("Peer left the call, cleaning up...")
    
    // Notify that the call ended because peer left
    // Set flag first to prevent concurrent endCall() or connection state changes from also triggering
    const shouldNotify = !this.callEndedNotified
    if (shouldNotify) {
      this.callEndedNotified = true
      this.onCallEnded?.()
    }
    
    // Stop receiving tracks from the peer who left (matching tutorial pattern)
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop())
      this.remoteStream = null
    }

    // Safely close the existing connection (matching tutorial pattern)
    if (this.peerConnection) {
      this.peerConnection.ontrack = null
      this.peerConnection.onicecandidate = null
      this.peerConnection.close()
      this.peerConnection = null
    }

    // Notify callback that peer left
    this.onConnectionStateChange?.({
      connectionState: "disconnected",
      iceConnectionState: "disconnected",
    })
  }

  async endCall(): Promise<void> {
    // Mark that we're ending the call to prevent duplicate notifications
    // (The caller will handle the UI update, we just need to prevent connection state change from also triggering it)
    // Only set if not already set (may have been set by hangup handler or handlePeerLeaving)
    if (!this.callEndedNotified) {
      this.callEndedNotified = true
    }
    
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
      this.peerConnection.ontrack = null
      this.peerConnection.onicecandidate = null
      this.peerConnection.close()
      this.peerConnection = null
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop())
      this.remoteStream = null
    }

    this.signaling = null
    this.reconnectionAttempts = 0
    this.iceCandidateQueue = []
    this.remoteDescriptionSet = false
    this.pendingAnswer = null
    if (this.pendingAnswerInterval) {
      clearInterval(this.pendingAnswerInterval)
      this.pendingAnswerInterval = null
    }
    this.offerCreated = false
    this.answerCreated = false // Reset answer created flag
    this.isProcessingOffer = false // Reset processing flag
    this.readySignalReceived = false
    this.onReadyCallback = null
    this.processedSignals.clear() // Clear processed signals
    this.callEndedNotified = false // Reset for next call
    console.log("Call ended and resources cleaned up.")
  }

  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream
  }
}

