import { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, MediaStream, mediaDevices } from 'react-native-webrtc';

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

export class WebRTCManager {
  peerConnection: RTCPeerConnection | null = null;
  localStream: MediaStream | null = null;
  remoteStream: MediaStream | null = null;
  onRemoteStream: ((stream: MediaStream) => void) | null = null;
  onIceCandidate: ((candidate: RTCIceCandidate) => void) | null = null;

  async startLocalStream() {
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    this.localStream = stream;
    return stream;
  }

  createPeerConnection() {
    this.peerConnection = new RTCPeerConnection(configuration);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidate) {
        this.onIceCandidate(event.candidate);
      }
    };

    this.peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
             this.remoteStream = event.streams[0];
             if (this.onRemoteStream) {
                 this.onRemoteStream(this.remoteStream);
             }
        }
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });
    }

    return this.peerConnection;
  }

  async createOffer() {
    if (!this.peerConnection) this.createPeerConnection();
    const offer = await this.peerConnection!.createOffer({});
    await this.peerConnection!.setLocalDescription(offer);
    return offer;
  }

  async createAnswer() {
    if (!this.peerConnection) this.createPeerConnection();
    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);
    return answer;
  }

  async setRemoteDescription(desc: RTCSessionDescription) {
    if (!this.peerConnection) this.createPeerConnection();
    await this.peerConnection!.setRemoteDescription(desc);
  }

  async addIceCandidate(candidate: RTCIceCandidate) {
    if (!this.peerConnection) return;
    await this.peerConnection.addIceCandidate(candidate);
  }

  cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.remoteStream = null;
  }
}

export const webRTCManager = new WebRTCManager();

