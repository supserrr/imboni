"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useElevenLabs } from "@/hooks/useElevenLabs"
import { useAuth } from "@/contexts/AuthProvider"
import { userService } from "@/lib/services/user"
import type { User } from "@/types/user"

// All languages supported by ElevenLabs
const ELEVENLABS_LANGUAGES = [
  "en", "es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko", "ar", "hi",
  "nl", "pl", "tr", "sv", "no", "da", "fi", "el", "cs", "ro", "hu", "bg",
  "hr", "sr", "sk", "sl", "et", "lv", "lt", "uk", "ca", "eu", "ga", "cy",
  "mt", "is", "th", "vi", "id", "ms", "tl", "he", "fa", "ur", "bn", "ta",
  "te", "mr", "gu", "kn", "ml", "pa", "si", "my", "km", "lo", "ka", "hy",
  "az", "kk", "uz", "mn", "sw", "af", "zu", "xh", "am", "yo", "ig", "ha", "ne"
]

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", de: "German", it: "Italian",
  pt: "Portuguese", ru: "Russian", zh: "Chinese", ja: "Japanese", ko: "Korean",
  ar: "Arabic", hi: "Hindi", nl: "Dutch", pl: "Polish", tr: "Turkish",
  sv: "Swedish", no: "Norwegian", da: "Danish", fi: "Finnish", el: "Greek",
  cs: "Czech", ro: "Romanian", hu: "Hungarian", bg: "Bulgarian", hr: "Croatian",
  sr: "Serbian", sk: "Slovak", sl: "Slovenian", et: "Estonian", lv: "Latvian",
  lt: "Lithuanian", uk: "Ukrainian", ca: "Catalan", eu: "Basque", ga: "Irish",
  cy: "Welsh", mt: "Maltese", is: "Icelandic", th: "Thai", vi: "Vietnamese",
  id: "Indonesian", ms: "Malay", tl: "Filipino", he: "Hebrew", fa: "Persian",
  ur: "Urdu", bn: "Bengali", ta: "Tamil", te: "Telugu", mr: "Marathi",
  gu: "Gujarati", kn: "Kannada", ml: "Malayalam", pa: "Punjabi", si: "Sinhala",
  my: "Burmese", km: "Khmer", lo: "Lao", ka: "Georgian", hy: "Armenian",
  az: "Azerbaijani", kk: "Kazakh", uz: "Uzbek", mn: "Mongolian", sw: "Swahili",
  af: "Afrikaans", zu: "Zulu", xh: "Xhosa", am: "Amharic", yo: "Yoruba",
  ig: "Igbo", ha: "Hausa", ne: "Nepali"
}

