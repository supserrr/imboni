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
    onReconnecting: (attempt: number) => void
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
        video: true,
        audio: true,
      })

      this.peerConnection = new RTCPeerConnection(WEBRTC_CONFIG)

      this.localStream.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, this.localStream!)
      })

      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0]
        this.onRemoteStream?.(this.remoteStream)
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
          this.onConnectionStateChange?.({
            connectionState: this.peerConnection.connectionState,
            iceConnectionState: this.peerConnection.iceConnectionState,
            signalingState: this.peerConnection.signalingState,
          })

          if (
            this.peerConnection.connectionState === "failed" &&
            this.reconnectionAttempts < RECONNECTION_ATTEMPTS
          ) {
            this.attemptReconnection()
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
        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription(signal.data as RTCSessionDescriptionInit)
        )
        const answer = await this.peerConnection.createAnswer()
        await this.peerConnection.setLocalDescription(answer)
        if (this.signaling && this.userId && this.otherUserId) {
          await this.signaling.sendAnswer(this.userId, this.otherUserId, answer)
        }
      } else if (signal.type === "answer" && this.isInitiator) {
        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription(signal.data as RTCSessionDescriptionInit)
        )
      } else if (signal.type === "ice-candidate") {
        await this.peerConnection.addIceCandidate(
          new RTCIceCandidate(signal.data as RTCIceCandidateInit)
        )
      } else if (signal.type === "hangup") {
        await this.endCall()
      }
    } catch (error) {
      this.onError?.(error as Error)
    }
  }

  private async createOffer(): Promise<void> {
    if (!this.peerConnection || !this.signaling || !this.userId || !this.otherUserId) {
      return
    }

    try {
      const offer = await this.peerConnection.createOffer()
      await this.peerConnection.setLocalDescription(offer)
      await this.signaling.sendOffer(this.userId, this.otherUserId, offer)
    } catch (error) {
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
  }

  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream
  }
}

