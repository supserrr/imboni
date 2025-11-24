import { NextResponse } from "next/server"
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js"

export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 })
    }

    const client = new ElevenLabsClient({
      apiKey: apiKey,
    })

    const voicesResponse = await client.voices.getAll()

    // Format voices for frontend
    const formattedVoices = voicesResponse.voices.map((voice: any) => {
      // Try multiple ways to extract language information
      let language = "en" // Default to English
      
      // Check various possible locations for language info
      if (voice.labels?.language) {
        language = voice.labels.language
      } else if (voice.language) {
        language = voice.language
      } else if (voice.labels?.accent) {
        // Sometimes accent can indicate language
        language = voice.labels.accent
      } else if (voice.labels?.age) {
        // Some voices have age but not language - keep default
      }
      
      // If language is in format like "en-US", extract just "en"
      if (language && language.includes("-")) {
        language = language.split("-")[0]
      }
      
      return {
        id: voice.voiceId,
        name: voice.name,
        category: voice.category || "premade",
        description: voice.description || "",
        previewUrl: voice.previewUrl || null,
        language: language.toLowerCase(),
        // Store raw voice data for debugging
        rawLabels: voice.labels || null,
      }
    })

    return NextResponse.json({ voices: formattedVoices })
  } catch (error: any) {
    console.error("ElevenLabs voices error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch voices" },
      { status: 500 }
    )
  }
}
