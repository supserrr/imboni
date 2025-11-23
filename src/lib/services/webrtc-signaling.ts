import { createClient } from "@/lib/supabase/client"
import type { WebRTCSignal } from "@/types/webrtc"

export class WebRTCSignaling {
  private supabase = createClient()
  private channel: ReturnType<typeof this.supabase.channel> | null = null
  private onMessageCallback: ((signal: WebRTCSignal) => void) | null = null
  private onErrorCallback: ((error: Error) => void) | null = null
  private isSubscribed = false

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

    const { error } = await this.channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        this.isSubscribed = true
      }
    })
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
    if (!this.channel) {
      console.warn("Cannot send offer: channel is null")
      return
    }

    const signal: WebRTCSignal = {
      type: "offer",
      from,
      to,
      data: offer,
    }

    // Wait for subscription if not yet subscribed
    if (!this.isSubscribed) {
      await new Promise<void>((resolve) => {
        const checkSubscription = setInterval(() => {
          if (this.isSubscribed || !this.channel) {
            clearInterval(checkSubscription)
            resolve()
          }
        }, 100)
        setTimeout(() => {
          clearInterval(checkSubscription)
          resolve()
        }, 5000)
      })
    }

    if (!this.channel) {
      console.warn("Channel became null while waiting for subscription")
      return
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

    // Wait for subscription if not yet subscribed
    if (!this.isSubscribed) {
      await new Promise<void>((resolve) => {
        const checkSubscription = setInterval(() => {
          if (this.isSubscribed) {
            clearInterval(checkSubscription)
            resolve()
          }
        }, 100)
        setTimeout(() => {
          clearInterval(checkSubscription)
          resolve()
        }, 5000)
      })
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

    // Wait for subscription if not yet subscribed
    if (!this.isSubscribed) {
      await new Promise<void>((resolve) => {
        const checkSubscription = setInterval(() => {
          if (this.isSubscribed) {
            clearInterval(checkSubscription)
            resolve()
          }
        }, 100)
        setTimeout(() => {
          clearInterval(checkSubscription)
          resolve()
        }, 5000)
      })
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
    if (!this.channel) {
      console.warn("Cannot send hangup: channel is null")
      return
    }

    const signal: WebRTCSignal = {
      type: "hangup",
      from,
      to,
    }

    // Wait for subscription if not yet subscribed
    if (!this.isSubscribed) {
      await new Promise<void>((resolve) => {
        const checkSubscription = setInterval(() => {
          if (this.isSubscribed || !this.channel) {
            clearInterval(checkSubscription)
            resolve()
          }
        }, 100)
        setTimeout(() => {
          clearInterval(checkSubscription)
          resolve()
        }, 5000)
      })
    }

    if (!this.channel) {
      console.warn("Channel became null while waiting for subscription")
      return
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
      try {
        await this.supabase.removeChannel(this.channel)
      } catch (error) {
        // Ignore errors during cleanup (e.g., WebSocket already closed)
        console.debug("Error removing channel during cleanup:", error)
      }
      this.channel = null
    }
    this.onMessageCallback = null
    this.onErrorCallback = null
    this.isSubscribed = false
  }
}

