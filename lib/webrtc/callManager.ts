import { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, MediaStream } from 'react-native-webrtc';

/**
 * WebRTC call manager for handling peer-to-peer connections.
 * Provides end-to-end encrypted video/audio calls via DTLS-SRTP.
 */
export class CallManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private onRemoteStream?: (stream: MediaStream) => void;
  private onConnectionStateChange?: (state: string) => void;

  /**
   * STUN servers for NAT traversal (public servers for MVP).
   */
  private readonly iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  /**
   * Initializes a new peer connection.
   *
   * @param onRemoteStream - Callback when remote stream is received
   * @param onConnectionStateChange - Callback for connection state changes
   */
  async initialize(
    onRemoteStream?: (stream: MediaStream) => void,
    onConnectionStateChange?: (state: string) => void
  ): Promise<void> {
    this.onRemoteStream = onRemoteStream;
    this.onConnectionStateChange = onConnectionStateChange;

    this.peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers,
    });

    // Handle remote stream
    this.peerConnection.onaddstream = (event) => {
      if (event.stream && this.onRemoteStream) {
        this.remoteStream = event.stream;
        this.onRemoteStream(event.stream);
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection && this.onConnectionStateChange) {
        this.onConnectionStateChange(this.peerConnection.connectionState);
      }
    };

    // Handle ICE candidates (for signaling)
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // ICE candidate should be sent via signaling
        // This will be handled by the signaling service
      }
    };
  }

  /**
   * Gets local media stream (camera + microphone).
   *
   * @returns Local media stream
   */
  async getLocalStream(): Promise<MediaStream> {
    // Note: In production, use proper media constraints
    // This is a placeholder - actual implementation requires proper media access
    throw new Error('getLocalStream not fully implemented. Requires proper media access setup.');
  }

  /**
   * Creates an offer for the peer connection.
   *
   * @returns SDP offer
   */
  async createOffer(): Promise<RTCSessionDescription> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  /**
   * Sets remote description from answer.
   *
   * @param answer - SDP answer from remote peer
   */
  async setRemoteAnswer(answer: RTCSessionDescription): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(answer);
  }

  /**
   * Creates an answer for an incoming offer.
   *
   * @param offer - SDP offer from remote peer
   * @returns SDP answer
   */
  async createAnswer(offer: RTCSessionDescription): Promise<RTCSessionDescription> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  /**
   * Adds an ICE candidate.
   *
   * @param candidate - ICE candidate
   */
  async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.addIceCandidate(candidate);
  }

  /**
   * Ends the call and cleans up resources.
   */
  async endCall(): Promise<void> {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
  }

  /**
   * Gets the current peer connection state.
   *
   * @returns Connection state
   */
  getConnectionState(): string {
    return this.peerConnection?.connectionState || 'closed';
  }
}

