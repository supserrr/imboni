"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { WebRTCConnection } from "@/lib/services/webrtc"
import type { WebRTCConnectionState } from "@/types/webrtc"
import { Mic, MicOff, Video, VideoOff, PhoneOff, RefreshCw } from "lucide-react"

interface VideoCallProps {
  channelName: string
  requestId: string
  userId: string
  volunteerId: string
  isVolunteer: boolean
  onEndCall: () => void
  hideControls?: boolean
}

export function VideoCall({
  channelName,
  requestId,
  userId,
  volunteerId,
  isVolunteer,
  onEndCall,
  hideControls = false,
}: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [connection, setConnection] = useState<WebRTCConnection | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [connectionState, setConnectionState] =
    useState<WebRTCConnectionState | null>(null)
  const [isReconnecting, setIsReconnecting] = useState(false)

  useEffect(() => {
    const initConnection = async () => {
      try {
        const webrtcConnection = new WebRTCConnection()

        await webrtcConnection.initialize(
          userId,
          volunteerId,
          requestId,
          !isVolunteer,
          (state) => {
            setConnectionState(state)
            if (state.connectionState === "failed") {
              setIsReconnecting(true)
            } else if (state.connectionState === "connected") {
              setIsReconnecting(false)
            }
          },
          (stream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = stream
            }
          },
          (error) => {
            console.error("WebRTC error:", error)
          },
          (attempt) => {
            setIsReconnecting(true)
            console.log(`Reconnection attempt ${attempt}`)
          }
        )

        setConnection(webrtcConnection)

        const localStream = webrtcConnection.getLocalStream()
        if (localStream && localVideoRef.current) {
          localVideoRef.current.srcObject = localStream
        }
      } catch (error) {
        console.error("Failed to initialize WebRTC:", error)
      }
    }

    initConnection()

    return () => {
      if (connection) {
        connection.endCall()
      }
    }
  }, [channelName, requestId, userId, volunteerId, isVolunteer])

  const handleToggleMute = async () => {
    if (connection) {
      const newMutedState = await connection.toggleMute()
      setIsMuted(!newMutedState)
    }
  }

  const handleToggleVideo = async () => {
    if (connection) {
      const newVideoState = await connection.toggleVideo()
      setIsVideoOn(newVideoState)
    }
  }

  const handleSwitchCamera = async () => {
    if (connection) {
      await connection.switchCamera()
    }
  }

  const handleEndCall = async () => {
    if (connection) {
      await connection.endCall()
    }
    onEndCall()
  }

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        {remoteVideoRef.current?.srcObject ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-white">Waiting for connection...</div>
        )}
      </div>

      {!isVolunteer && (
        <div className="absolute top-4 right-4 w-32 h-48 bg-gray-900 rounded-lg overflow-hidden">
          {localVideoRef.current?.srcObject ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-xs">
              Camera
            </div>
          )}
        </div>
      )}

      {connectionState && (
        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
          {connectionState.connectionState === "connecting" && "Connecting..."}
          {connectionState.connectionState === "connected" && "Connected"}
          {connectionState.connectionState === "failed" && "Connection failed"}
          {isReconnecting && (
            <span className="ml-2">
              <RefreshCw className="inline w-4 h-4 animate-spin" />
            </span>
          )}
        </div>
      )}

      {!hideControls && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleToggleMute}
            className="rounded-full"
          >
            {isMuted ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleToggleVideo}
            className="rounded-full"
          >
            {isVideoOn ? (
              <Video className="w-5 h-5" />
            ) : (
              <VideoOff className="w-5 h-5" />
            )}
          </Button>
          {!isVolunteer && (
            <Button
              variant="secondary"
              size="icon"
              onClick={handleSwitchCamera}
              className="rounded-full"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          )}
          <Button
            variant="destructive"
            size="icon"
            onClick={handleEndCall}
            className="rounded-full"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  )
}

