import { NextRequest, NextResponse } from "next/server"
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js"

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId, stability, similarityBoost, style, useSpeakerBoost, language } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 })
    }

    const client = new ElevenLabsClient({
      apiKey: apiKey,
    })

    // Use default voice if not specified
    const voice = voiceId || "21m00Tcm4TlvDq8ikWAM" // Default: Rachel

    // Prepare TTS options
    const ttsOptions: any = {
      text: text,
      modelId: "eleven_multilingual_v2", // Use multilingual model to support all languages
      voiceSettings: {
        stability: stability ?? 0.5,
        similarityBoost: similarityBoost ?? 0.75,
        style: style ?? 0.0,
        useSpeakerBoost: useSpeakerBoost ?? true,
      },
    }

    // Add language code for multilingual model (always pass it to ensure correct language)
    if (language) {
      ttsOptions.languageCode = language
    }

    // Generate audio using the SDK
    const audio = await client.textToSpeech.convert(voice, ttsOptions)

    // Convert ReadableStream to Response
    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    })
  } catch (error: any) {
    console.error("ElevenLabs TTS error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate speech" },
      { status: 500 }
    )
  }
}
