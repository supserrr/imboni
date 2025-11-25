"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { PermissionPrompt } from "@/components/PermissionPrompt"
import { useCameraPermissions } from "@/hooks/useCameraPermissions"
import { useElevenLabs } from "@/hooks/useElevenLabs"
import { Square, Mic, Send, Type } from "@/components/ui/animated-icons"
import { Input } from "@/components/ui/input"
import { queryMoondream } from "@/lib/services/moondream"
import { captureFrameFromVideo } from "@/lib/utils/frame-capture"

const MOONDREAM_API_URL = process.env.NEXT_PUBLIC_MOONDREAM_API_URL || "https://api.moondream.ai/v1"

export function HomePageClient() {
  const { permissionStatus, requestPermission, checkPermission } = useCameraPermissions()
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isUsingFrontCamera, setIsUsingFrontCamera] = useState(false)
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
  const { speak: speakElevenLabs, stop: stopElevenLabs, isSpeaking: isElevenLabsSpeaking, voices: availableVoices, isLoading: voicesLoading } = useElevenLabs()
  const analysisLoopRef = useRef<boolean>(false)
  const isAnsweringQuestionRef = useRef<boolean>(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<any>(null)
  const inputModeRef = useRef<"none" | "text" | "voice">("none")
  const audioContextRef = useRef<AudioContext | null>(null)
  const recognitionRestartTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSpeechEndTimeRef = useRef<number>(0)
  const pendingVoiceModeRef = useRef<boolean>(false)

  useEffect(() => {
    checkPermission()
  }, [checkPermission])

  // Load narration settings from localStorage and validate voice when voices are loaded
  useEffect(() => {
    const savedVoice = localStorage.getItem("selectedVoice")
    const savedLanguage = localStorage.getItem("selectedLanguage")
    const savedAutoNarrate = localStorage.getItem("autoNarrate")

    if (savedLanguage) setSelectedLanguage(savedLanguage)
    else setSelectedLanguage("all") // Default to "all" if not set
    if (savedAutoNarrate) setAutoNarrate(savedAutoNarrate === "true")

    // Validate voice when voices are loaded
    if (savedVoice && availableVoices.length > 0) {
      const voiceExists = availableVoices.some(v => v.id === savedVoice)
      if (voiceExists) {
        setSelectedVoice(savedVoice)
        console.log("[HomePage] Loaded and validated voice from localStorage:", savedVoice)
      } else {
        // Try to find by name
        const voiceByName = availableVoices.find(v => v.name === savedVoice)
        if (voiceByName) {
          console.log("[HomePage] Found voice by name, using ID:", voiceByName.id)
          setSelectedVoice(voiceByName.id)
          localStorage.setItem("selectedVoice", voiceByName.id)
        } else {
          // Invalid voice, clear it and use Sarah as default
          console.warn("[HomePage] Invalid voice, clearing and using default Sarah")
          localStorage.removeItem("selectedVoice")
          if (availableVoices.length > 0) {
            const sarahVoice = availableVoices.find(v => v.name.toLowerCase() === "sarah")
            if (sarahVoice) {
              setSelectedVoice(sarahVoice.id)
              localStorage.setItem("selectedVoice", sarahVoice.id)
              console.log("[HomePage] Set default Sarah voice:", sarahVoice.id)
            } else {
              // Sarah not found, use first available as fallback
              console.warn("[HomePage] Sarah voice not found, using first available as fallback")
              setSelectedVoice(availableVoices[0].id)
              localStorage.setItem("selectedVoice", availableVoices[0].id)
            }
          }
        }
      }
    } else if (savedVoice && availableVoices.length === 0) {
      // Voices not loaded yet, set temporarily (will be validated when voices load)
      setSelectedVoice(savedVoice)
      console.log("[HomePage] Loaded voice from localStorage (will validate when voices load):", savedVoice)
    } else if (!savedVoice && availableVoices.length > 0) {
      // No voice saved, use Sarah as default
      const sarahVoice = availableVoices.find(v => v.name.toLowerCase() === "sarah")
      if (sarahVoice) {
        setSelectedVoice(sarahVoice.id)
        localStorage.setItem("selectedVoice", sarahVoice.id)
        console.log("[HomePage] No saved voice, using default Sarah:", sarahVoice.id)
      } else {
        // Sarah not found, use first available as fallback
        console.warn("[HomePage] Sarah voice not found, using first available as fallback")
        setSelectedVoice(availableVoices[0].id)
        localStorage.setItem("selectedVoice", availableVoices[0].id)
      }
    } else {
      console.log("[HomePage] No saved voice found in localStorage")
    }
  }, [availableVoices])

  // Sync isSpeaking state with ElevenLabs and stop/start recognition accordingly
  useEffect(() => {
    setIsSpeaking(isElevenLabsSpeaking)
    
    // Stop recognition when AI starts speaking to prevent it from hearing its own voice
    if (isElevenLabsSpeaking) {
      // Clear any pending restart timeout
      if (recognitionRestartTimeoutRef.current) {
        clearTimeout(recognitionRestartTimeoutRef.current)
        recognitionRestartTimeoutRef.current = null
      }
      
      if (recognitionRef.current && isListening) {
        console.log("[isSpeaking] AI started speaking, stopping recognition to prevent feedback")
        try {
          recognitionRef.current.stop()
          setIsListening(false)
        } catch (err) {
          console.error("[isSpeaking] Error stopping recognition:", err)
        }
      }
    } else {
      // Record when speech ended
      lastSpeechEndTimeRef.current = Date.now()
      
      // Restart recognition when AI finishes speaking (only if in voice mode and not answering)
      // Use a longer delay (3 seconds) to ensure speech has fully ended and audio has cleared
      if (inputModeRef.current === "voice" && recognitionRef.current) {
        // Clear any existing timeout
        if (recognitionRestartTimeoutRef.current) {
          clearTimeout(recognitionRestartTimeoutRef.current)
        }
        
        // Wait longer to ensure speech has fully ended and audio has cleared
        recognitionRestartTimeoutRef.current = setTimeout(() => {
          // Double-check we're still in voice mode
          if (inputModeRef.current === "voice" && recognitionRef.current) {
            // Ensure at least 2.5 seconds have passed since speech ended
            const timeSinceSpeechEnd = Date.now() - lastSpeechEndTimeRef.current
            if (timeSinceSpeechEnd >= 2500) {
              // Don't check isAnsweringQuestionRef here - allow recognition to restart
              // The flag will prevent processing if a question is already being handled
              // Check microphone permission before restarting
              checkMicrophonePermission().then(hasMicPermission => {
                if (!hasMicPermission) {
                  console.log("[isSpeaking] Microphone permission not granted, exiting voice mode")
                  setInputMode("none")
                  inputModeRef.current = "none"
                  setIsListening(false)
                  setError("Microphone permission is required for voice mode")
                  setShowPermissionPrompt(true)
                  return
                }
                
                try {
                  console.log("[isSpeaking] AI finished speaking, restarting recognition after delay")
                  recognitionRef.current.start()
                  setIsListening(true)
                } catch (err: any) {
                  // Handle permission errors
                  if (err.name === "NotAllowedError" || err.message?.includes("permission")) {
                    console.log("[isSpeaking] Microphone permission denied during restart")
                    setInputMode("none")
                    inputModeRef.current = "none"
                    setIsListening(false)
                    setError("Microphone permission is required for voice mode")
                    setShowPermissionPrompt(true)
                  } else if (err.name === "InvalidStateError" || err.message?.includes("already started")) {
                    console.log("[isSpeaking] Recognition already active")
                    setIsListening(true)
                  } else {
                    console.error("[isSpeaking] Error restarting recognition:", err)
                  }
                }
              })
            } else {
              console.log("[isSpeaking] Too soon after speech ended, waiting more...")
              // Reschedule if too soon
              const remainingTime = 2500 - timeSinceSpeechEnd
              recognitionRestartTimeoutRef.current = setTimeout(() => {
                if (inputModeRef.current === "voice" && recognitionRef.current) {
                  // Check microphone permission before restarting
                  checkMicrophonePermission().then(hasMicPermission => {
                    if (!hasMicPermission) {
                      console.log("[isSpeaking] Microphone permission not granted, exiting voice mode")
                      setInputMode("none")
                      inputModeRef.current = "none"
                      setIsListening(false)
                      setError("Microphone permission is required for voice mode")
                      setShowPermissionPrompt(true)
                      return
                    }
                    
                    try {
                      console.log("[isSpeaking] Restarting recognition after additional wait")
                      recognitionRef.current.start()
                      setIsListening(true)
                    } catch (err: any) {
                      if (err.name === "NotAllowedError" || err.message?.includes("permission")) {
                        console.log("[isSpeaking] Microphone permission denied during restart")
                        setInputMode("none")
                        inputModeRef.current = "none"
                        setIsListening(false)
                        setError("Microphone permission is required for voice mode")
                        setShowPermissionPrompt(true)
                      } else if (err.name === "InvalidStateError" || err.message?.includes("already started")) {
                        setIsListening(true)
                      }
                    }
                  })
                }
                recognitionRestartTimeoutRef.current = null
              }, remainingTime)
            }
          } else {
            recognitionRestartTimeoutRef.current = null
          }
        }, 3000) // 3 second delay to ensure speech has fully ended
      }
    }
    
    return () => {
      if (recognitionRestartTimeoutRef.current) {
        clearTimeout(recognitionRestartTimeoutRef.current)
        recognitionRestartTimeoutRef.current = null
      }
    }
  }, [isElevenLabsSpeaking, isListening])

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
        console.log("[HomePage] Voice updated instantly via custom event:", newValue)
        setSelectedVoice(newValue)
        // Force immediate update - the next speak() call will use this voice
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
        setTimeout(async () => {
          // Check microphone permission before restarting
          const hasMicPermission = await checkMicrophonePermission()
          if (!hasMicPermission) {
            console.log("[handleQuestion] Microphone permission not granted, exiting voice mode")
            setInputMode("none")
            inputModeRef.current = "none"
            setIsListening(false)
            setError("Microphone permission is required for voice mode")
            setShowPermissionPrompt(true)
            return
          }
          
          try {
            if (recognitionRef.current) {
              recognitionRef.current.start()
              setIsListening(true)
            }
          } catch (err: any) {
            if (err.name === "NotAllowedError" || err.message?.includes("permission")) {
              console.log("[handleQuestion] Microphone permission denied during restart")
              setInputMode("none")
              inputModeRef.current = "none"
              setIsListening(false)
              setError("Microphone permission is required for voice mode")
              setShowPermissionPrompt(true)
            } else if (err.name === "InvalidStateError" || err.message?.includes("already started")) {
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
      
      // Stop recognition BEFORE speaking to prevent it from hearing the AI's voice
      if (recognitionRef.current && isListening) {
        console.log("[handleQuestion] Stopping recognition before speaking to prevent feedback")
        try {
          recognitionRef.current.stop()
          setIsListening(false)
        } catch (err) {
          console.error("[handleQuestion] Error stopping recognition before speech:", err)
        }
      }
      
      // Small delay to ensure recognition has stopped, then speak the answer if auto-narrate is enabled
      await new Promise(resolve => setTimeout(resolve, 200))
      if (autoNarrate) {
        console.log("[handleQuestion] Speaking answer...")
        await speak(response)
        console.log("[handleQuestion] Answer spoken")
      } else {
        console.log("[handleQuestion] Auto-narrate disabled, skipping speech")
        // If not speaking, restart recognition immediately
        if (inputModeRef.current === "voice" && recognitionRef.current) {
          setTimeout(async () => {
            // Check microphone permission before restarting
            const hasMicPermission = await checkMicrophonePermission()
            if (!hasMicPermission) {
              console.log("[handleQuestion] Microphone permission not granted, exiting voice mode")
              setInputMode("none")
              inputModeRef.current = "none"
              setIsListening(false)
              setError("Microphone permission is required for voice mode")
              setShowPermissionPrompt(true)
              return
            }
            
            try {
              if (recognitionRef.current && !isAnsweringQuestionRef.current) {
                recognitionRef.current.start()
                setIsListening(true)
              }
            } catch (err: any) {
              if (err.name === "NotAllowedError" || err.message?.includes("permission")) {
                console.log("[handleQuestion] Microphone permission denied during restart")
                setInputMode("none")
                inputModeRef.current = "none"
                setIsListening(false)
                setError("Microphone permission is required for voice mode")
                setShowPermissionPrompt(true)
              } else if (err.name === "InvalidStateError" || err.message?.includes("already started")) {
                setIsListening(true)
              }
            }
          }, 500)
        }
      }
    } catch (err: any) {
      console.error("[handleQuestion] Error answering question:", err)
      setError(err.message || "Failed to answer question")
      playErrorSound() // Play error sound
    } finally {
      console.log("[handleQuestion] Question processing finished, resetting flag...")
      // Reset answering flag immediately after processing (not waiting for speech)
      // This allows new questions to be processed even if speech is still ongoing
      // The speech will be interrupted if a new question comes in
      isAnsweringQuestionRef.current = false
      console.log("[handleQuestion] Question processing complete, ready for next question")
      
      // Don't restart recognition here - let the isSpeaking effect handle it after speech ends
      // This prevents recognition from restarting too early and picking up the AI's voice
      // Recognition will restart automatically when isElevenLabsSpeaking becomes false (with 3s delay)
      console.log("[handleQuestion] Recognition will restart after speech ends (handled by isSpeaking effect)")
    }
  }

  const startContinuousAnalysis = async () => {
    if (analysisLoopRef.current) return
    
    analysisLoopRef.current = true
    setIsAnalyzing(true)

    const analysisLoop = async () => {
      while (analysisLoopRef.current && isStreaming) {
        // Check flag before each operation
        if (!analysisLoopRef.current) {
          console.log("[analysisLoop] Stopped by flag, exiting loop")
          break
        }
        
        try {
          // Background analysis - just describing what it sees (silent)
          const backgroundQuery = "describe what you see in one short sentence"
          
          // Check flag again before making API call
          if (!analysisLoopRef.current) {
            console.log("[analysisLoop] Stopped before API call, exiting loop")
            break
          }
          
          const response = await analyzeFrame(backgroundQuery)
          
          // Check flag after API call
          if (!analysisLoopRef.current) {
            console.log("[analysisLoop] Stopped after API call, exiting loop")
            break
          }
          
          if (response) {
            // Store latest background analysis (but don't speak it)
            setLatestBackgroundAnalysis(response)
            // Add to history silently
            setAnalysisHistory(prev => [response, ...prev].slice(0, 10))
          }
          
          // Wait before next analysis (default 2 seconds), but check flag periodically
          const delayMs = 2000
          const checkInterval = 200 // Check every 200ms
          let waited = 0
          while (waited < delayMs && analysisLoopRef.current) {
            await new Promise(resolve => setTimeout(resolve, checkInterval))
            waited += checkInterval
          }
          
          // Final check before next iteration
          if (!analysisLoopRef.current) {
            console.log("[analysisLoop] Stopped during delay, exiting loop")
            break
          }
        } catch (err: any) {
          console.error("Continuous analysis error:", err)
          // Check flag before continuing
          if (!analysisLoopRef.current) {
            console.log("[analysisLoop] Stopped after error, exiting loop")
            break
          }
          // Continue loop even on error, but wait longer
          const delayMs = 3000
          const checkInterval = 200
          let waited = 0
          while (waited < delayMs && analysisLoopRef.current) {
            await new Promise(resolve => setTimeout(resolve, checkInterval))
            waited += checkInterval
          }
        }
      }
      console.log("[analysisLoop] Loop exited, setting isAnalyzing to false")
      setIsAnalyzing(false)
      analysisLoopRef.current = false // Ensure flag is cleared
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
            // Exit voice mode if permission is denied
            setInputMode("none")
            inputModeRef.current = "none"
            setIsListening(false)
            setShowPermissionPrompt(true)
          } else if (errorType === "service-not-allowed") {
            setError("Speech recognition service not available")
          }
        }

        recognition.onend = () => {
          // Auto-restart if still in voice mode (continuous listening)
          // This enables natural conversation flow - user can speak anytime
          // But don't restart if we're currently answering a question
          setTimeout(async () => {
            if (inputModeRef.current === "voice" && recognitionRef.current && !isAnsweringQuestionRef.current) {
              // Check microphone permission before restarting
              const hasMicPermission = await checkMicrophonePermission()
              if (!hasMicPermission) {
                console.log("[onend] Microphone permission not granted, exiting voice mode")
                setInputMode("none")
                inputModeRef.current = "none"
                setIsListening(false)
                setError("Microphone permission is required for voice mode")
                setShowPermissionPrompt(true)
                return
              }
              
              try {
                recognitionRef.current.start()
                setIsListening(true)
              } catch (err: any) {
                // Handle permission errors
                if (err.name === "NotAllowedError" || err.message?.includes("permission")) {
                  console.log("[onend] Microphone permission denied during restart")
                  setInputMode("none")
                  inputModeRef.current = "none"
                  setIsListening(false)
                  setError("Microphone permission is required for voice mode")
                  setShowPermissionPrompt(true)
                } else {
                  // Ignore other restart errors (might already be starting)
                  // This is normal - recognition might already be active
                  setIsListening(false)
                }
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
      // Check both permissionStatus and localStorage for granted status
      // This ensures it works even if permissionStatus hasn't updated yet after refresh
      const storedPermission = localStorage.getItem("camera-permission-status")
      const storedMicPermission = localStorage.getItem("microphone-permission-status")
      const isGranted = (permissionStatus === "granted" || storedPermission === "granted") && 
                       (storedMicPermission === "granted")
      
      if (isGranted && !isStreaming && !streamRef.current) {
        console.log("[startCameraAuto] Permission granted (from state or localStorage), starting camera automatically")
        // Wait for video element to be available (max 2 seconds)
        let attempts = 0
        const maxAttempts = 20
        const delayMs = 100
        
        while (!videoRef.current && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delayMs))
          attempts++
        }
        
        if (videoRef.current) {
          await startCamera()
        } else {
          console.warn("[startCameraAuto] Video element not available after waiting")
        }
      }
    }
    
    // Small delay to ensure everything is initialized
    const timeoutId = setTimeout(() => {
      startCameraAuto()
    }, 200)
    
    return () => clearTimeout(timeoutId)
  }, [permissionStatus, isStreaming])

  const startCamera = async () => {
    try {
      console.log("[startCamera] Starting camera...", { permissionStatus, isStreaming: isStreaming, hasStream: !!streamRef.current, hasVideoRef: !!videoRef.current })
      
      // Wait for video element if not ready (max 1 second)
      if (!videoRef.current) {
        console.log("[startCamera] Video element not ready, waiting...")
        let attempts = 0
        const maxAttempts = 10
        const delayMs = 100
        
        while (!videoRef.current && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delayMs))
          attempts++
        }
        
        if (!videoRef.current) {
          console.error("[startCamera] Video element not available after waiting")
          setError("Video element not ready")
          setIsStreaming(false)
          return
        }
      }
      
      // Check if we already have an active stream
      if (streamRef.current) {
        const hasActiveTracks = streamRef.current.getTracks().some(track => track.readyState === 'live')
        if (hasActiveTracks) {
          console.log("[startCamera] Stream already active, reusing it")
          setIsStreaming(true)
          if (videoRef.current && !videoRef.current.srcObject) {
            videoRef.current.srcObject = streamRef.current
            try {
              await videoRef.current.play()
            } catch (error: any) {
              // Handle AbortError gracefully (occurs during navigation/unmount)
              if (error.name !== 'AbortError') {
                console.error("[startCamera] Error playing video:", error)
              }
            }
          }
          return
        }
      }
      
      // Check both permissionStatus and localStorage for granted status
      // This ensures it works even if permissionStatus hasn't updated yet after refresh
      const storedPermission = localStorage.getItem("camera-permission-status")
      const storedMicPermission = localStorage.getItem("microphone-permission-status")
      const isGranted = (permissionStatus === "granted" || storedPermission === "granted") && 
                       (storedMicPermission === "granted")
      
      if (!isGranted) {
        console.log("[startCamera] Permission not granted, checking permission status...")
        // Re-check permission status before showing prompt
        const [currentCameraPermission, currentMicPermission] = await Promise.all([
          navigator.permissions.query({ name: 'camera' as PermissionName }).catch(() => null),
          navigator.permissions.query({ name: 'microphone' as PermissionName }).catch(() => null),
        ])
        if (currentCameraPermission?.state === 'granted' && currentMicPermission?.state === 'granted') {
          console.log("[startCamera] Permissions actually granted, proceeding...")
          // Update localStorage to persist this
          localStorage.setItem("camera-permission-status", "granted")
          localStorage.setItem("microphone-permission-status", "granted")
          // Permissions are granted, continue
        } else {
          console.log("[startCamera] Permissions not granted, showing prompt")
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

      // Detect if device is mobile or desktop
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                       (typeof window !== 'undefined' && 'ontouchstart' in window) ||
                       (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)

      // Use front camera (webcam) for desktop, back camera for mobile
      const defaultFacingMode = isMobile ? "environment" : "user"
      
      // Track if we're using front camera (for mirroring)
      setIsUsingFrontCamera(!isMobile)
      
      let videoConstraints: MediaTrackConstraints = {
        facingMode: defaultFacingMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      }

      try {
        // Enumerate devices to find the correct camera
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(device => device.kind === 'videoinput')
        
        if (isMobile) {
          // For mobile: Find main back camera (NOT ultrawide)
          // iOS: "Wide Camera", "Back Camera", "Main Camera"
          // Android: "Back Camera", "Main Camera", "Camera 0" (main is usually first)
          // Note: On iOS/Android, labels may be empty until a device is accessed
          const mainBackCamera = videoDevices.find(device => {
            if (!device.label) return false
            const label = device.label.toLowerCase()
            // Must be a back camera
            const isBackCamera = (label.includes('back') || 
                                 label.includes('rear') ||
                                 label.includes('main') ||
                                 label.includes('wide camera')) &&
                                !label.includes('front')
            // Must NOT be ultrawide
            const isNotUltrawide = !label.includes('ultrawide') && 
                                  !label.includes('ultra wide') &&
                                  !label.includes('ultra-wide') &&
                                  !label.includes('wide angle') &&
                                  !label.includes('wide-angle') &&
                                  !label.includes('wideangle')
            return isBackCamera && isNotUltrawide
          })
          
          if (mainBackCamera && mainBackCamera.deviceId && mainBackCamera.deviceId !== 'default') {
            console.log("[startCamera] Found main back camera:", mainBackCamera.label || 'unnamed device')
            videoConstraints = {
              deviceId: { exact: mainBackCamera.deviceId },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            }
            setIsUsingFrontCamera(false) // Back camera, no mirroring
          } else {
            // Fallback: Try to find any back/rear camera explicitly (excluding ultrawide)
            const backCamera = videoDevices.find(device => {
              if (!device.label) return false
              const label = device.label.toLowerCase()
              const isBack = (label.includes('back') || 
                             label.includes('rear')) &&
                            !label.includes('front')
              const isNotUltrawide = !label.includes('ultrawide') && 
                                    !label.includes('ultra wide') &&
                                    !label.includes('ultra-wide') &&
                                    !label.includes('wide angle') &&
                                    !label.includes('wide-angle') &&
                                    !label.includes('wideangle')
              return isBack && isNotUltrawide
            })
            
            if (backCamera && backCamera.deviceId && backCamera.deviceId !== 'default') {
              console.log("[startCamera] Found back camera (excluding ultrawide):", backCamera.label || 'unnamed device')
              videoConstraints = {
                deviceId: { exact: backCamera.deviceId },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              }
              setIsUsingFrontCamera(false) // Back camera, no mirroring
            } else {
              // Final fallback: Use facingMode: environment (should select main back camera)
              console.log("[startCamera] No specific camera found, using main back camera with facingMode: environment")
              setIsUsingFrontCamera(false) // Back camera, no mirroring
            }
          }
        } else {
          // For desktop: Use front-facing webcam (user facingMode is already set)
          console.log("[startCamera] Desktop device detected, using front camera (webcam)")
        }
      } catch (err) {
        console.warn("[startCamera] Could not enumerate devices, using facingMode:", err)
        // Fall back to facingMode if device enumeration fails
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: true,
      })

      console.log("[startCamera] Stream obtained:", !!stream)
      streamRef.current = stream
      
      // Re-check video element after getting stream (it might have been unmounted)
      if (!videoRef.current) {
        console.log("[startCamera] Video element became unavailable after getting stream, waiting...")
        let attempts = 0
        const maxAttempts = 10
        const delayMs = 100
        
        while (!videoRef.current && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delayMs))
          attempts++
        }
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
          setIsStreaming(true)
          setError(null)
          console.log("[startCamera] Camera started successfully, isStreaming set to true")
        } catch (error: any) {
          // Handle AbortError gracefully (occurs during navigation/unmount)
          if (error.name === 'AbortError') {
            // Video was interrupted, clean up stream
            stream.getTracks().forEach(track => track.stop())
            return
          }
          console.error("[startCamera] Error playing video:", error)
          stream.getTracks().forEach(track => track.stop())
          setError("Failed to start video playback")
          setIsStreaming(false)
        }
      } else {
        console.error("[startCamera] videoRef.current is null after waiting!")
        stream.getTracks().forEach(track => track.stop())
        streamRef.current = null
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
      // Wait a bit for camera to be ready and state to update
      await new Promise(resolve => setTimeout(resolve, 1000))
      // Check if stream is actually active (more reliable than state)
      const hasActiveStream = streamRef.current && streamRef.current.getTracks().some(track => track.readyState === 'live')
      if (hasActiveStream || isStreaming) {
        // If user was trying to enable voice mode, do it now
        if (pendingVoiceModeRef.current) {
          pendingVoiceModeRef.current = false
          // Enable voice mode automatically
          setInputMode("voice")
          inputModeRef.current = "voice"
          setShowModeSelection(false)
          startContinuousAnalysis()
          setTimeout(() => {
            console.log("[handleRequestPermission] Starting voice recognition after permission granted...")
            startListening()
          }, 100)
        } else {
          setShowModeSelection(true)
        }
      }
    } else {
      pendingVoiceModeRef.current = false // Reset on denial
      await checkPermission()
    }
  }

  const startListening = async () => {
    // Check microphone permission before starting
    const hasMicPermission = await checkMicrophonePermission()
    if (!hasMicPermission) {
      console.log("[startListening] Microphone permission not granted")
      setError("Microphone permission is required for voice mode")
      setShowPermissionPrompt(true)
      // Exit voice mode if permission is denied
      setInputMode("none")
      inputModeRef.current = "none"
      return
    }
    
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
        playListeningSound() // Play sound when listening starts
      } catch (err: any) {
        console.error("Error starting speech recognition:", err)
        // If error is due to permission, show prompt
        if (err.name === "NotAllowedError" || err.message?.includes("permission")) {
          setError("Microphone permission is required for voice mode")
          setShowPermissionPrompt(true)
          setInputMode("none")
          inputModeRef.current = "none"
        }
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

    // Use selected language from narration settings (or "en" if "all" is selected)
    const languageToUse = selectedLanguage !== "all" ? selectedLanguage : "en"

    try {
      // Stop any ongoing speech (allows interruption)
      stopElevenLabs()

      // Get the selected voice from localStorage (in case state hasn't updated yet)
      let currentVoice = selectedVoice || localStorage.getItem("selectedVoice") || undefined
      
      // Validate voice ID - check if it exists in available voices
      // If voices aren't loaded yet, wait for them (max 3 seconds)
      let voicesLoaded = availableVoices.length > 0
      
      if (!voicesLoaded) {
        if (voicesLoading) {
          console.log("[speak] Voices are still loading, waiting...")
          // Wait for voices to load (poll every 200ms, max 3 seconds)
          let waited = 0
          const maxWait = 3000
          const pollInterval = 200
          
          while (availableVoices.length === 0 && waited < maxWait) {
            await new Promise(resolve => setTimeout(resolve, pollInterval))
            waited += pollInterval
            // Re-check voices from hook (they should update via state)
            // Note: This relies on React state updates, so we need to check the actual hook value
          }
          voicesLoaded = availableVoices.length > 0
        }
        
        // If still no voices after waiting, check if we can use the voice ID directly
        if (!voicesLoaded && currentVoice) {
          // Check if currentVoice looks like a valid ID (not a name like "Albert")
          const looksLikeId = currentVoice.length > 10 && /^[a-zA-Z0-9]+$/.test(currentVoice)
          if (looksLikeId) {
            console.log("[speak] Voices not loaded but voice ID looks valid, using it directly:", currentVoice)
            // Skip validation and use the voice ID directly - ElevenLabs will validate it
            // Proceed to speak with currentVoice
          } else {
            console.warn("[speak] Voices not loaded and voice doesn't look like valid ID. Skipping speech.")
            return
          }
        } else if (!voicesLoaded && !currentVoice) {
          // No voice selected and voices not loaded, wait for voices to find Sarah
          console.log("[speak] No voice selected, waiting for voices to load to use default Sarah...")
          // Continue to wait or proceed - we'll handle it when voices load
        }
      }

      // Only validate if voices are loaded
      if (voicesLoaded) {
        if (currentVoice) {
          const voiceExists = availableVoices.some(v => v.id === currentVoice)
          
          // If voice ID doesn't exist, try to find by name (for backwards compatibility)
          if (!voiceExists) {
            const voiceByName = availableVoices.find(v => v.name === currentVoice)
            if (voiceByName) {
              console.log("[speak] Found voice by name, using ID:", voiceByName.id)
              currentVoice = voiceByName.id
              // Update storage with correct ID
              localStorage.setItem("selectedVoice", voiceByName.id)
              setSelectedVoice(voiceByName.id)
            } else {
              // Voice not found, use Sarah as default
              console.warn("[speak] Voice ID/name not found, using default Sarah")
              const sarahVoice = availableVoices.find(v => v.name.toLowerCase() === "sarah")
              if (sarahVoice) {
                currentVoice = sarahVoice.id
                localStorage.setItem("selectedVoice", sarahVoice.id)
                setSelectedVoice(sarahVoice.id)
                console.log("[speak] Set default Sarah voice:", sarahVoice.id)
              } else {
                // Sarah not found, use first available as fallback
                console.warn("[speak] Sarah voice not found, using first available as fallback")
                currentVoice = availableVoices[0]?.id || undefined
                if (currentVoice) {
                  localStorage.setItem("selectedVoice", currentVoice)
                  setSelectedVoice(currentVoice)
                }
              }
            }
          }
        } else {
          // No voice selected, use Sarah as default
          const sarahVoice = availableVoices.find(v => v.name.toLowerCase() === "sarah")
          if (sarahVoice) {
            currentVoice = sarahVoice.id
            localStorage.setItem("selectedVoice", sarahVoice.id)
            setSelectedVoice(sarahVoice.id)
            console.log("[speak] No voice selected, using default Sarah:", sarahVoice.id)
          } else {
            // Sarah not found, use first available as fallback
            console.warn("[speak] Sarah voice not found, using first available as fallback")
            currentVoice = availableVoices[0]?.id || undefined
            if (currentVoice) {
              localStorage.setItem("selectedVoice", currentVoice)
              setSelectedVoice(currentVoice)
            }
          }
        }
      }
      
      // Final fallback: If still no voice after all checks, use Sarah
      if (!currentVoice && voicesLoaded && availableVoices.length > 0) {
        const sarahVoice = availableVoices.find(v => v.name.toLowerCase() === "sarah")
        if (sarahVoice) {
          currentVoice = sarahVoice.id
          localStorage.setItem("selectedVoice", sarahVoice.id)
          setSelectedVoice(sarahVoice.id)
          console.log("[speak] Final fallback: Using default Sarah voice:", sarahVoice.id)
        } else {
          // Sarah not found, use first available as last resort
          currentVoice = availableVoices[0].id
          localStorage.setItem("selectedVoice", currentVoice)
          setSelectedVoice(currentVoice)
          console.warn("[speak] Sarah not found, using first available as last resort:", currentVoice)
        }
      }
      
      // Ensure we have a voice before speaking
      if (!currentVoice) {
        console.error("[speak] No voice available, cannot speak")
        return
      }
      
      console.log("[speak] Using voice:", currentVoice, "language:", languageToUse)
      
      // Use ElevenLabs for speech synthesis - ALWAYS use voice from settings or Sarah default
      await speakElevenLabs(text, {
        voiceId: currentVoice, // Always use the voice from settings or Sarah default
        stability: 0.5,
        similarityBoost: 0.75,
        language: languageToUse, // Use selected language from narration settings
      })
    } catch (error: any) {
      console.error("Speech synthesis error:", error)
      
      // If error is voice_not_found, clear invalid voice and retry with Sarah
      if (error.message?.includes("voice_not_found") || error.message?.includes("404")) {
        console.log("[speak] Voice not found, clearing and retrying with default Sarah")
        localStorage.removeItem("selectedVoice")
        setSelectedVoice("")
        
        if (availableVoices.length > 0) {
          const sarahVoice = availableVoices.find(v => v.name.toLowerCase() === "sarah")
          const defaultVoice = sarahVoice ? sarahVoice.id : availableVoices[0].id
          localStorage.setItem("selectedVoice", defaultVoice)
          setSelectedVoice(defaultVoice)
          
          console.log("[speak] Retrying with default voice:", defaultVoice)
          // Retry with default voice
          try {
            await speakElevenLabs(text, {
              voiceId: defaultVoice,
              stability: 0.5,
              similarityBoost: 0.75,
              language: languageToUse,
            })
          } catch (retryError) {
            console.error("Speech synthesis retry error:", retryError)
          }
        }
      }
      // Don't show alert for user-facing errors, just log
    }
  }

  const stopSpeaking = () => {
    stopElevenLabs()
    setIsSpeaking(false)
  }

  const handleStartAI = async () => {
    console.log("[handleStartAI] Called, isStreaming:", isStreaming, "permissionStatus:", permissionStatus)
    
    // Check permissions first - if not granted, show permission prompt
    if (permissionStatus !== "granted") {
      console.log("[handleStartAI] Permission not granted, showing permission prompt")
      setShowPermissionPrompt(true)
      return
    }
    
    if (!isStreaming) {
      console.log("[handleStartAI] Camera not streaming, starting camera...")
      await startCamera()
      // Wait a bit for camera to be ready and state to update
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log("[handleStartAI] After camera start, isStreaming:", isStreaming)
    }
    
    // Only show mode selection if camera is streaming
    if (isStreaming) {
      setShowModeSelection(true)
    }
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

  const checkMicrophonePermission = async (): Promise<boolean> => {
    try {
      // Check if browser supports permissions API
      if (navigator.permissions && navigator.permissions.query) {
        const micPermission = await navigator.permissions.query({ name: "microphone" as PermissionName })
        if (micPermission.state === "granted") {
          return true
        } else if (micPermission.state === "denied") {
          return false
        }
      }
      
      // Fallback: check localStorage
      const storedMicPermission = localStorage.getItem("microphone-permission-status")
      if (storedMicPermission === "granted") {
        return true
      } else if (storedMicPermission === "denied") {
        return false
      }
      
      // If no stored status, check by attempting to access microphone
      // This will trigger the permission prompt
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(track => track.stop())
        localStorage.setItem("microphone-permission-status", "granted")
        return true
      } catch (error: any) {
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          localStorage.setItem("microphone-permission-status", "denied")
          return false
        }
        // Other errors might be temporary, allow to proceed
        return true
      }
    } catch (error) {
      console.error("Error checking microphone permission:", error)
      return false
    }
  }

  const handleSelectVoiceMode = async () => {
    console.log("[handleSelectVoiceMode] Called, isStreaming:", isStreaming)
    
    // Check microphone permission first
    const hasMicPermission = await checkMicrophonePermission()
    if (!hasMicPermission) {
      console.log("[handleSelectVoiceMode] Microphone permission not granted, showing prompt")
      pendingVoiceModeRef.current = true // Track that user wants to use voice mode
      setError("Microphone permission is required for voice mode")
      setShowPermissionPrompt(true)
      return
    }
    
    pendingVoiceModeRef.current = false // Reset since permission is granted
    
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
    console.log("[handleStopAI] Stopping AI analysis and all operations immediately")
    
    // Stop speaking FIRST and immediately (most important for user experience)
    stopElevenLabs()
    setIsSpeaking(false)
    
    // Stop continuous analysis
    stopContinuousAnalysis()
    
    // Stop listening
    stopListening()
    
    // Clear any pending recognition restart timeouts
    if (recognitionRestartTimeoutRef.current) {
      clearTimeout(recognitionRestartTimeoutRef.current)
      recognitionRestartTimeoutRef.current = null
    }
    
    // Reset all state
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
    
    // Ensure analyzing state is false
    setIsAnalyzing(false)
    setIsListening(false)
    
    // Play stop sound after stopping (so it doesn't get interrupted)
    playStopSound()
    
    console.log("[handleStopAI] AI stopped successfully")
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
        className="w-full h-full object-cover"
        style={isUsingFrontCamera ? { transform: "scaleX(-1)" } : undefined}
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
          // Show Text/Voice selection buttons after Start Imboni is clicked
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
          // Initial state: Show Start Imboni button
          <div className="flex justify-center">
            <Button
              onClick={handleStartAI}
              size="lg"
              className="px-24 py-11 text-2xl font-semibold rounded-none shadow-2xl font-mono"
              disabled={permissionStatus === "denied" || permissionStatus === "not-supported"}
            >
              START IMBONI
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

