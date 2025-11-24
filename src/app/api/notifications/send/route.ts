import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json()
    const { subscription, title, body: messageBody, data } = requestBody

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription required" },
        { status: 400 }
      )
    }

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify({
        to: subscription.endpoint,
        sound: "default",
        title,
        body: messageBody,
        data,
      }),
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

