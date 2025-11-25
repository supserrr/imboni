import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json()
    const { subscription, title, body: messageBody, data, sound } = requestBody

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription required" },
        { status: 400 }
      )
    }

    const payload: Record<string, unknown> = {
      to: subscription.endpoint,
      title,
      body: messageBody,
      data,
    }

    // Only include sound if it's not null (null means disabled)
    if (sound !== null && sound !== undefined) {
      payload.sound = sound
    }

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error("Failed to send notification")
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error sending notification:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send notification" },
      { status: 500 }
    )
  }
}

