"use client"

import { useState, useEffect } from "react"
import Player from "@/components/solutions/analyze-live-video/player"
import { PermissionPrompt } from "@/components/PermissionPrompt"
import { useCameraPermissions } from "@/hooks/useCameraPermissions"

const MOONDREAM_API_URL = process.env.NEXT_PUBLIC_MOONDREAM_API_URL || "https://api.moondream.ai/v1"

export default function HomePage() {
  const { permissionStatus, requestPermission, checkPermission } = useCameraPermissions()
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false)
  const [hasAttemptedStart, setHasAttemptedStart] = useState(false)

  useEffect(() => {
    // Check permission status on mount
    checkPermission()
  }, [checkPermission])

  const handleRequestPermission = async () => {
    const granted = await requestPermission()
    if (granted) {
      setShowPermissionPrompt(false)
      setHasAttemptedStart(false)
    } else {
      // Permission denied - keep prompt open
      await checkPermission()
    }
  }

  // Show permission prompt if user tries to start video without permission
  const handleVideoStartAttempt = () => {
    if (permissionStatus !== "granted") {
      if (!hasAttemptedStart) {
        setHasAttemptedStart(true)
      }
      if (permissionStatus === "denied" || permissionStatus === "prompt") {
        setShowPermissionPrompt(true)
      }
    }
  }

  // Re-check permissions after user grants them
  useEffect(() => {
    if (permissionStatus === "granted" && showPermissionPrompt) {
      setShowPermissionPrompt(false)
      setHasAttemptedStart(false)
    }
  }, [permissionStatus, showPermissionPrompt])

  return (
    <div className="min-h-screen w-full bg-[#050505]">
      {/* Mobile: Full screen, Desktop: Fixed width centered */}
      <div className="mx-auto h-screen w-full md:max-w-6xl md:px-4 md:py-8">
        <div className="h-full w-full">
          <Player 
            inferenceUrl={MOONDREAM_API_URL}
            onStartAttempt={handleVideoStartAttempt}
          />
        </div>
      </div>

      <PermissionPrompt
        open={showPermissionPrompt}
        onOpenChange={setShowPermissionPrompt}
        onRequestPermission={handleRequestPermission}
        permissionStatus={permissionStatus}
      />
    </div>
  )
}

