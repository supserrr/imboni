import Foundation
import WebRTC

/// Coordinates WebRTC peer connection setup using Supabase signalling.
final class WebRTCService: NSObject {
  /// Underlying peer connection instance.
  private var peerConnection: RTCPeerConnection?
  /// Local media stream captured from the device cameras and microphone.
  private var localStream: RTCMediaStream?
  /// Callback invoked when a remote stream is received.
  var onRemoteStream: ((RTCMediaStream) -> Void)?

  /// Supabase handoff identifier used when sending signalling messages.
  private let handoffId: String

  init(handoffId: String) {
    self.handoffId = handoffId
    super.init()
  }

  /// Starts the peer connection and prepares local media tracks.
  func start() async throws {
    let factory = RTCPeerConnectionFactory()
    let configuration = RTCConfiguration()
    configuration.iceServers = [RTCIceServer(urlStrings: ["stun:stun.l.google.com:19302"])]

    peerConnection = factory.peerConnection(with: configuration, constraints: RTCMediaConstraints(), delegate: self)

    guard let peerConnection else {
      throw NSError(domain: "imboni.webrtc", code: -1, userInfo: [NSLocalizedDescriptionKey: "Unable to create peer connection"])
    }

    let audioTrack = factory.audioTrack(withTrackId: "audio")
    localStream = factory.mediaStream(withStreamId: "userStream")
    localStream?.addAudioTrack(audioTrack)
    peerConnection.add(localStream!)

    let offerConstraints = RTCMediaConstraints(mandatoryConstraints: nil, optionalConstraints: nil)
    peerConnection.offer(for: offerConstraints) { [weak self] offer, error in
      guard let self, let offer else { return }
      Task {
        try await self.setLocalDescription(offer)
        try await self.sendSignal(["description": offer.jsonDictionary()])
      }
    }
  }

  /// Handles an incoming signalling payload sent from Supabase.
  /// - Parameter payload: Dictionary representing the remote SDP or ICE candidate.
  func handleSignal(_ payload: [String: Any]) async throws {
    guard let peerConnection else { return }

    if let descriptionDict = payload["description"] as? [String: Any] {
      let typeString = descriptionDict["type"] as? String ?? "offer"
      let description = RTCSessionDescription(type: RTCSdpType.from(string: typeString), sdp: descriptionDict["sdp"] as? String ?? "")
      try await setRemoteDescription(description)
      if description.type == .offer {
        let answer = try await createAnswer()
        try await setLocalDescription(answer)
        try await sendSignal(["description": answer.jsonDictionary()])
      }
    } else if let candidateDict = payload["candidate"] as? [String: Any] {
      let candidate = RTCIceCandidate(
        sdp: candidateDict["candidate"] as? String ?? "",
        sdpMLineIndex: candidateDict["sdpMLineIndex"] as? Int32 ?? 0,
        sdpMid: candidateDict["sdpMid"] as? String
      )
      peerConnection.add(candidate)
    }
  }

  /// Closes the peer connection and releases resources.
  func stop() {
    peerConnection?.close()
    peerConnection = nil
    localStream = nil
  }

  private func setLocalDescription(_ description: RTCSessionDescription) async throws {
    try await withCheckedThrowingContinuation { continuation in
      peerConnection?.setLocalDescription(description, completionHandler: { error in
        if let error { continuation.resume(throwing: error) } else { continuation.resume() }
      })
    }
  }

  private func setRemoteDescription(_ description: RTCSessionDescription) async throws {
    try await withCheckedThrowingContinuation { continuation in
      peerConnection?.setRemoteDescription(description, completionHandler: { error in
        if let error { continuation.resume(throwing: error) } else { continuation.resume() }
      })
    }
  }

  private func createAnswer() async throws -> RTCSessionDescription {
    try await withCheckedThrowingContinuation { continuation in
      peerConnection?.answer(for: RTCMediaConstraints(mandatoryConstraints: nil, optionalConstraints: nil)) { description, error in
        if let error {
          continuation.resume(throwing: error)
        } else if let description {
          continuation.resume(returning: description)
        }
      }
    }
  }

  private func sendSignal(_ data: [String: Any]) async throws {
    let url = URL(string: "\(Environment.supabaseUrl)/functions/v1/webrtc-signaling")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("Bearer \(Environment.supabaseAnonKey)", forHTTPHeaderField: "Authorization")
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue(Environment.supabaseAnonKey, forHTTPHeaderField: "apikey" )
    let body: [String: Any] = [
      "handoffId": handoffId,
      "sender": "ios",
      "data": data,
    ]
    request.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])
    _ = try await URLSession.shared.data(for: request)
  }
}

extension WebRTCService: RTCPeerConnectionDelegate {
  func peerConnection(_ peerConnection: RTCPeerConnection, didAdd stream: RTCMediaStream) {
    onRemoteStream?(stream)
  }

  func peerConnection(_ peerConnection: RTCPeerConnection, didGenerate candidate: RTCIceCandidate) {
    Task {
      try await sendSignal(["candidate": candidate.jsonDictionary()])
    }
  }

  func peerConnection(_ peerConnection: RTCPeerConnection, didChange stateChanged: RTCSignalingState) {}
  func peerConnectionShouldNegotiate(_ peerConnection: RTCPeerConnection) {}
  func peerConnection(_ peerConnection: RTCPeerConnection, didRemove stream: RTCMediaStream) {}
  func peerConnection(_ peerConnection: RTCPeerConnection, didOpen dataChannel: RTCDataChannel) {}
  func peerConnection(_ peerConnection: RTCPeerConnection, didChange newState: RTCIceConnectionState) {}
  func peerConnection(_ peerConnection: RTCPeerConnection, didChange newState: RTCIceGatheringState) {}
  func peerConnection(_ peerConnection: RTCPeerConnection, didRemove candidates: [RTCIceCandidate]) {}
}

private extension RTCSessionDescription {
  func jsonDictionary() -> [String: Any] {
    [
      "type": type.stringValue,
      "sdp": sdp,
    ]
  }
}

private extension RTCSdpType {
  static func from(string: String) -> RTCSdpType {
    switch string.lowercased() {
    case "answer":
      return .answer
    case "pranswer":
      return .prAnswer
    default:
      return .offer
    }
  }

  var stringValue: String {
    switch self {
    case .offer:
      return "offer"
    case .answer:
      return "answer"
    case .prAnswer:
      return "pranswer"
    case .rollback:
      return "rollback"
    @unknown default:
      return "offer"
    }
  }
}

private extension RTCIceCandidate {
  func jsonDictionary() -> [String: Any] {
    [
      "candidate": sdp,
      "sdpMLineIndex": sdpMLineIndex,
      "sdpMid": sdpMid ?? "",
    ]
  }
}
