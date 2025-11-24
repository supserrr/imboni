"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { PermissionPrompt } from "@/components/PermissionPrompt"
import { useCameraPermissions } from "@/hooks/useCameraPermissions"
import { Play, Square, Mic, Send, Type } from "lucide-react"
import { Input } from "@/components/ui/input"
import { queryMoondream } from "@/lib/services/moondream"
import { captureFrameFromVideo } from "@/lib/utils/frame-capture"

const MOONDREAM_API_URL = process.env.NEXT_PUBLIC_MOONDREAM_API_URL || "https://api.moondream.ai/v1"

export default function HomePage() {
  const { permissionStatus, requestPermission, checkPermission } = useCameraPermissions()
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [inputMode, setInputMode] = useState<"none" | "text" | "voice">("none")
  const [showModeSelection, setShowModeSelection] = useState(false)
  const [question, setQuestion] = useState<string>("")
  const [answer, setAnswer] = useState<string>("")
  const [answerHistory, setAnswerHistory] = useState<Array<{ id: string; text: string; timestamp: number }>>([])
  const [textQuery, setTextQuery] = useState<string>("")
  const [customQuery, setCustomQuery] = useState<string>("")
  const [analysisHistory, setAnalysisHistory] = useState<string[]>([])
  const [latestBackgroundAnalysis, setLatestBackgroundAnalysis] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  // Narration settings from localStorage
  const [narrationSpeed, setNarrationSpeed] = useState(1)
  const [selectedVoice, setSelectedVoice] = useState<string>("")
  const [autoNarrate, setAutoNarrate] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [analysisFrequency, setAnalysisFrequency] = useState(2)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const analysisLoopRef = useRef<boolean>(false)
  const isAnsweringQuestionRef = useRef<boolean>(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<any>(null)
  const synthesisRef = useRef<SpeechSynthesis | null>(null)
  const inputModeRef = useRef<"none" | "text" | "voice">("none")
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    checkPermission()
  }, [checkPermission])

  // Load narration settings from localStorage
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
    if (savedFrequency) setAnalysisFrequency(parseFloat(savedFrequency))
  }, [])

  // Load available voices and listen for changes
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices()
        setAvailableVoices(voices)
      }
    }

    loadVoices()
    if (typeof window !== "undefined" && window.speechSynthesis.onvoiceschanged) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis.onvoiceschanged) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  // Listen for changes to narration settings in localStorage (from settings page)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "narrationSpeed" && e.newValue) {
        setNarrationSpeed(parseFloat(e.newValue))
      } else if (e.key === "selectedVoice" && e.newValue !== null) {
        setSelectedVoice(e.newValue)
      } else if (e.key === "autoNarrate" && e.newValue !== null) {
        setAutoNarrate(e.newValue === "true")
      } else if (e.key === "showPreview" && e.newValue !== null) {
        setShowPreview(e.newValue === "true")
      } else if (e.key === "analysisFrequency" && e.newValue) {
        setAnalysisFrequency(parseFloat(e.newValue))
      }
    }

    window.addEventListener("storage", handleStorageChange)
    
    // Also listen for custom events (for same-tab updates)
    const handleCustomStorageChange = () => {
      const savedSpeed = localStorage.getItem("narrationSpeed")
      const savedVoice = localStorage.getItem("selectedVoice")
      const savedAutoNarrate = localStorage.getItem("autoNarrate")
      const savedShowPreview = localStorage.getItem("showPreview")
      const savedFrequency = localStorage.getItem("analysisFrequency")

      if (savedSpeed) setNarrationSpeed(parseFloat(savedSpeed))
      if (savedVoice !== null) setSelectedVoice(savedVoice)
      if (savedAutoNarrate !== null) setAutoNarrate(savedAutoNarrate === "true")
      if (savedShowPreview !== null) setShowPreview(savedShowPreview === "true")
      if (savedFrequency) setAnalysisFrequency(parseFloat(savedFrequency))
    }

    // Poll for changes (since localStorage events don't fire in same tab)
    const interval = setInterval(handleCustomStorageChange, 1000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  // Initialize audio context for sound effects
  useEffect(() => {
    if (typeof window !== "undefined" && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }, [])

  // Sound effect generator using Web Audio API
  const playSound = async (frequency: number, duration: number, type: "sine" | "square" | "triangle" = "sine") => {
    if (!audioContextRef.current) {
      if (typeof window !== "undefined") {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      } else {
        return
      }
    }
    
    try {
      // Resume audio context if suspended (browser autoplay policy)
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume()
      }
      
      const oscillator = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)
      
      oscillator.frequency.value = frequency
      oscillator.type = type
      
      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration)
      
      oscillator.start(audioContextRef.current.currentTime)
      oscillator.stop(audioContextRef.current.currentTime + duration)
    } catch (err) {
      console.error("Error playing sound:", err)
    }
  }

  // Sound effects for different states - all unique frequencies and patterns
  const playAnalyzingSound = () => playSound(440, 0.1, "sine") // A4 note, short beep
  const playAnswerReadySound = () => playSound(523.25, 0.15, "sine") // C5 note
  const playListeningSound = () => playSound(330, 0.08, "triangle") // E4 note, subtle
  const playErrorSound = () => playSound(220, 0.2, "square") // A3 note, lower tone
  const playStopSound = async () => {
    // Descending tone pattern for stop
    await playSound(392, 0.08, "sine") // G4
    setTimeout(() => playSound(294, 0.1, "sine"), 50) // D4
  }
  const playTextModeSound = async () => {
    // Two-tone ascending pattern for text mode
    await playSound(349.23, 0.1, "sine") // F4
    setTimeout(() => playSound(440, 0.1, "sine"), 80) // A4
  }
  const playVoiceModeSound = async () => {
    // Three-tone pattern for voice mode
    await playSound(261.63, 0.08, "triangle") // C4
    setTimeout(() => playSound(329.63, 0.08, "triangle"), 60) // E4
    setTimeout(() => playSound(392, 0.1, "triangle"), 120) // G4
  }

  const analyzeFrame = async (query: string) => {
    if (!videoRef.current || !isStreaming) {
      return null
    }

    try {
      // Capture frame from video
      const frameDataUrl = captureFrameFromVideo(videoRef.current)
      if (!frameDataUrl) {
        return null
      }

      // Query Moondream API
      const response = await queryMoondream(frameDataUrl, query, MOONDREAM_API_URL)
      return response
    } catch (err: any) {
      console.error("Error analyzing frame:", err)
      setError(err.message || "Failed to analyze image")
      return null
    }
  }

  const handleQuestion = async (questionText: string) => {
    if (!videoRef.current || !isStreaming) {
      setError("Camera is not ready")
      return
    }

    // Prevent processing if already answering
    if (isAnsweringQuestionRef.current) {
      console.log("Already processing a question, ignoring:", questionText)
      return
    }

    // Cancel any ongoing speech when new question comes in (interruption support)
    if (isSpeaking && synthesisRef.current) {
      synthesisRef.current.cancel()
      setIsSpeaking(false)
    }

    setQuestion(questionText)
    setError(null)
    isAnsweringQuestionRef.current = true
    playAnalyzingSound() // Play sound when analysis starts

    try {
      // Capture current frame and answer the question immediately
      const frameDataUrl = captureFrameFromVideo(videoRef.current)
      if (!frameDataUrl) {
        throw new Error("Failed to capture frame from camera")
      }

      // Query Moondream API with the user's question
      const response = await queryMoondream(frameDataUrl, questionText, MOONDREAM_API_URL)
      setAnswer(response)
      
      // Add to answer history for bottom overlay display
      const newAnswer = {
        id: Date.now().toString(),
        text: response,
        timestamp: Date.now()
      }
      setAnswerHistory(prev => [newAnswer, ...prev].slice(0, 3)) // Keep last 3 answers
      
      playAnswerReadySound() // Play sound when answer is ready
      
      // Small delay to ensure state is updated, then speak the answer if auto-narrate is enabled
      await new Promise(resolve => setTimeout(resolve, 100))
      if (autoNarrate) {
        speak(response)
      }
    } catch (err: any) {
      console.error("Error answering question:", err)
      setError(err.message || "Failed to answer question")
      playErrorSound() // Play error sound
    } finally {
      // Reset answering flag after a short delay to allow speech to start
      setTimeout(() => {
        isAnsweringQuestionRef.current = false
      }, 500)
    }
  }

  const startContinuousAnalysis = async () => {
    if (analysisLoopRef.current) return
    
    analysisLoopRef.current = true
    setIsAnalyzing(true)

    const analysisLoop = async () => {
      while (analysisLoopRef.current && isStreaming) {
        try {
          // Background analysis - just describing what it sees (silent)
          const backgroundQuery = "describe what you see in one short sentence"
          
          const response = await analyzeFrame(backgroundQuery)
          
          if (response) {
            // Store latest background analysis (but don't speak it)
            setLatestBackgroundAnalysis(response)
            // Add to history silently
            setAnalysisHistory(prev => [response, ...prev].slice(0, 10))
          }
          
          // Wait before next analysis (use user's preferred frequency)
          const delayMs = analysisFrequency * 1000
          await new Promise(resolve => setTimeout(resolve, delayMs))
        } catch (err: any) {
          console.error("Continuous analysis error:", err)
          // Continue loop even on error, but wait longer
          await new Promise(resolve => setTimeout(resolve, 3000))
        }
      }
      setIsAnalyzing(false)
    }

    analysisLoop()
  }

  const stopContinuousAnalysis = () => {
    analysisLoopRef.current = false
    setIsAnalyzing(false)
  }

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition() as any
        recognition.continuous = true // Keep listening continuously
        recognition.interimResults = false
        recognition.lang = "en-US"

        recognition.onstart = () => {
          setIsListening(true)
        }

        recognition.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript.trim()
          
          // Ignore empty transcripts
          if (!transcript) return
          
          // Don't process if already answering a question
          if (isAnsweringQuestionRef.current) return
          
          // If user is speaking while AI is speaking, interrupt the AI
          if (isSpeaking && synthesisRef.current) {
            synthesisRef.current.cancel()
            setIsSpeaking(false)
          }
          
          // Process the question
          handleQuestion(transcript)
        }

        recognition.onerror = (event: any) => {
          const errorType = event.error
          
          // "no-speech" is not a real error - it just means no speech was detected
          // We'll auto-restart in the onend handler
          if (errorType === "no-speech") {
            // Silently handle - will restart automatically
            return
          }
          
          // Log other errors but don't show all of them to user
          if (errorType !== "aborted" && errorType !== "network") {
            console.error("Speech recognition error:", errorType)
          }
          
          setIsListening(false)
          
          // Only show critical errors to user
          if (errorType === "not-allowed") {
            setError("Microphone permission denied")
          } else if (errorType === "service-not-allowed") {
            setError("Speech recognition service not available")
          }
        }

        recognition.onend = () => {
          // Auto-restart if still in voice mode (continuous listening)
          // This enables natural conversation flow - user can speak anytime
          // But don't restart if we're currently answering a question
          setTimeout(() => {
            if (inputModeRef.current === "voice" && recognitionRef.current && !isAnsweringQuestionRef.current) {
              try {
                recognitionRef.current.start()
              } catch (err) {
                // Ignore restart errors (might already be starting)
                // This is normal - recognition might already be active
              }
            } else {
              setIsListening(false)
            }
          }, 500) // Slightly longer delay to avoid interference
        }

        recognitionRef.current = recognition
      }

      synthesisRef.current = window.speechSynthesis
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Start camera automatically when component mounts and permissions are granted
  useEffect(() => {
    const startCameraAuto = async () => {
      if (permissionStatus === "granted" && !isStreaming && !streamRef.current) {
        await startCamera()
      }
    }
    
    startCameraAuto()
  }, [permissionStatus])

  const startCamera = async () => {
    try {
      if (permissionStatus !== "granted") {
        setShowPermissionPrompt(true)
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setIsStreaming(true)
        setError(null)
      }
    } catch (err: any) {
      console.error("Error starting camera:", err)
      setError(err.message || "Failed to start camera")
      setIsStreaming(false)
    }
  }

  const stopCamera = () => {
    stopContinuousAnalysis()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsStreaming(false)
    stopListening()
    stopSpeaking()
  }

  const handleRequestPermission = async () => {
    const granted = await requestPermission()
    if (granted) {
      setShowPermissionPrompt(false)
      await startCamera()
    } else {
      await checkPermission()
    }
  }

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
        playListeningSound() // Play sound when listening starts
      } catch (err) {
        console.error("Error starting speech recognition:", err)
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const speak = (text: string) => {
    // Don't speak if auto-narrate is disabled
    if (!autoNarrate) {
      return
    }

    if (synthesisRef.current) {
      // Cancel any ongoing speech when new speech starts (allows interruption)
      synthesisRef.current.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "en-US"
      utterance.rate = narrationSpeed // Use user's preferred speed
      utterance.pitch = 1.0 // Natural pitch
      utterance.volume = 1.0

      // Use selected voice if available
      if (selectedVoice && availableVoices.length > 0) {
        const voice = availableVoices.find(v => v.name === selectedVoice)
        if (voice) {
          utterance.voice = voice
        }
      }

      utterance.onstart = () => {
        setIsSpeaking(true)
      }

      utterance.onend = () => {
        setIsSpeaking(false)
      }

      utterance.onerror = () => {
        setIsSpeaking(false)
      }

      // Store utterance reference so we can cancel it if user interrupts
      synthesisRef.current.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel()
      setIsSpeaking(false)
    }
  }

  const handleStartAI = async () => {
    if (!isStreaming) {
      await startCamera()
      // Wait a bit for camera to be ready
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    // Show input mode selection (text/voice buttons)
    setShowModeSelection(true)
  }

  const handleSelectTextMode = async () => {
    playTextModeSound() // Play sound when text mode is selected
    if (!isStreaming) {
      await startCamera()
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setInputMode("text")
    inputModeRef.current = "text"
    setShowModeSelection(false)
    // Start continuous analysis for text mode
    startContinuousAnalysis()
    // Stop any voice listening if it was active
    stopListening()
  }

  const handleSelectVoiceMode = async () => {
    playVoiceModeSound() // Play sound when voice mode is selected
    if (!isStreaming) {
      await startCamera()
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setInputMode("voice")
    inputModeRef.current = "voice"
    setShowModeSelection(false)
    // Start continuous analysis for voice mode
    startContinuousAnalysis()
    // Start listening for questions continuously
    setTimeout(() => {
      startListening()
    }, 100)
  }

  const handleStopAI = () => {
    playStopSound() // Play sound when AI is stopped
    stopContinuousAnalysis()
    stopListening()
    stopSpeaking()
    setInputMode("none")
    inputModeRef.current = "none"
    setShowModeSelection(false)
    setQuestion("")
    setAnswer("")
    setTextQuery("")
    setLatestBackgroundAnalysis("")
    setAnalysisHistory([])
    setAnswerHistory([])
    isAnsweringQuestionRef.current = false
  }

  const handleTextQuerySubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (textQuery.trim() && isStreaming) {
      // Answer the question immediately with current frame
      await handleQuestion(textQuery.trim())
      setTextQuery("")
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      stopListening()
      stopSpeaking()
    }
  }, [])

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden">
      {/* Full Screen Camera Feed - Conditionally visible based on showPreview setting */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={showPreview ? "w-full h-full object-contain" : "hidden"}
        style={{ transform: "scaleX(-1)" }}
        aria-hidden={!showPreview}
      />

      {/* Status Indicator - Top Center (single centered dot for all states) */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
        {error && (
          <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
        )}
        {!error && isSpeaking && (
          <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse" />
        )}
        {!error && !isSpeaking && isAnsweringQuestionRef.current && (
          <div className="h-3 w-3 bg-blue-400 rounded-full animate-pulse" />
        )}
        {!error && !isSpeaking && !isAnsweringQuestionRef.current && isListening && (
          <div className="h-3 w-3 bg-red-400 rounded-full animate-pulse" />
        )}
        {!error && !isSpeaking && !isAnsweringQuestionRef.current && !isListening && isAnalyzing && (
          <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse" />
        )}
      </div>

      {/* Answer History Overlay - Bottom (slides up from bottom) */}
      {answerHistory.length > 0 && (
        <div
          className="absolute left-4 right-4 z-30 pointer-events-none"
          style={{
            display: 'flex',
            flexDirection: 'column-reverse',
            gap: '8px',
            maxWidth: '800px',
            margin: '0 auto',
            bottom: inputMode === "text" ? "220px" : inputMode === "voice" ? "200px" : "200px", // Position above the input controls
          }}
        >
          {answerHistory.map((answerItem, index) => {
            const opacityLevels = [1, 0.5, 0.25]
            return (
              <div
                key={answerItem.id}
                className="text-white shadow-lg leading-snug text-sm"
                style={{
                  padding: '12px 16px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  opacity: opacityLevels[index] || 0.25,
                  animation: index === 0 ? 'slideUp 0.3s ease-out' : 'none',
                  transition: 'opacity 0.3s ease-out',
                  borderRadius: '16px',
                }}
              >
                {answerItem.text}
            </div>
            )
          })}
        </div>
      )}
      

      {/* Query Input and Controls - Floating above bottom navbar */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-2xl px-4">
        {showModeSelection ? (
          // Show Text/Voice selection buttons after Start AI is clicked
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <Button
                onClick={handleSelectTextMode}
                size="lg"
                className="flex-1 py-8 text-xl font-semibold rounded-none shadow-2xl"
              >
                <Type className="mr-3 h-6 w-6" />
                Text
              </Button>
              <Button
                onClick={handleSelectVoiceMode}
                size="lg"
                className="flex-1 py-8 text-xl font-semibold rounded-none shadow-2xl"
              >
                <Mic className="mr-3 h-6 w-6" />
                Voice
              </Button>
            </div>
          </div>
        ) : inputMode === "text" ? (
          // Text mode: Show text input and stop button
          <div className="flex flex-col gap-3">
            {/* Text Query Input - Optimized for text mode */}
            <form onSubmit={handleTextQuerySubmit} className="flex items-center gap-2">
              <Input
                type="text"
                value={textQuery}
                onChange={(e) => setTextQuery(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 bg-black/70 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/50 rounded-none px-6 py-6 text-base h-14"
                disabled={!isStreaming}
                autoFocus
              />
              <Button
                type="submit"
                className="rounded-none px-6 py-6 shadow-2xl h-14"
                disabled={!isStreaming || !textQuery.trim()}
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
            
            {/* Stop AI Button */}
            <Button
              onClick={handleStopAI}
              size="lg"
              variant="destructive"
              className="w-full py-6 text-lg font-semibold rounded-none shadow-2xl"
            >
              <Square className="mr-2 h-6 w-6" />
              Stop AI
            </Button>
          </div>
        ) : inputMode === "voice" ? (
          // Voice mode: Show voice status and stop button
          <div className="flex flex-col gap-3">
            {/* Voice mode indicator */}
            <div className="flex items-center justify-center gap-2 bg-black/70 backdrop-blur-sm border border-white/30 rounded-none px-6 py-6 text-white">
              <Mic className="h-5 w-5 text-red-400 animate-pulse" />
              <span className="text-base">Listening for your questions...</span>
            </div>
            
            {/* Stop AI Button */}
            <Button
              onClick={handleStopAI}
              size="lg"
              variant="destructive"
              className="w-full py-6 text-lg font-semibold rounded-none shadow-2xl"
            >
              <Square className="mr-2 h-6 w-6" />
              Stop AI
            </Button>
          </div>
        ) : (
          // Initial state: Show Start AI button
          <div className="flex justify-center">
            <Button
              onClick={handleStartAI}
              size="lg"
              className="px-24 py-11 text-2xl font-semibold rounded-none shadow-2xl"
              disabled={!isStreaming}
            >
              <Play className="mr-4 h-10 w-10" />
              Start AI
            </Button>
          </div>
        )}
      </div>

      {/* Permission Prompt */}
      <PermissionPrompt
        open={showPermissionPrompt}
        onOpenChange={setShowPermissionPrompt}
        onRequestPermission={handleRequestPermission}
        permissionStatus={permissionStatus}
      />
    </div>
  )
}

