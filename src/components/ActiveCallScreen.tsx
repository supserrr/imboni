"use client"

import { VideoCall } from "./VideoCall"
import { Button } from "@/components/ui/button"
import { PhoneOff } from "lucide-react"
import { formatDuration } from "@/lib/utils/format"

interface ActiveCallScreenProps {
  onEndCall: () => void
  callDuration: number
  showVideoFeed: boolean
  videoFeedComponent?: React.ReactNode
  isConnecting: boolean
  requestId: string
  userId: string
  volunteerId: string
  isVolunteer: boolean
  onConnectionStateChange?: (state: "connecting" | "connected" | "disconnected") => void
}

export function ActiveCallScreen({
  onEndCall,
  callDuration,
  showVideoFeed,
  videoFeedComponent,
  isConnecting,
  requestId,
  userId,
  volunteerId,
  isVolunteer,
  onConnectionStateChange,
}: ActiveCallScreenProps) {
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {showVideoFeed && videoFeedComponent ? (
        videoFeedComponent
      ) : (
        <VideoCall
          channelName={`call_${requestId}`}
          requestId={requestId}
          userId={userId}
          volunteerId={volunteerId}
          isVolunteer={isVolunteer}
          onEndCall={onEndCall}
          onConnectionStateChange={onConnectionStateChange}
          hideControls={true}
        />
      )}

      {isConnecting && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-white text-xl">Connecting...</div>
        </div>
      )}

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4">
        <div className="text-white text-lg font-semibold">
          {formatDuration(callDuration)}
        </div>
        <Button
          variant="destructive"
          size="lg"
          onClick={onEndCall}
          className="rounded-full w-16 h-16"
        >
          <PhoneOff className="w-6 h-6" />
        </Button>
      </div>
    </div>
  )
}

