import { NextRequest, NextResponse } from "next/server"
import { pusher } from "@/lib/pusher"
import type Pusher from "pusher"

/**
 * Pusher authentication endpoint for presence channels
 * Adapted from tutorial for Next.js App Router
 * Required for WebRTC signaling using Pusher presence channels
 */
export async function POST(request: NextRequest) {
  try {
    // Pusher sends form-encoded data
    // Read the request body only once
    const contentType = request.headers.get("content-type") || ""
    
    console.log("Pusher auth request received:", { contentType })
    
    let socket_id: string | null = null
    let channel_name: string | null = null
    let username: string | null = null

    if (contentType.includes("application/x-www-form-urlencoded")) {
      // Parse form-encoded data
      const formData = await request.formData()
      socket_id = formData.get("socket_id") as string | null
      channel_name = formData.get("channel_name") as string | null
      username = formData.get("username") as string | null
      console.log("Parsed form data:", { socket_id, channel_name, username })
    } else if (contentType.includes("application/json")) {
      // Parse JSON (fallback)
      const body = await request.json()
      socket_id = body.socket_id
      channel_name = body.channel_name
      username = body.username
      console.log("Parsed JSON:", { socket_id, channel_name, username })
    } else {
      // Default: try form data (Pusher typically sends form-encoded)
      const formData = await request.formData()
      socket_id = formData.get("socket_id") as string | null
      channel_name = formData.get("channel_name") as string | null
      username = formData.get("username") as string | null
      console.log("Parsed form data (default):", { socket_id, channel_name, username })
    }

    if (!socket_id || !channel_name) {
      console.error("Missing required fields:", { socket_id, channel_name })
      return NextResponse.json(
        { error: "socket_id and channel_name are required" },
        { status: 400 }
      )
    }

    // Only allow presence channels
    if (!channel_name.startsWith("presence-")) {
      return NextResponse.json(
        { error: "Only presence channels are supported" },
        { status: 403 }
      )
    }

    // Validate Pusher instance is configured
    if (!pusher) {
      console.error("Pusher instance is not initialized")
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    // Generate random user_id (matching tutorial approach)
    const randomString = Math.random().toString(36).slice(2)

    // Create presence data (matching tutorial format)
    const presenceData = {
      user_id: randomString,
      user_info: {
        username: username ? `@${username}` : `@user_${randomString}`,
      },
    }

    // Authenticate the channel
    console.log("Authenticating channel:", { socket_id, channel_name, presenceData })
    const auth = pusher.authenticate(socket_id, channel_name, presenceData)
    console.log("Authentication successful")

    return NextResponse.json(auth)
  } catch (error) {
    console.error("Pusher authentication error:", error)
    // Log the full error for debugging
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack)
    }
    return NextResponse.json(
      { error: "Authentication failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

