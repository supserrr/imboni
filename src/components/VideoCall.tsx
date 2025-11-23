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
  const [isVideoOn, setIsVideoOn] = useState(!isVolunteer) // Video only for blind users
  const [connectionState, setConnectionState] =
    useState<WebRTCConnectionState | null>(null)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)

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
            console.log("Remote stream received in VideoCall:", {
              streamId: stream.id,
              active: stream.active,
              tracks: stream.getTracks().map(t => ({
                kind: t.kind,
                enabled: t.enabled,
                readyState: t.readyState
              }))
            })
            
            // Update state to trigger re-render
            setRemoteStream(stream)
          },
          (error) => {
            console.error("WebRTC error:", error)
          },
          (attempt) => {
            setIsReconnecting(true)
            console.log(`Reconnection attempt ${attempt}`)
          },
          !isVolunteer // Enable video only for blind users (not volunteers)
        )

        setConnection(webrtcConnection)

        const localStream = webrtcConnection.getLocalStream()
        if (localStream && localVideoRef.current && !isVolunteer) {
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

  // Update video element when stream changes
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log("Setting remote stream on video element:", {
        streamId: remoteStream.id,
        tracks: remoteStream.getTracks().length
      })
      remoteVideoRef.current.srcObject = remoteStream
      
      // Force video to play
      remoteVideoRef.current.play().catch(err => {
        console.error("Error playing remote video:", err)
      })
    }
  }, [remoteStream])

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          onLoadedMetadata={() => {
            console.log("Remote video metadata loaded")
            if (remoteVideoRef.current) {
              remoteVideoRef.current.play().catch(err => {
                console.error("Error playing video after metadata loaded:", err)
              })
            }
          }}
          onCanPlay={() => {
            console.log("Remote video can play")
          }}
          onPlay={() => {
            console.log("Remote video started playing")
          }}
        />
        {!remoteStream && (
          <div className="text-white absolute inset-0 flex items-center justify-center">
            {isVolunteer ? "Waiting for video feed..." : "Waiting for connection..."}
          </div>
        )}
      </div>

      {!isVolunteer && (
        <div className="absolute top-4 right-4 w-32 h-48 bg-gray-900 rounded-lg overflow-hidden z-10">
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
              Your Camera
            </div>
          )}
        </div>
      )}

      {isVolunteer && (
        <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg">
          <div className="text-sm font-semibold">Viewing blind user's camera</div>
          <div className="text-xs text-gray-300 mt-1">Audio only from your side</div>
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
          {!isVolunteer && (
            <>
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
              <Button
                variant="secondary"
                size="icon"
                onClick={handleSwitchCamera}
                className="rounded-full"
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
            </>
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

