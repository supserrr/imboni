import { NextRequest, NextResponse } from "next/server"

/**
 * API route handler for contact form submissions
 * Sends an email to contact@imboni.app with the form data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, message } = body

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    // Prepare email content
    const subject = `New Contact Form Submission from ${name}`
    const emailBody = `
New contact form submission from Imboni website:

Name: ${name}
Email: ${email}
Phone: ${phone || "Not provided"}
Message:
${message}

---
Sent from the Imboni contact form
`

    // Send email using Resend API
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured")
      return NextResponse.json(
        { error: "Email service is not configured. Please contact support directly." },
        { status: 500 }
      )
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "Imboni Contact <contact@imboni.app>",
        to: "contact@imboni.app",
        reply_to: email,
        subject,
        text: emailBody,
      }),
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json().catch(() => ({}))
      console.error("Resend API error:", errorData)
      throw new Error("Failed to send email")
    }

    return NextResponse.json({ 
      success: true,
      message: "Thank you for contacting us! We'll get back to you soon." 
    })
  } catch (error: any) {
    console.error("Error sending contact form:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send message. Please try again later." },
      { status: 500 }
    )
  }
}

