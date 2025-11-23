import Pusher from "pusher-js"
import type { WebRTCSignal } from "@/types/webrtc"

/**
 * WebRTC signaling using Pusher Channels
 * Uses presence channels for WebRTC signaling between peers
 */
export class WebRTCSignaling {
  private pusher: Pusher | null = null
  private channel: Pusher.Channel | null = null
  private onMessageCallback: ((signal: WebRTCSignal) => void) | null = null
  private onErrorCallback: ((error: Error) => void) | null = null
  private userId: string | null = null
  private otherUserId: string | null = null

  async connect(
    requestId: string,
    userId: string,
    volunteerId: string,
    onMessage: (signal: WebRTCSignal) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    this.onMessageCallback = onMessage
    this.onErrorCallback = onError
    this.userId = userId
    this.otherUserId = volunteerId

    const channelName = `presence-webrtc_signaling_${requestId}`

    // Initialize Pusher client (matching tutorial approach)
    this.pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth",
      auth: {
        params: {
          username: userId, // Pass as username to match tutorial
        },
        headers: {},
      },
    })

    // Subscribe to presence channel
    this.channel = this.pusher.subscribe(channelName)

    // Wait for subscription and handle subscription success
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Pusher subscription timeout"))
      }, 10000)

      // Single handler for subscription_succeeded that does both: resolves promise and notifies callback
      this.channel!.bind("pusher:subscription_succeeded", (members: any) => {
        clearTimeout(timeout)
        console.log("Pusher channel subscribed:", channelName)
        console.log("Pusher subscription succeeded, members:", members.count)
        
        // Resolve the promise first
        resolve()
        
        // Then notify callback about subscription success (can be used to determine host)
        // Use setTimeout to ensure this happens after promise resolution
        setTimeout(() => {
          if (this.onMessageCallback) {
            this.onMessageCallback({
              type: "subscription_succeeded",
              from: "",
              to: "",
              data: { memberCount: members.count },
            })
          }
        }, 0)
      })

      this.channel!.bind("pusher:subscription_error", (error: any) => {
        clearTimeout(timeout)
        reject(new Error(`Pusher subscription error: ${error}`))
      })
    })

    // Bind to client events for WebRTC signaling (matching tutorial approach)
    // The tutorial sends offers/answers/ICE candidates directly, not wrapped
    this.channel.bind("client-offer", (offer: RTCSessionDescriptionInit) => {
      if (this.userId && this.otherUserId) {
        this.onMessageCallback?.({
          type: "offer",
          from: this.otherUserId, // Offer comes from the other user
          to: this.userId,
          data: offer,
        })
      }
    })

    this.channel.bind("client-answer", (answer: RTCSessionDescriptionInit) => {
      if (this.userId && this.otherUserId) {
        this.onMessageCallback?.({
          type: "answer",
          from: this.otherUserId, // Answer comes from the other user
          to: this.userId,
          data: answer,
        })
      }
    })

    this.channel.bind("client-ice-candidate", (candidate: RTCIceCandidateInit) => {
      if (this.userId && this.otherUserId) {
        this.onMessageCallback?.({
          type: "ice-candidate",
          from: this.otherUserId, // ICE candidate comes from the other user
          to: this.userId,
          data: candidate,
        })
      }
    })

    this.channel.bind("client-hangup", () => {
      if (this.userId && this.otherUserId) {
        this.onMessageCallback?.({
          type: "hangup",
          from: this.otherUserId,
          to: this.userId,
        })
      }
    })

    // Handle presence events (subscription_succeeded is already handled above)
    this.channel.bind("pusher:member_added", (member: any) => {
      console.log("User joined channel:", member.id)
    })

    this.channel.bind("pusher:member_removed", (member: any) => {
      console.log("User left channel:", member.id)
      // Notify callback about member removal (for handling peer leaving)
      if (this.onMessageCallback) {
        this.onMessageCallback({
          type: "member_removed",
          from: "",
          to: "",
          data: { memberId: member.id },
        })
      }
    })

    // Bind to client-ready event (matching tutorial pattern)
    // Include sender ID in payload to filter out our own signals
    this.channel.bind("client-ready", (data: { senderId?: string }) => {
      const senderId = data?.senderId
      // Filter out ready signals from ourselves
      if (senderId === this.userId) {
        console.log("Ignoring ready signal from ourselves")
        return
      }
      
      // Only process ready signals from the other user
      if (senderId === this.otherUserId) {
        console.log("Received client-ready signal from peer on channel")
        if (this.onMessageCallback) {
          console.log("Calling onMessageCallback with ready signal")
          this.onMessageCallback({
            type: "ready",
            from: this.otherUserId || "",
            to: this.userId || "",
          })
        } else {
          console.warn("onMessageCallback is null when ready signal received")
        }
      } else {
        console.warn("Received ready signal from unknown sender:", senderId)
      }
    })

    // Handle connection errors
    this.pusher.connection.bind("error", (error: any) => {
      console.error("Pusher connection error:", error)
      this.onErrorCallback?.(new Error(`Pusher error: ${error}`))
    })

    this.pusher.connection.bind("disconnected", () => {
      console.log("Pusher disconnected")
    })
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

    // Send offer directly (matching tutorial approach)
    try {
      console.log("Sending offer via Pusher channel:", this.channel.name)
      this.channel.trigger("client-offer", offer)
      console.log("Offer sent successfully via Pusher")
    } catch (error) {
      console.error("Error sending offer:", error)
      this.onErrorCallback?.(error as Error)
      throw error
    }
  }

  async sendAnswer(
    from: string,
    to: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    if (!this.channel) {
      throw new Error("Not connected to signaling channel")
    }

    // Send answer directly (matching tutorial approach)
    try {
      console.log("Sending answer via Pusher channel:", this.channel.name)
      this.channel.trigger("client-answer", answer)
      console.log("Answer sent successfully via Pusher")
    } catch (error) {
      console.error("Error sending answer:", error)
      this.onErrorCallback?.(error as Error)
      throw error
    }
  }

  async sendIceCandidate(
    from: string,
    to: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    if (!this.channel) {
      throw new Error("Not connected to signaling channel")
    }

    // Send ICE candidate directly (matching tutorial approach)
    try {
      this.channel.trigger("client-ice-candidate", candidate)
    } catch (error) {
      console.error("Error sending ICE candidate:", error)
      this.onErrorCallback?.(error as Error)
      throw error
    }
  }

  async sendHangup(from: string, to: string): Promise<void> {
    if (!this.channel) {
      console.warn("Cannot send hangup: channel is null")
      return
    }

    // Send hangup signal (empty payload, matching tutorial approach)
    try {
      this.channel.trigger("client-hangup", {})
    } catch (error) {
      console.error("Error sending hangup:", error)
      this.onErrorCallback?.(error as Error)
    }
  }

  async sendReady(): Promise<void> {
    if (!this.channel) {
      console.warn("Cannot send ready: channel is null")
      return
    }

    // Send ready signal (matching tutorial pattern - non-host signals they're ready)
    // Include sender ID so receivers can filter out their own signals
    try {
      console.log("Triggering client-ready event on channel:", this.channel.name)
      this.channel.trigger("client-ready", { senderId: this.userId })
      console.log("client-ready event triggered successfully")
    } catch (error) {
      console.error("Error sending ready:", error)
      this.onErrorCallback?.(error as Error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.channel) {
      try {
        this.channel.unbind_all()
        this.pusher?.unsubscribe(this.channel.name)
      } catch (error) {
        console.debug("Error unsubscribing from channel:", error)
      }
      this.channel = null
    }

    if (this.pusher) {
      try {
        this.pusher.disconnect()
      } catch (error) {
        console.debug("Error disconnecting Pusher:", error)
      }
      this.pusher = null
    }

    this.onMessageCallback = null
    this.onErrorCallback = null
    this.userId = null
    this.otherUserId = null
  }
}
