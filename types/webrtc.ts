export interface WebRTCSignal {
  type: "offer" | "answer" | "ice-candidate" | "hangup"
  from: string
  to: string
  data?: RTCSessionDescriptionInit | RTCIceCandidateInit | null
}

export interface WebRTCConnectionState {
  connectionState: RTCPeerConnectionState
  iceConnectionState: RTCIceConnectionState
  signalingState: RTCSignalingState
}

export type CallState = "idle" | "connecting" | "connected" | "rating" | "ended"

