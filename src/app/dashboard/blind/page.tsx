"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ActiveCallScreen } from "@/components/ActiveCallScreen"
import { RatingScreen } from "@/components/RatingScreen"
import { CallHistory } from "@/components/CallHistory"
import { useAuth } from "@/contexts/AuthProvider"
import { useCall } from "@/contexts/CallProvider"
import { matchingService } from "@/lib/services/matching"
import { sessionService } from "@/lib/services/session"
import { historyService } from "@/lib/services/history"
import { useHelpRequest } from "@/hooks/useHelpRequest"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Phone, History } from "lucide-react"
import type { HelpRequest } from "@/types/help-request"
import type { SessionWithUsers } from "@/types/session"

export default function BlindHomePage() {
  const { user, isLoading: authLoading } = useAuth()
  const { callState, setCallState, callDuration, setCallDuration, resetCall } = useCall()
  const router = useRouter()
  const [currentRequest, setCurrentRequest] = useState<HelpRequest | null>(null)
  const [excludedVolunteers, setExcludedVolunteers] = useState<string[]>([])
  const [currentSession, setCurrentSession] = useState<string | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
  const [historySessions, setHistorySessions] = useState<SessionWithUsers[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [isVerifyingUserType, setIsVerifyingUserType] = useState(true)

  const { request } = useHelpRequest(currentRequest?.id || null)

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.push("/login")
      return
    }
    
    let isMounted = true
    
    const checkUserType = async () => {
      setIsVerifyingUserType(true)
      try {
        const supabase = createClient()
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("type")
          .eq("id", user.id)
          .single()
        
        // Handle database query errors
        if (profileError) {
          console.error("Error fetching user profile:", profileError)
          // On error, allow user to proceed (page component will handle verification)
          if (isMounted) {
            setIsVerifyingUserType(false)
          }
          return
        }
        
        if (profile?.type === "volunteer") {
          if (isMounted) {
            setIsVerifyingUserType(false)
          }
          router.replace("/dashboard/volunteer")
          return
        }
        
        if (isMounted) {
          setIsVerifyingUserType(false)
        }
      } catch (error) {
        console.error("Unexpected error in checkUserType:", error)
        // Ensure loading state is cleared even on unexpected errors
        if (isMounted) {
          setIsVerifyingUserType(false)
        }
      }
    }
    
    // Await the async function to handle any errors
    checkUserType().catch((error) => {
      console.error("Unhandled error in checkUserType:", error)
      if (isMounted) {
        setIsVerifyingUserType(false)
      }
    })

    const loadHistory = async () => {
      try {
        const sessions = await historyService.getSessionHistory(user.id, 10)
        // Only set state if component is still mounted
        if (isMounted) {
          setHistorySessions(sessions as SessionWithUsers[])
        }
      } catch (error) {
        console.error("Failed to load history:", error)
      }
    }

    loadHistory()
    
    return () => {
      isMounted = false
    }
  }, [user, router, authLoading])

  useEffect(() => {
    if (request) {
      setCurrentRequest(request)

      if (request.status === "accepted") {
        setCallState("connecting")
      } else if (request.status === "in_progress") {
        setCallState("connected")
      } else if (request.status === "declined") {
        findAndAssignVolunteer(request.id)
      }
    }
  }, [request, setCallState])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (callState === "connected" && sessionStartTime) {
      interval = setInterval(() => {
        const duration = Math.floor((Date.now() - sessionStartTime) / 1000)
        setCallDuration(duration)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [callState, sessionStartTime, setCallDuration])

  const handleCallVolunteer = async () => {
    if (!user) return

    try {
      const newRequest = await matchingService.createHelpRequest(user.id)
      setCurrentRequest(newRequest)
      await findAndAssignVolunteer(newRequest.id)
    } catch (error: any) {
      toast.error(error.message || "Failed to create help request")
    }
  }

  const findAndAssignVolunteer = async (requestId: string) => {
    try {
      const volunteerId = await matchingService.findBestVolunteer(
        excludedVolunteers
      )

      if (!volunteerId) {
        toast.error("No volunteers available at the moment")
        return
      }

      await matchingService.assignVolunteer(requestId, volunteerId)
      setExcludedVolunteers([...excludedVolunteers, volunteerId])
    } catch (error: any) {
      toast.error(error.message || "Failed to find volunteer")
    }
  }

  const startVideoCall = async () => {
    if (!currentRequest || !user) return

    try {
      const session = await sessionService.startSession(
        currentRequest.id,
        user.id,
        currentRequest.assigned_volunteer!
      )

      setCurrentSession(session.id)
      setSessionStartTime(Date.now())
      setCallState("connected")

      const supabase = createClient()
      const { error } = await supabase
        .from("help_requests")
        .update({
          status: "in_progress",
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentRequest.id)

      if (error) throw error
    } catch (error: any) {
      toast.error(error.message || "Failed to start call")
    }
  }

  useEffect(() => {
    if (currentRequest?.status === "accepted" && callState === "connecting") {
      startVideoCall()
    }
  }, [currentRequest?.status, callState])

  const handleEndCall = async () => {
    if (!currentSession || !sessionStartTime) return

    try {
      const duration = Math.floor((Date.now() - sessionStartTime) / 1000)
      await sessionService.endSession(currentSession, duration)
      await matchingService.cancelRequest(currentRequest!.id)

      setCallState("rating")
      setCurrentRequest(null)
      setCurrentSession(null)
      setSessionStartTime(null)
    } catch (error: any) {
      toast.error(error.message || "Failed to end call")
    }
  }

  const handleRating = async (rating: number) => {
    if (!currentSession) return

    try {
      await sessionService.updateSessionRating(currentSession, rating)
      toast.success("Thank you for your feedback!")
      resetCall()
      setCurrentRequest(null)
      setCurrentSession(null)
      setSessionStartTime(null)
      setExcludedVolunteers([])
    } catch (error: any) {
      toast.error(error.message || "Failed to submit rating")
    }
  }

  const handleSkipRating = () => {
    resetCall()
    setCurrentRequest(null)
    setCurrentSession(null)
    setSessionStartTime(null)
    setExcludedVolunteers([])
  }

  const cancelRequest = async () => {
    if (!currentRequest) return

    try {
      await matchingService.cancelRequest(currentRequest.id)
      setCurrentRequest(null)
      setExcludedVolunteers([])
      toast.success("Request cancelled")
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel request")
    }
  }

  // Show video feed as soon as request is created (pending, accepted, or connected)
  if (currentRequest && (callState === "connected" || callState === "connecting" || currentRequest.status === "pending" || currentRequest.status === "accepted")) {
    if (!user) return null
    
    // Don't render VideoCall if volunteer is not yet assigned
    if (!currentRequest.assigned_volunteer) {
      return (
        <div className="container mx-auto p-8 max-w-2xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Waiting for volunteer assignment...</p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <ActiveCallScreen
        onEndCall={handleEndCall}
        callDuration={callDuration}
        showVideoFeed={true}
        isConnecting={callState === "connecting" || currentRequest.status === "pending" || currentRequest.status === "accepted"}
        requestId={currentRequest.id}
        userId={user.id}
        volunteerId={currentRequest.assigned_volunteer}
        isVolunteer={false}
        onConnectionStateChange={(state) => {
          if (state === "connected" && callState !== "connected") {
            setCallState("connected")
          } else if (state === "disconnected" && callState !== "rating") {
            // When connection is lost, end the call
            handleEndCall()
          }
        }}
      />
    )
  }

  if (callState === "rating") {
    return (
      <RatingScreen
        onRate={handleRating}
        onSkip={handleSkipRating}
      />
    )
  }

  if (authLoading || isVerifyingUserType) {
    return (
      <div className="container mx-auto p-8 max-w-2xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">
            Tap the button below to connect with a volunteer
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Need help?</CardTitle>
            <CardDescription>
              Connect with a volunteer for real-time visual assistance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentRequest ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {currentRequest.status === "pending" &&
                      "Finding a volunteer..."}
                    {currentRequest.status === "accepted" && "Connecting..."}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={cancelRequest}
                  className="w-full"
                >
                  Cancel Request
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleCallVolunteer}
                size="lg"
                className="w-full"
              >
                <Phone className="mr-2 h-5 w-5" />
                Call a volunteer
              </Button>
            )}
          </CardContent>
        </Card>

        <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <History className="mr-2 h-5 w-5" />
              View History
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Call History</SheetTitle>
              <SheetDescription>
                Your past calls with volunteers
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4">
              <CallHistory sessions={historySessions} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

