import { createClient } from "@/lib/supabase/client"
import type { WebRTCSignal } from "@/types/webrtc"

export class WebRTCSignaling {
  private supabase = createClient()
  private channel: ReturnType<typeof this.supabase.channel> | null = null
  private onMessageCallback: ((signal: WebRTCSignal) => void) | null = null
  private onErrorCallback: ((error: Error) => void) | null = null

  async connect(
    requestId: string,
    userId: string,
    volunteerId: string,
    onMessage: (signal: WebRTCSignal) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    this.onMessageCallback = onMessage
    this.onErrorCallback = onError

    const channelName = `webrtc_signaling_${requestId}`
    this.channel = this.supabase.channel(channelName)

    this.channel.on(
      "broadcast",
      { event: "signal" },
      (payload: { payload: WebRTCSignal }) => {
        const signal = payload.payload
        if (
          (signal.from === userId && signal.to === volunteerId) ||
          (signal.from === volunteerId && signal.to === userId)
        ) {
          this.onMessageCallback?.(signal)
        }
      }
    )

    const { error } = await this.channel.subscribe()
    if (error) {
      this.onErrorCallback?.(error)
      throw error
    }
  }

  async sendOffer(
    from: string,
    to: string,
    offer: RTCSessionDescriptionInit
  ): Promise<void> {
    if (!this.channel) throw new Error("Not connected to signaling channel")

    const signal: WebRTCSignal = {
      type: "offer",
      from,
      to,
      data: offer,
    }

    const { error } = await this.channel.send({
      type: "broadcast",
      event: "signal",
      payload: signal,
    })

    if (error) {
      this.onErrorCallback?.(error)
      throw error
    }
  }

  async sendAnswer(
    from: string,
    to: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    if (!this.channel) throw new Error("Not connected to signaling channel")

    const signal: WebRTCSignal = {
      type: "answer",
      from,
      to,
      data: answer,
    }

    const { error } = await this.channel.send({
      type: "broadcast",
      event: "signal",
      payload: signal,
    })

    if (error) {
      this.onErrorCallback?.(error)
      throw error
    }
  }

  async sendIceCandidate(
    from: string,
    to: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    if (!this.channel) throw new Error("Not connected to signaling channel")

    const signal: WebRTCSignal = {
      type: "ice-candidate",
      from,
      to,
      data: candidate,
    }

    const { error } = await this.channel.send({
      type: "broadcast",
      event: "signal",
      payload: signal,
    })

    if (error) {
      this.onErrorCallback?.(error)
      throw error
    }
  }

  async sendHangup(from: string, to: string): Promise<void> {
    if (!this.channel) throw new Error("Not connected to signaling channel")

    const signal: WebRTCSignal = {
      type: "hangup",
      from,
      to,
    }

    const { error } = await this.channel.send({
      type: "broadcast",
      event: "signal",
      payload: signal,
    })

    if (error) {
      this.onErrorCallback?.(error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.supabase.removeChannel(this.channel)
      this.channel = null
    }
    this.onMessageCallback = null
    this.onErrorCallback = null
  }
}

