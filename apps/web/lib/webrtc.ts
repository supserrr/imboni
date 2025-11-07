import type { SupabaseClient } from '@supabase/supabase-js';
import { sendWebRTCSignal } from '@imboni/api-client';
import type { WebRTCSignal } from '@imboni/shared';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

/**
 * Configuration required to bootstrap the WebRTC helper.
 */
export interface WebRTCConfiguration {
  /** Active Supabase client instance used for signalling. */
  readonly supabase: SupabaseClient;
  /** Identifier of the current handoff session. */
  readonly handoffId: string;
  /** Callback invoked when a remote media stream is received. */
  readonly onRemoteStream: (stream: MediaStream) => void;
  /** Identifier representing the sender (user or volunteer). */
  readonly senderId?: string;
}

/**
 * Orchestrates peer connection setup and signalling for the browser client.
 */
export class WebRTCClient {
  private readonly configuration: WebRTCConfiguration;
  private peer?: RTCPeerConnection;
  private localStream?: MediaStream;

  public constructor(configuration: WebRTCConfiguration) {
    this.configuration = configuration;
  }

  /**
   * Initialises the peer connection and acquires the local camera/microphone streams.
   * @returns The captured local media stream.
   */
  public async prepare(): Promise<MediaStream> {
    if (this.peer) {
      return this.localStream ?? new MediaStream();
    }

    this.peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    this.localStream.getTracks().forEach((track) => {
      this.peer?.addTrack(track, this.localStream as MediaStream);
    });

    this.peer.addEventListener('track', (event) => {
      const stream = event.streams[0];
      if (stream) {
        this.configuration.onRemoteStream(stream);
      }
    });

    this.peer.addEventListener('icecandidate', async (event) => {
      if (event.candidate) {
        await this.sendSignal({ data: { candidate: event.candidate.toJSON() }, sender: this.sender });
      }
    });

    return this.localStream;
  }

  /**
   * Starts the call by creating and broadcasting an SDP offer to the volunteer client.
   */
  public async startCall(): Promise<void> {
    await this.ensurePeer();
    const offer = await this.peer!.createOffer();
    await this.peer!.setLocalDescription(offer);
    await this.sendSignal({ data: { description: offer }, sender: this.sender });
  }

  /**
   * Handles a signalling message received from the Supabase broadcast channel.
   * @param signal Incoming signal payload.
   */
  public async handleSignal(signal: WebRTCSignal): Promise<void> {
    await this.ensurePeer();

    if (!signal.data) {
      return;
    }

    if ('description' in (signal.data as Record<string, unknown>)) {
      const description = (signal.data as { description: RTCSessionDescriptionInit }).description;
      if (!description) {
        return;
      }

      const remoteDesc = new RTCSessionDescription(description);
      await this.peer!.setRemoteDescription(remoteDesc);

      if (description.type === 'offer') {
        const answer = await this.peer!.createAnswer();
        await this.peer!.setLocalDescription(answer);
        await this.sendSignal({ data: { description: answer }, sender: this.sender });
      }
    } else if ('candidate' in (signal.data as Record<string, unknown>)) {
      const candidate = (signal.data as { candidate: RTCIceCandidateInit }).candidate;
      if (candidate) {
        await this.peer!.addIceCandidate(new RTCIceCandidate(candidate));
      }
    }
  }

  /**
   * Tears down the active peer connection and releases local media tracks.
   */
  public close(): void {
    this.peer?.close();
    this.peer = undefined;
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.localStream = undefined;
  }

  private get sender(): string {
    return this.configuration.senderId ?? 'user';
  }

  private async ensurePeer(): Promise<void> {
    if (!this.peer) {
      await this.prepare();
    }
  }

  private async sendSignal(signal: Omit<WebRTCSignal, 'handoffId'>): Promise<void> {
    await sendWebRTCSignal(this.configuration.supabase, this.configuration.handoffId, signal);
  }
}