export function NarrationSettingsPageClient() {
  const { user: authUser } = useAuth()
  const { voices, isLoading: voicesLoading, isSpeaking, speak, stop, error } = useElevenLabs()
  const [selectedVoice, setSelectedVoice] = useState<string>("")
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all")
  const [autoNarrate, setAutoNarrate] = useState(true)
  const [isTesting, setIsTesting] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // ElevenLabs voices are multilingual, but we can filter by language preference
  // Get languages that actually have voices available (from voice labels)
  const availableLanguageCodes = Array.from(
    new Set(voices.map(v => v.language || "en").filter(Boolean))
  ).sort()
  
  // Filter voices: if a language is selected, prefer voices tagged with that language
  // If no tagged voices exist, show all (since they're multilingual)
  const filteredVoices = selectedLanguage === "all" 
    ? voices 
    : (() => {
        const languageTaggedVoices = voices.filter(v => (v.language || "en") === selectedLanguage)
        // If we have voices tagged with this language, use them
        // Otherwise, all voices are multilingual and can speak this language
        return languageTaggedVoices.length > 0 ? languageTaggedVoices : voices
      })()
  
  // Auto-select first voice when language changes (if no voice is selected or current voice doesn't match)
  useEffect(() => {
    if (selectedLanguage !== "all" && filteredVoices.length > 0) {
      const currentVoice = voices.find(v => v.id === selectedVoice)
      // If no voice selected, or current voice doesn't match the language filter, auto-select first
      if (!selectedVoice || !currentVoice || !filteredVoices.find(v => v.id === selectedVoice)) {
        const firstVoice = filteredVoices[0]
        if (firstVoice) {
          setSelectedVoice(firstVoice.id)
          localStorage.setItem("selectedVoice", firstVoice.id)
          // Dispatch event for instant update
          window.dispatchEvent(new CustomEvent("localStorageChange", {
            detail: { key: "selectedVoice", newValue: firstVoice.id }
          }))
        }
      }
    }
  }, [selectedLanguage, filteredVoices, voices, selectedVoice])

  // Load saved preferences from database and localStorage
  useEffect(() => {
    const loadSettings = async () => {
      if (!authUser) return

      try {
        const userData = await userService.getProfile(authUser.id)
        setUser(userData)

        // Load from database first, then fallback to localStorage
        const dbVoice = userData?.preferred_speaker
        const dbLanguage = userData?.preferred_language
        const deviceInfo = userData?.device_info as Record<string, unknown> | null
        const dbAutoNarrate = deviceInfo?.auto_narrate as boolean | undefined
        const dbNarrationLanguage = deviceInfo?.narration_language as string | undefined

        // Set from database if available
        if (dbVoice) {
          // Validate voice ID exists in available voices
          const voiceExists = voices.some(v => v.id === dbVoice)
          if (voiceExists) {
            setSelectedVoice(dbVoice)
            localStorage.setItem("selectedVoice", dbVoice)
          } else {
            // Try to find by name (for backwards compatibility)
            const voiceByName = voices.find(v => v.name === dbVoice)
            if (voiceByName) {
              console.log("[NarrationSettings] Found voice by name, using ID:", voiceByName.id)
              setSelectedVoice(voiceByName.id)
              localStorage.setItem("selectedVoice", voiceByName.id)
              // Update database with correct ID
              if (authUser) {
                try {
                  await userService.updateProfile(authUser.id, {
                    preferred_speaker: voiceByName.id,
                  })
                } catch (error) {
                  console.error("Failed to update voice ID in database:", error)
                }
              }
            } else {
              // Invalid voice, clear it
              console.warn("[NarrationSettings] Invalid voice ID/name, clearing")
              localStorage.removeItem("selectedVoice")
              if (authUser) {
                try {
                  await userService.updateProfile(authUser.id, {
                    preferred_speaker: null,
                  })
                } catch (error) {
                  console.error("Failed to clear invalid voice from database:", error)
                }
              }
            }
          }
        } else {
          // Fallback to localStorage
          const savedVoice = localStorage.getItem("selectedVoice")
          if (savedVoice) {
            // Validate saved voice
            const voiceExists = voices.some(v => v.id === savedVoice)
            if (voiceExists) {
              setSelectedVoice(savedVoice)
            } else {
              // Try to find by name
              const voiceByName = voices.find(v => v.name === savedVoice)
              if (voiceByName) {
                setSelectedVoice(voiceByName.id)
                localStorage.setItem("selectedVoice", voiceByName.id)
              } else {
                // Invalid voice, clear it
                localStorage.removeItem("selectedVoice")
              }
            }
          }
        }

        if (dbNarrationLanguage) {
          setSelectedLanguage(dbNarrationLanguage)
          localStorage.setItem("selectedLanguage", dbNarrationLanguage)
        } else if (dbLanguage) {
          setSelectedLanguage(dbLanguage)
          localStorage.setItem("selectedLanguage", dbLanguage)
        } else {
          const savedLanguage = localStorage.getItem("selectedLanguage")
          if (savedLanguage) setSelectedLanguage(savedLanguage)
        }

        if (dbAutoNarrate !== undefined) {
          setAutoNarrate(dbAutoNarrate)
          localStorage.setItem("autoNarrate", dbAutoNarrate.toString())
        } else {
          const savedAutoNarrate = localStorage.getItem("autoNarrate")
          if (savedAutoNarrate) setAutoNarrate(savedAutoNarrate === "true")
        }
      } catch (error) {
        console.error("Failed to load narration settings:", error)
        // Fallback to localStorage only
    const savedVoice = localStorage.getItem("selectedVoice")
    const savedAutoNarrate = localStorage.getItem("autoNarrate")
    const savedLanguage = localStorage.getItem("selectedLanguage")

    if (savedVoice) setSelectedVoice(savedVoice)
    if (savedAutoNarrate) setAutoNarrate(savedAutoNarrate === "true")
    if (savedLanguage) setSelectedLanguage(savedLanguage)
      }
    }

    // Wait for voices to load before validating
    if (!voicesLoading && voices.length > 0) {
      loadSettings()
    }
  }, [authUser, voices, voicesLoading])

  // Helper function to dispatch custom storage event for same-tab updates
  const dispatchStorageEvent = (key: string, newValue: string | null) => {
    // Save to localStorage first
    if (newValue !== null) {
      localStorage.setItem(key, newValue)
    } else {
      localStorage.removeItem(key)
    }
    // Dispatch custom event for same-tab listeners (instant update)
    window.dispatchEvent(new CustomEvent("localStorageChange", {
      detail: { key, newValue }
    }))
    console.log("[NarrationSettings] Dispatched voice change:", key, newValue)
  }

  // Note: Database saves are now handled directly in the onChange handlers for instant updates
  // These useEffect hooks only handle localStorage and events for cross-component sync
  useEffect(() => {
    if (selectedVoice) {
      localStorage.setItem("selectedVoice", selectedVoice)
      dispatchStorageEvent("selectedVoice", selectedVoice)
    }
  }, [selectedVoice])

  useEffect(() => {
    localStorage.setItem("autoNarrate", autoNarrate.toString())
    dispatchStorageEvent("autoNarrate", autoNarrate.toString())
  }, [autoNarrate])

  useEffect(() => {
    localStorage.setItem("selectedLanguage", selectedLanguage)
    dispatchStorageEvent("selectedLanguage", selectedLanguage)
  }, [selectedLanguage])

  const handleTestVoice = async () => {
    if (voices.length === 0) {
      alert("No voices available. Please wait for voices to load.")
      return
    }

    // Stop any current speech
    if (isSpeaking) {
      stop()
      return
    }

    setIsTesting(true)
    try {
      const voiceId = selectedVoice || filteredVoices[0]?.id || voices[0]?.id
      if (!voiceId) {
        alert("Please select a voice first.")
        return
      }

      // Always use the selected language for testing (or "en" if "all" is selected)
      const testLanguage = selectedLanguage !== "all" ? selectedLanguage : "en"
      
      await speak("This is a test of the ElevenLabs text to speech voice.", {
        voiceId: voiceId,
        stability: 0.5,
        similarityBoost: 0.75,
        language: testLanguage,
      })
    } catch (error: any) {
      console.error("Test voice error:", error)
      alert(error.message || "Failed to test voice. Please check your API key configuration.")
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Narration</h1>

        <Card>
          <CardHeader>
            <CardTitle>Voice</CardTitle>
            <CardDescription>Select a voice for text-to-speech</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="language-filter">Filter by Language</Label>
                <Select 
                  value={selectedLanguage} 
                  onValueChange={async (lang) => {
                    // Optimistic update - update UI immediately
                    const previousLanguage = selectedLanguage
                    setSelectedLanguage(lang)
                    // Immediately save to localStorage and dispatch event
                    localStorage.setItem("selectedLanguage", lang)
                    dispatchStorageEvent("selectedLanguage", lang)
                    // Voice will be auto-selected by useEffect when language changes
                    
                    // Save to database immediately
                    if (authUser) {
                      try {
                        const deviceInfo = (user?.device_info as Record<string, unknown>) || {}
                        const updatedDeviceInfo = {
                          ...deviceInfo,
                          narration_language: lang,
                        }
                        await userService.updateProfile(authUser.id, {
                          device_info: updatedDeviceInfo,
                        })
                        setUser(prev => prev ? { ...prev, device_info: updatedDeviceInfo } : null)
                      } catch (error) {
                        console.error("Failed to save narration language to database:", error)
                        // Revert on error
                        setSelectedLanguage(previousLanguage)
                        localStorage.setItem("selectedLanguage", previousLanguage)
                        dispatchStorageEvent("selectedLanguage", previousLanguage)
                      }
                    }
                  }}
                >
                  <SelectTrigger id="language-filter" className="w-full">
                    <SelectValue placeholder="All languages" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    <SelectItem value="all">All Languages (Auto-detect)</SelectItem>
                    {ELEVENLABS_LANGUAGES.map((langCode) => {
                      const langName = LANGUAGE_NAMES[langCode] || langCode.toUpperCase()
                      const hasTaggedVoices = availableLanguageCodes.includes(langCode)
                      const voiceCount = selectedLanguage === langCode 
                        ? filteredVoices.length 
                        : voices.filter(v => (v.language || "en") === langCode).length
                      return (
                        <SelectItem 
                          key={langCode} 
                          value={langCode}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{langName} ({langCode.toUpperCase()})</span>
                            {hasTaggedVoices && voiceCount > 0 && (
                              <span className="text-xs text-muted-foreground ml-2">
                                {voiceCount} {voiceCount === 1 ? "voice" : "voices"}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="voice-select">
                  Voice {selectedLanguage !== "all" && `(${LANGUAGE_NAMES[selectedLanguage] || selectedLanguage.toUpperCase()})`}
                </Label>
                {voicesLoading ? (
                  <div className="text-sm text-muted-foreground">Loading voices...</div>
                ) : filteredVoices.length === 0 ? (
                  <div className="text-sm text-destructive">
                    {voices.length === 0 
                      ? "No voices available. Please check your API key configuration."
                      : `No voices available for ${selectedLanguage === "all" ? "selected language" : selectedLanguage.toUpperCase()}.`}
                  </div>
                ) : (
                  <Select 
                    value={selectedVoice || undefined} 
                    onValueChange={async (value) => {
                      // Optimistic update - update UI immediately
                      const previousVoice = selectedVoice
                      setSelectedVoice(value)
                      // Immediately save to localStorage and dispatch event for instant update
                      localStorage.setItem("selectedVoice", value)
                      dispatchStorageEvent("selectedVoice", value)
                      console.log("[NarrationSettings] Voice selected:", value)
                      
                      // Save to database immediately
                      if (authUser) {
                        try {
                          await userService.updateProfile(authUser.id, {
                            preferred_speaker: value,
                          })
                          setUser(prev => prev ? { ...prev, preferred_speaker: value } : null)
                        } catch (error) {
                          console.error("Failed to save voice to database:", error)
                          // Revert on error
                          setSelectedVoice(previousVoice)
                          localStorage.setItem("selectedVoice", previousVoice)
                          dispatchStorageEvent("selectedVoice", previousVoice)
                        }
                      }
                    }}
                  >
                    <SelectTrigger id="voice-select" className="w-full">
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                  <SelectContent>
                    {filteredVoices.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No voices available for this language filter. Try "All Languages".
                      </div>
                    ) : (
                      filteredVoices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>
                              {voice.name} {voice.category && `(${voice.category})`}
                            </span>
                            {voice.language && voice.language !== selectedLanguage && selectedLanguage !== "all" && (
                              <span className="text-xs text-muted-foreground ml-2">
                                [{voice.language.toUpperCase()}]
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                  </Select>
                )}
              </div>
              <Button 
                onClick={handleTestVoice} 
                variant="outline" 
                size="sm" 
                className="w-full"
                disabled={voicesLoading || filteredVoices.length === 0 || isTesting}
              >
                {voicesLoading 
                  ? "Loading voices..." 
                  : isSpeaking 
                    ? "Stop Test" 
                    : isTesting
                      ? "Testing..."
                      : "Test Voice"}
              </Button>
              {error && (
                <div className="text-sm text-destructive mt-2">{error}</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Narration Preferences</CardTitle>
            <CardDescription>Configure narration behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-narrate">Auto Narrate</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically narrate analysis results
                </p>
              </div>
              <Switch
                id="auto-narrate"
                checked={autoNarrate}
                onCheckedChange={async (checked) => {
                  // Optimistic update - update UI immediately
                  const previousValue = autoNarrate
                  setAutoNarrate(checked)
                  // Immediately save to localStorage and dispatch event
                  localStorage.setItem("autoNarrate", checked.toString())
                  dispatchStorageEvent("autoNarrate", checked.toString())
                  
                  // Save to database immediately
                  if (authUser) {
                    try {
                      const deviceInfo = (user?.device_info as Record<string, unknown>) || {}
                      const updatedDeviceInfo = {
                        ...deviceInfo,
                        auto_narrate: checked,
                      }
                      await userService.updateProfile(authUser.id, {
                        device_info: updatedDeviceInfo,
                      })
                      setUser(prev => prev ? { ...prev, device_info: updatedDeviceInfo } : null)
                    } catch (error) {
                      console.error("Failed to save autoNarrate to database:", error)
                      // Revert on error
                      setAutoNarrate(previousValue)
                      localStorage.setItem("autoNarrate", previousValue.toString())
                      dispatchStorageEvent("autoNarrate", previousValue.toString())
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

