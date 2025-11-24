"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { PermissionPrompt } from "@/components/PermissionPrompt"
import { useCameraPermissions } from "@/hooks/useCameraPermissions"
import { Play, Square, Mic, Send } from "lucide-react"
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
  const [question, setQuestion] = useState<string>("")
  const [answer, setAnswer] = useState<string>("")
  const [textQuery, setTextQuery] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<any>(null)
  const synthesisRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    checkPermission()
  }, [checkPermission])

  const handleQuestion = async (questionText: string) => {
    if (!videoRef.current || !isStreaming) {
      setError("Camera is not ready")
      return
    }

    setIsAnalyzing(true)
    setAnswer("")
    setError(null)

    try {
      // Capture frame from video
      const frameDataUrl = captureFrameFromVideo(videoRef.current)
      if (!frameDataUrl) {
        throw new Error("Failed to capture frame from camera")
      }

      // Query Moondream API
      const response = await queryMoondream(frameDataUrl, questionText, MOONDREAM_API_URL)
      setAnswer(response)
      
      // Speak the answer
      speak(response)
    } catch (err: any) {
      console.error("Error analyzing frame:", err)
      setError(err.message || "Failed to analyze image")
      setIsAnalyzing(false)
    } finally {
      setIsAnalyzing(false)
    }
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
          const transcript = event.results[event.results.length - 1][0].transcript
          setQuestion(transcript)
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
          // Auto-restart if still in AI mode (continuous listening)
          // Use a small delay to avoid immediate restart issues
          setTimeout(() => {
            if (isAnalyzing && recognitionRef.current) {
              try {
                recognitionRef.current.start()
              } catch (err) {
                // Ignore restart errors (might already be starting)
                console.log("Recognition restart skipped:", err)
              }
            } else {
              setIsListening(false)
            }
          }, 100)
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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsStreaming(false)
    setIsAnalyzing(false)
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
    if (synthesisRef.current) {
      // Cancel any ongoing speech
      synthesisRef.current.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "en-US"
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0

      utterance.onstart = () => {
        setIsSpeaking(true)
      }

      utterance.onend = () => {
        setIsSpeaking(false)
      }

      utterance.onerror = () => {
        setIsSpeaking(false)
      }

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
    setIsAnalyzing(true)
    // Start listening for questions continuously
    // Small delay to ensure state is updated
    setTimeout(() => {
      startListening()
    }, 100)
  }

  const handleStopAI = () => {
    setIsAnalyzing(false)
    stopListening()
    stopSpeaking()
    setQuestion("")
    setAnswer("")
    setTextQuery("")
  }

  const handleTextQuerySubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (textQuery.trim() && isStreaming) {
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

      {/* Status Overlay - Top Center */}
      {(isListening || isAnalyzing || isSpeaking || question || answer || error) && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 max-w-md">
          {isListening && (
            <div className="flex items-center gap-2 text-white">
              <Mic className="h-4 w-4 animate-pulse text-red-400" />
              <span className="text-sm">Listening...</span>
            </div>
          )}
          {isAnalyzing && !isListening && !isSpeaking && (
            <div className="flex items-center gap-2 text-white">
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Analyzing...</span>
            </div>
          )}
          {isSpeaking && (
            <div className="flex items-center gap-2 text-white">
              <Mic className="h-4 w-4 text-green-400" />
              <span className="text-sm">Speaking...</span>
            </div>
          )}
          {error && (
            <div className="text-red-300 text-sm">
              {error}
            </div>
          )}
          {question && !isAnalyzing && (
            <div className="text-white text-sm mt-1">
              <span className="text-gray-400">Q: </span>
              {question}
            </div>
          )}
          {answer && (
            <div className="text-white text-sm mt-1">
              <span className="text-gray-400">A: </span>
              {answer}
            </div>
          )}
        </div>
      )}

      {/* Query Input and Controls - Floating above bottom navbar */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-2xl px-4">
        {isAnalyzing ? (
          <div className="flex flex-col gap-3">
            {/* Text Query Input */}
            <form onSubmit={handleTextQuerySubmit} className="flex gap-2">
              <Input
                type="text"
                value={textQuery}
                onChange={(e) => setTextQuery(e.target.value)}
                placeholder="Type your question or ask by voice..."
                className="flex-1 bg-black/70 backdrop-blur-sm border-white/30 text-white placeholder:text-white/50 rounded-full px-6 py-6 text-base"
                disabled={!isStreaming}
              />
              <Button
                type="submit"
                size="lg"
                className="rounded-full px-6 shadow-2xl"
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
              className="w-full py-6 text-lg font-semibold rounded-full shadow-2xl"
            >
              <Square className="mr-2 h-6 w-6" />
              Stop AI
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleStartAI}
            size="lg"
            className="px-12 py-6 text-lg font-semibold rounded-full shadow-2xl"
            disabled={!isStreaming}
          >
            <Play className="mr-2 h-6 w-6" />
            Start AI
          </Button>
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

