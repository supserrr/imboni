"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useTextToSpeech } from "@/hooks/useTextToSpeech"

export default function NarrationSettingsPage() {
  const { availableVoices, speak } = useTextToSpeech()
  const [narrationSpeed, setNarrationSpeed] = useState(1)
  const [selectedVoice, setSelectedVoice] = useState<string>("")
  const [autoNarrate, setAutoNarrate] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [analysisFrequency, setAnalysisFrequency] = useState(2)

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedSpeed = localStorage.getItem("narrationSpeed")
    const savedVoice = localStorage.getItem("selectedVoice")
    const savedAutoNarrate = localStorage.getItem("autoNarrate")
    const savedShowPreview = localStorage.getItem("showPreview")
    const savedFrequency = localStorage.getItem("analysisFrequency")

    if (savedSpeed) setNarrationSpeed(parseFloat(savedSpeed))
    if (savedVoice) setSelectedVoice(savedVoice)
    if (savedAutoNarrate) setAutoNarrate(savedAutoNarrate === "true")
    if (savedShowPreview) setShowPreview(savedShowPreview === "true")
    if (savedFrequency) setAnalysisFrequency(parseInt(savedFrequency, 10))
  }, [])

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem("narrationSpeed", narrationSpeed.toString())
  }, [narrationSpeed])

  useEffect(() => {
    if (selectedVoice) {
      localStorage.setItem("selectedVoice", selectedVoice)
    }
  }, [selectedVoice])

  useEffect(() => {
    localStorage.setItem("autoNarrate", autoNarrate.toString())
  }, [autoNarrate])

  useEffect(() => {
    localStorage.setItem("showPreview", showPreview.toString())
  }, [showPreview])

  useEffect(() => {
    localStorage.setItem("analysisFrequency", analysisFrequency.toString())
  }, [analysisFrequency])

  const handleTestVoice = () => {
    const voice = availableVoices.find((v) => v.name === selectedVoice)
    speak("This is a test of the text to speech voice.", {
      rate: narrationSpeed,
      voice: voice || null,
    })
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Narration</h1>

        <Card>
          <CardHeader>
            <CardTitle>Narration Speed</CardTitle>
            <CardDescription>Adjust the speed of text-to-speech narration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Slider
                min={0.5}
                max={2}
                step={0.1}
                value={[narrationSpeed]}
                onValueChange={([value]) => setNarrationSpeed(value)}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Slow (0.5x)</span>
                <span>{narrationSpeed.toFixed(1)}x</span>
                <span>Fast (2x)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Voice</CardTitle>
            <CardDescription>Select a voice for text-to-speech</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="voice-select">Voice</Label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger id="voice-select">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {availableVoices.map((voice) => (
                    <SelectItem key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleTestVoice} variant="outline" size="sm" className="w-full">
                Test Voice
              </Button>
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
                onCheckedChange={setAutoNarrate}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Camera Preview</CardTitle>
            <CardDescription>Display settings for camera feed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-preview">Show Camera Preview</Label>
                <p className="text-sm text-muted-foreground">
                  Display camera feed (for low vision users)
                </p>
              </div>
              <Switch
                id="show-preview"
                checked={showPreview}
                onCheckedChange={setShowPreview}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analysis Frequency</CardTitle>
            <CardDescription>How often to analyze the camera feed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Slider
                min={1}
                max={5}
                step={0.5}
                value={[analysisFrequency]}
                onValueChange={([value]) => setAnalysisFrequency(value)}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>1s</span>
                <span>{analysisFrequency.toFixed(1)}s</span>
                <span>5s</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

