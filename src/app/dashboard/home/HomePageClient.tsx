"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { PermissionPrompt } from "@/components/PermissionPrompt"
import { useCameraPermissions } from "@/hooks/useCameraPermissions"
import { useElevenLabs } from "@/hooks/useElevenLabs"
import { Play, Square, Mic, Send, Type } from "lucide-react"
import { Input } from "@/components/ui/input"
import { queryMoondream } from "@/lib/services/moondream"
import { captureFrameFromVideo } from "@/lib/utils/frame-capture"

const MOONDREAM_API_URL = process.env.NEXT_PUBLIC_MOONDREAM_API_URL || "https://api.moondream.ai/v1"

export function HomePageClient() {
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
  const [selectedVoice, setSelectedVoice] = useState<string>("")
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all")
  const [autoNarrate, setAutoNarrate] = useState(true)
  const { speak: speakElevenLabs, stop: stopElevenLabs, isSpeaking: isElevenLabsSpeaking } = useElevenLabs()
  const analysisLoopRef = useRef<boolean>(false)
  const isAnsweringQuestionRef = useRef<boolean>(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<any>(null)
  const inputModeRef = useRef<"none" | "text" | "voice">("none")
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    checkPermission()
  }, [checkPermission])

  // Load narration settings from localStorage
  useEffect(() => {
    const savedVoice = localStorage.getItem("selectedVoice")
    const savedLanguage = localStorage.getItem("selectedLanguage")
    const savedAutoNarrate = localStorage.getItem("autoNarrate")

    if (savedVoice) setSelectedVoice(savedVoice)
    if (savedLanguage) setSelectedLanguage(savedLanguage)
    else setSelectedLanguage("all") // Default to "all" if not set
    if (savedAutoNarrate) setAutoNarrate(savedAutoNarrate === "true")
  }, [])

  // Sync isSpeaking state with ElevenLabs
  useEffect(() => {
    setIsSpeaking(isElevenLabsSpeaking)
  }, [isElevenLabsSpeaking])

  // Listen for changes to narration settings in localStorage (from settings page)
  useEffect(() => {
    // Handle cross-tab storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "selectedVoice" && e.newValue !== null) {
        setSelectedVoice(e.newValue)
      } else if (e.key === "selectedLanguage" && e.newValue !== null) {
        setSelectedLanguage(e.newValue)
      } else if (e.key === "autoNarrate" && e.newValue !== null) {
        setAutoNarrate(e.newValue === "true")
      }
    }

    // Handle same-tab custom events (instant updates)
    const handleCustomStorageChange = (e: CustomEvent) => {
      const { key, newValue } = e.detail
      if (key === "selectedVoice" && newValue !== null) {
        setSelectedVoice(newValue)
      } else if (key === "selectedLanguage" && newValue !== null) {
        setSelectedLanguage(newValue)
      } else if (key === "autoNarrate" && newValue !== null) {
        setAutoNarrate(newValue === "true")
      }
    }

    // Fallback polling for changes (in case events are missed)
    const handlePollingChange = () => {
      const savedVoice = localStorage.getItem("selectedVoice")
      const savedLanguage = localStorage.getItem("selectedLanguage")
      const savedAutoNarrate = localStorage.getItem("autoNarrate")

      if (savedVoice !== null) setSelectedVoice(savedVoice)
      if (savedLanguage !== null) setSelectedLanguage(savedLanguage)
      else setSelectedLanguage("all") // Default to "all" if not set
      if (savedAutoNarrate !== null) setAutoNarrate(savedAutoNarrate === "true")
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("localStorageChange", handleCustomStorageChange as EventListener)
    
    // Poll for changes every 2 seconds as fallback
    const interval = setInterval(handlePollingChange, 2000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("localStorageChange", handleCustomStorageChange as EventListener)
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
    console.log("[handleQuestion] Called with:", questionText)
    console.log("[handleQuestion] State check - videoRef:", !!videoRef.current, "isStreaming:", isStreaming, "streamRef:", !!streamRef.current)
    
    // Check if we actually have an active stream (more reliable than state)
    const hasActiveStream = streamRef.current && streamRef.current.getTracks().some(track => track.readyState === 'live')
    
    // If camera isn't streaming, try to start it
    if (!isStreaming && !hasActiveStream) {
      console.log("[handleQuestion] Camera not streaming, attempting to start...")
      await startCamera()
      await new Promise(resolve => setTimeout(resolve, 1000))
      // Re-check after delay
      const stillHasStream = streamRef.current && streamRef.current.getTracks().some(track => track.readyState === 'live')
      console.log("[handleQuestion] After camera start attempt, hasActiveStream:", stillHasStream)
    }
    
    // Final check - use streamRef as source of truth
    const finalStreamCheck = streamRef.current && streamRef.current.getTracks().some(track => track.readyState === 'live')
    
    if (!videoRef.current || !finalStreamCheck) {
      console.error("[handleQuestion] Camera still not ready - videoRef:", !!videoRef.current, "hasActiveStream:", finalStreamCheck)
      setError("Camera is not ready. Please ensure camera permissions are granted and try again.")
      // Try to restart listening if in voice mode
      if (inputModeRef.current === "voice" && recognitionRef.current) {
        setTimeout(() => {
          try {
            if (recognitionRef.current) {
              recognitionRef.current.start()
              setIsListening(true)
            }
          } catch (err: any) {
            // If already started, that's fine
            if (err.name === "InvalidStateError" || err.message?.includes("already started")) {
              console.log("[handleQuestion] Recognition already active, setting listening state")
              setIsListening(true)
            } else {
              console.error("[handleQuestion] Error restarting recognition:", err)
            }
          }
        }, 1000)
      }
      return
    }

    // Prevent processing if already answering
    if (isAnsweringQuestionRef.current) {
      console.log("[handleQuestion] Already processing a question, ignoring:", questionText)
      return
    }

    // Cancel any ongoing speech when new question comes in (interruption support)
    if (isSpeaking) {
      stopElevenLabs()
      setIsSpeaking(false)
    }

    setQuestion(questionText)
    setError(null)
    isAnsweringQuestionRef.current = true
    console.log("[handleQuestion] Starting to process question...")
    playAnalyzingSound() // Play sound when analysis starts

    try {
      console.log("[handleQuestion] Capturing frame from video...")
      // Capture current frame and answer the question immediately
      const frameDataUrl = captureFrameFromVideo(videoRef.current)
      if (!frameDataUrl) {
        throw new Error("Failed to capture frame from camera")
      }
      console.log("[handleQuestion] Frame captured, querying Moondream API...")

      // Query Moondream API with the user's question
      const response = await queryMoondream(frameDataUrl, questionText, MOONDREAM_API_URL)
      console.log("[handleQuestion] Got response from Moondream:", response?.substring(0, 100))
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
        console.log("[handleQuestion] Speaking answer...")
        await speak(response)
        console.log("[handleQuestion] Answer spoken")
      } else {
        console.log("[handleQuestion] Auto-narrate disabled, skipping speech")
      }
    } catch (err: any) {
      console.error("[handleQuestion] Error answering question:", err)
      setError(err.message || "Failed to answer question")
      playErrorSound() // Play error sound
    } finally {
      console.log("[handleQuestion] Question processing finished, resetting flag...")
      // Reset answering flag after a delay to allow speech to start
      setTimeout(() => {
        isAnsweringQuestionRef.current = false
        console.log("[handleQuestion] Question processing complete, ready for next question")
        
        // Restart listening if in voice mode
        if (inputModeRef.current === "voice" && recognitionRef.current) {
          // Wait a bit longer to ensure speech has started
          setTimeout(() => {
            try {
              console.log("[handleQuestion] Restarting voice recognition...")
              recognitionRef.current.start()
              setIsListening(true)
            } catch (err: any) {
              // If already started, that's fine
              if (err.message?.includes("already started") || err.name === "InvalidStateError") {
                console.log("[handleQuestion] Recognition already active")
                setIsListening(true)
              } else {
                console.error("[handleQuestion] Error restarting recognition:", err)
                setIsListening(false)
              }
            }
          }, 500)
        }
      }, 1500) // Wait for speech to start before allowing new questions
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
          
          // Wait before next analysis (default 2 seconds)
          const delayMs = 2000
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
          if (!transcript) {
            console.log("[onresult] Empty transcript, ignoring")
            return
          }
          
          console.log("[onresult] Transcript received:", transcript)
          
          // Don't process if already answering a question
          if (isAnsweringQuestionRef.current) {
            console.log("[onresult] Already processing question, ignoring:", transcript)
            return
          }
          
          console.log("[onresult] Question detected, calling handleQuestion:", transcript)
          
          // Stop listening while processing the question
          if (recognitionRef.current) {
            try {
              console.log("[onresult] Stopping recognition...")
              recognitionRef.current.stop()
            } catch (err) {
              console.error("[onresult] Error stopping recognition:", err)
            }
          }
          setIsListening(false)
          
          // If user is speaking while AI is speaking, interrupt the AI
          if (isSpeaking) {
            stopElevenLabs()
            setIsSpeaking(false)
          }
          
          // Process the question
          console.log("[onresult] Calling handleQuestion with:", transcript)
          handleQuestion(transcript).catch(err => {
            console.error("[onresult] Error in handleQuestion promise:", err)
          })
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
                setIsListening(true)
              } catch (err) {
                // Ignore restart errors (might already be starting)
                // This is normal - recognition might already be active
                setIsListening(false)
              }
            } else {
              setIsListening(false)
            }
          }, 1000) // Longer delay to ensure question processing is complete
        }

        recognitionRef.current = recognition
      }

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
      console.log("[startCamera] Starting camera...", { permissionStatus, isStreaming: isStreaming, hasStream: !!streamRef.current })
      
      // Check if we already have an active stream
      if (streamRef.current) {
        const hasActiveTracks = streamRef.current.getTracks().some(track => track.readyState === 'live')
        if (hasActiveTracks) {
          console.log("[startCamera] Stream already active, reusing it")
          setIsStreaming(true)
          if (videoRef.current && !videoRef.current.srcObject) {
            videoRef.current.srcObject = streamRef.current
            await videoRef.current.play()
          }
          return
        }
      }
      
      if (permissionStatus !== "granted") {
        console.log("[startCamera] Permission not granted, checking permission status...")
        // Re-check permission status before showing prompt
        const currentPermission = await navigator.permissions.query({ name: 'camera' as PermissionName }).catch(() => null)
        if (currentPermission?.state === 'granted') {
          console.log("[startCamera] Permission actually granted, proceeding...")
          // Permission is granted, continue
        } else {
          console.log("[startCamera] Permission not granted, showing prompt")
          setShowPermissionPrompt(true)
          return
        }
      }

      // Stop existing stream if any (but only if it's not active)
      if (streamRef.current) {
        const hasActiveTracks = streamRef.current.getTracks().some(track => track.readyState === 'live')
        if (!hasActiveTracks) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      console.log("[startCamera] Stream obtained:", !!stream)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsStreaming(true)
        setError(null)
        console.log("[startCamera] Camera started successfully, isStreaming set to true")
      } else {
        console.error("[startCamera] videoRef.current is null!")
        stream.getTracks().forEach(track => track.stop())
        setError("Video element not ready")
        setIsStreaming(false)
      }
    } catch (err: any) {
      console.error("[startCamera] Error starting camera:", err)
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

  const speak = async (text: string) => {
    // Don't speak if auto-narrate is disabled
    if (!autoNarrate) {
      return
    }

    try {
      // Stop any ongoing speech (allows interruption)
      stopElevenLabs()

      // Use selected language from narration settings (or "en" if "all" is selected)
      const languageToUse = selectedLanguage !== "all" ? selectedLanguage : "en"
      
      // Use ElevenLabs for speech synthesis
      await speakElevenLabs(text, {
        voiceId: selectedVoice || undefined, // Use selected voice or default
        stability: 0.5,
        similarityBoost: 0.75,
        language: languageToUse, // Use selected language from narration settings
      })
    } catch (error: any) {
      console.error("Speech synthesis error:", error)
      // Don't show alert for user-facing errors, just log
    }
  }

  const stopSpeaking = () => {
    stopElevenLabs()
    setIsSpeaking(false)
  }

  const handleStartAI = async () => {
    console.log("[handleStartAI] Called, isStreaming:", isStreaming)
    if (!isStreaming) {
      console.log("[handleStartAI] Camera not streaming, starting camera...")
      await startCamera()
      // Wait a bit for camera to be ready and state to update
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log("[handleStartAI] After camera start, isStreaming:", isStreaming)
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
    console.log("[handleSelectVoiceMode] Called, isStreaming:", isStreaming)
    playVoiceModeSound() // Play sound when voice mode is selected
    if (!isStreaming) {
      console.log("[handleSelectVoiceMode] Camera not streaming, starting camera...")
      await startCamera()
      // Wait longer for camera to be fully ready
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log("[handleSelectVoiceMode] After camera start, isStreaming:", isStreaming)
      
      // Double-check streaming state
      if (!isStreaming) {
        console.error("[handleSelectVoiceMode] Camera still not streaming after start attempt!")
        setError("Camera failed to start. Please try again.")
        return
      }
    }
    
    setInputMode("voice")
    inputModeRef.current = "voice"
    setShowModeSelection(false)
    // Start continuous analysis for voice mode
    startContinuousAnalysis()
    // Start listening for questions continuously
    setTimeout(() => {
      console.log("[handleSelectVoiceMode] Starting voice recognition...")
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
      {/* Full Screen Camera Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-contain"
        style={{ transform: "scaleX(-1)" }}
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

