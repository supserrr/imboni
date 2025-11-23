"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ActiveCallScreen } from "@/components/ActiveCallScreen"
import { HelpRequestModal } from "@/components/HelpRequestModal"
import { AvailabilityToggle } from "@/components/AvailabilityToggle"
import { StatsDisplay } from "@/components/StatsDisplay"
import { useAuth } from "@/contexts/AuthProvider"
import { useCall } from "@/contexts/CallProvider"
import { userService } from "@/lib/services/user"
import { matchingService } from "@/lib/services/matching"
import { sessionService } from "@/lib/services/session"
import { useVolunteerRequests } from "@/hooks/useVolunteerRequests"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { User } from "@/types/user"
import type { HelpRequest } from "@/types/help-request"

export default function VolunteerHomePage() {
  const { user: authUser } = useAuth()
  const { callState, setCallState, callDuration, setCallDuration, resetCall } = useCall()
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [currentRequest, setCurrentRequest] = useState<HelpRequest | null>(null)
  const [currentSession, setCurrentSession] = useState<string | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [requestUser, setRequestUser] = useState<{ name: string; avatar: string | null } | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { requests } = useVolunteerRequests(user?.id || null)

  useEffect(() => {
    if (!authUser) {
      router.push("/login")
      return
    }
    
    const checkUserType = async () => {
      const supabase = createClient()
      const { data: profile } = await supabase
        .from("users")
        .select("type")
        .eq("id", authUser.id)
        .single()
      
      if (profile?.type === "blind") {
        router.replace("/dashboard/blind")
      }
    }
    
    checkUserType()

    const loadUser = async () => {
      try {
        const userData = await userService.getProfile(authUser.id)
        setUser(userData)
      } catch (error) {
        console.error("Failed to load user:", error)
      }
    }

    loadUser()
  }, [authUser, router])

  useEffect(() => {
    if (requests.length > 0 && !currentRequest) {
      const request = requests[0]
      setCurrentRequest(request)

      const loadUser = async () => {
        try {
          const { data } = await supabase
            .from("users")
            .select("full_name, profile_picture_url")
            .eq("id", request.user_id)
            .single()

          if (data) {
            setRequestUser({
              name: data.full_name,
              avatar: data.profile_picture_url,
            })
          }
        } catch (error) {
          console.error("Failed to load user:", error)
        }
      }

      loadUser()

      const startTime = Date.now()
      const timeout = 30000
      setTimeRemaining(timeout)

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const remaining = Math.max(0, timeout - elapsed)
        setTimeRemaining(remaining)

        if (remaining === 0) {
          handleDecline()
        }
      }, 100)

      timeoutRef.current = interval as unknown as NodeJS.Timeout
    }

    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current as unknown as number)
      }
    }
  }, [requests, currentRequest])

  const handleToggleAvailability = async (available: boolean) => {
    if (!user) return

    try {
      await userService.setAvailability(user.id, available)
      setUser({ ...user, availability: available })
      toast.success(available ? "You are now available" : "You are now unavailable")
    } catch (error: any) {
      toast.error(error.message || "Failed to update availability")
    }
  }

  const handleAccept = async () => {
    if (!currentRequest || !user) return

    try {
      await matchingService.acceptRequest(currentRequest.id, user.id)
      setCallState("connecting")

      const session = await sessionService.startSession(
        currentRequest.id,
        currentRequest.user_id,
        user.id
      )

      setCurrentSession(session.id)
      setSessionStartTime(Date.now())
      setCallState("connected")

      if (timeoutRef.current) {
        clearInterval(timeoutRef.current as unknown as number)
      }
      setTimeRemaining(null)
    } catch (error: any) {
      toast.error(error.message || "Failed to accept request")
    }
  }

  const handleDecline = async () => {
    if (!currentRequest || !user) return

    try {
      await matchingService.declineRequest(currentRequest.id, user.id)
      setCurrentRequest(null)
      setTimeRemaining(null)

      if (timeoutRef.current) {
        clearInterval(timeoutRef.current as unknown as number)
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to decline request")
    }
  }

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

  const handleEndCall = async () => {
    if (!currentSession || !sessionStartTime) return

    try {
      const duration = Math.floor((Date.now() - sessionStartTime) / 1000)
      await sessionService.endSession(currentSession, duration)

      resetCall()
      setCurrentRequest(null)
      setCurrentSession(null)
      setSessionStartTime(null)
      toast.success("Call ended")
    } catch (error: any) {
      toast.error(error.message || "Failed to end call")
    }
  }

  if (callState === "connected" || callState === "connecting") {
    if (!currentRequest || !user) return null

    return (
      <ActiveCallScreen
        onEndCall={handleEndCall}
        callDuration={callDuration}
        showVideoFeed={true}
        isConnecting={callState === "connecting"}
        requestId={currentRequest.id}
        userId={currentRequest.user_id}
        volunteerId={user.id}
        isVolunteer={true}
      />
    )
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Welcome, {user?.full_name || "Volunteer"}!</h1>
          <p className="text-muted-foreground">
            Help others by providing visual assistance
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Availability</CardTitle>
            <CardDescription>
              Toggle your availability to receive help requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AvailabilityToggle
              available={user?.availability || false}
              onToggle={handleToggleAvailability}
            />
          </CardContent>
        </Card>

        {user && (
          <StatsDisplay
            callsAnswered={user.history_count || 0}
            rating={user.rating}
          />
        )}

        {currentRequest && (
          <HelpRequestModal
            open={!!currentRequest}
            onOpenChange={(open) => {
              if (!open && currentRequest) {
                handleDecline()
              }
            }}
            userName={requestUser?.name || null}
            userAvatar={requestUser?.avatar || null}
            onAccept={handleAccept}
            onDecline={handleDecline}
            timeRemaining={timeRemaining || undefined}
          />
        )}
      </div>
    </div>
  )
}

