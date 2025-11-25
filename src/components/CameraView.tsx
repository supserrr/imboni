"use client"

import { useEffect } from "react"
import { Camera, CameraOff } from "@/components/ui/animated-icons"

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  isActive: boolean
  error: Error | null
  onStart: () => void
  showPreview?: boolean
}

/**
 * Component for displaying camera feed
 * Optional preview for low vision users
 */
export function CameraView({
  videoRef,
  isActive,
  error,
  onStart,
  showPreview = false,
}: CameraViewProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black text-white p-8">
        <CameraOff className="w-16 h-16 mb-4 text-red-500" />
        <h2 className="text-xl font-semibold mb-2">Camera Access Error</h2>
        <p className="text-center text-gray-300">{error.message}</p>
        <button
          onClick={onStart}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!showPreview) {
    // Hidden video element for blind users (still needed for frame capture)
    return (
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="hidden"
        aria-hidden="true"
      />
    )
  }

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center text-white">
            <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Starting camera...</p>
          </div>
        </div>
      )}
    </div>
  )
}

