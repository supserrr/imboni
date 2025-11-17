import { supabase } from '../supabase';
import { RTCSessionDescription, RTCIceCandidate } from 'react-native-webrtc';

/**
 * WebRTC signaling service using Supabase Realtime.
 * Handles SDP offer/answer and ICE candidate exchange.
 */
export class SignalingService {
  private channel: any = null;
  private callId: string;

  /**
   * Creates a new signaling service instance.
   *
   * @param callId - Call request ID
   */
  constructor(callId: string) {
    this.callId = callId;
  }

  /**
   * Initializes the signaling channel.
   *
   * @param onOffer - Callback when offer is received
   * @param onAnswer - Callback when answer is received
   * @param onIceCandidate - Callback when ICE candidate is received
   */
  initialize(
    onOffer?: (offer: RTCSessionDescription) => void,
    onAnswer?: (answer: RTCSessionDescription) => void,
    onIceCandidate?: (candidate: RTCIceCandidate) => void
  ): void {
    this.channel = supabase.channel(`webrtc_${this.callId}`);

    // Listen for signaling messages
    this.channel.on('broadcast', { event: 'offer' }, (payload: any) => {
      if (onOffer) {
        onOffer(payload.payload as RTCSessionDescription);
      }
    });

    this.channel.on('broadcast', { event: 'answer' }, (payload: any) => {
      if (onAnswer) {
        onAnswer(payload.payload as RTCSessionDescription);
      }
    });

    this.channel.on('broadcast', { event: 'ice-candidate' }, (payload: any) => {
      if (onIceCandidate) {
        onIceCandidate(payload.payload as RTCIceCandidate);
      }
    });

    this.channel.subscribe();
  }

  /**
   * Sends an SDP offer.
   *
   * @param offer - SDP offer
   */
  async sendOffer(offer: RTCSessionDescription): Promise<void> {
    if (!this.channel) {
      throw new Error('Signaling channel not initialized');
    }

    await this.channel.send({
      type: 'broadcast',
      event: 'offer',
      payload: offer,
    });
  }

  /**
   * Sends an SDP answer.
   *
   * @param answer - SDP answer
   */
  async sendAnswer(answer: RTCSessionDescription): Promise<void> {
    if (!this.channel) {
      throw new Error('Signaling channel not initialized');
    }

    await this.channel.send({
      type: 'broadcast',
      event: 'answer',
      payload: answer,
    });
  }

  /**
   * Sends an ICE candidate.
   *
   * @param candidate - ICE candidate
   */
  async sendIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    if (!this.channel) {
      throw new Error('Signaling channel not initialized');
    }

    await this.channel.send({
      type: 'broadcast',
      event: 'ice-candidate',
      payload: candidate,
    });
  }

  /**
   * Closes the signaling channel.
   */
  disconnect(): void {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

