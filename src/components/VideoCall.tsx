"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { WebRTCConnection } from "@/lib/services/webrtc"
import type { WebRTCConnectionState } from "@/types/webrtc"
import { PhoneOff, RefreshCw } from "lucide-react"

interface VideoCallProps {
  channelName: string
  requestId: string
  userId: string
  volunteerId: string
  isVolunteer: boolean
  onEndCall: () => void
  onConnectionStateChange?: (state: "connecting" | "connected" | "disconnected") => void
  hideControls?: boolean
}

export function VideoCall({
  channelName,
  requestId,
  userId,
  volunteerId,
  isVolunteer,
  onEndCall,
  onConnectionStateChange,
  hideControls = false,
}: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [connection, setConnection] = useState<WebRTCConnection | null>(null)
  const connectionRef = useRef<WebRTCConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const onEndCallRef = useRef<() => void>(onEndCall)
  const onConnectionStateChangeRef = useRef<((state: "connecting" | "connected" | "disconnected") => void) | undefined>(onConnectionStateChange)
  const isInitializingRef = useRef(false)
  const hasFatalErrorRef = useRef(false) // Prevent re-initialization after fatal errors
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(!isVolunteer) // Video only for blind users
  const [connectionState, setConnectionState] =
    useState<WebRTCConnectionState | null>(null)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [elementReady, setElementReady] = useState(false)
  
  // Callback ref to set stream when hidden video element mounts for blind users
  // Only depends on isVolunteer - remoteStream is accessed via ref to avoid recreating callback
  const setBlindUserRemoteVideoRef = useCallback((element: HTMLVideoElement | null) => {
    remoteVideoRef.current = element
    // Access remoteStream from ref to avoid dependency on state changes
    const currentRemoteStream = remoteStreamRef.current
    
    if (element && !isVolunteer) {
      // Element mounted - signal readiness so full setup can run
      setElementReady(true)
      
      // If stream is already available, do basic setup immediately
      if (currentRemoteStream) {
        console.log("Blind user: Hidden video element mounted, setting remote stream immediately")
        if (element.srcObject !== currentRemoteStream) {
          element.srcObject = currentRemoteStream
          element.muted = false
          element.volume = 1
          console.log("Blind user: Stream set on hidden video element, attempting to play")
          element.play().catch(err => {
            if (err.name !== "AbortError") {
              console.error("Blind user: Error playing remote audio stream on mount:", err)
            }
          })
        }
      }
    } else if (!element && !isVolunteer) {
      // Element was unmounted
      setElementReady(false)
    }
  }, [isVolunteer])

  // Keep refs in sync with state
  useEffect(() => {
    connectionRef.current = connection
  }, [connection])

  useEffect(() => {
    localStreamRef.current = localStream
  }, [localStream])

  useEffect(() => {
    remoteStreamRef.current = remoteStream
  }, [remoteStream])

  useEffect(() => {
    onEndCallRef.current = onEndCall
  }, [onEndCall])

  useEffect(() => {
    onConnectionStateChangeRef.current = onConnectionStateChange
  }, [onConnectionStateChange])

  useEffect(() => {
    // Ensure we're in a browser environment before initializing WebRTC
    if (typeof window === "undefined") {
      console.warn("WebRTC not available: not in browser environment")
      return
    }

    // Check secure context
    if (!window.isSecureContext) {
      console.warn(
        `WebRTC requires a secure context (HTTPS or localhost). Current URL: ${window.location.href}. Please use http://localhost:3000 instead of an IP address.`
      )
      return
    }

    // Check getUserMedia availability
    if (!navigator?.mediaDevices?.getUserMedia) {
      console.warn("WebRTC not available: getUserMedia not supported in this browser")
      return
    }

    const initConnection = async () => {
      // For blind users: only initialize WebRTC if we have a volunteer assigned
      // For volunteers: always initialize (they have the requestId with assigned volunteer)
      if (!isVolunteer && !volunteerId) {
        // Blind user but no volunteer yet - just get camera access for preview
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          })
          setLocalStream(stream)
          localStreamRef.current = stream
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream
            localVideoRef.current.play().catch(err => {
              if (err.name !== "AbortError") {
                console.error("Error playing local video:", err)
              }
            })
          }
        } catch (error) {
          console.error("Failed to get camera access:", error)
        }
        return
      }

      // Initialize WebRTC connection when we have all required components
      // Check for empty string, null, or undefined
      if (!volunteerId || (typeof volunteerId === "string" && volunteerId.trim() === "") || !requestId) {
        console.log("Waiting for volunteer assignment before initializing WebRTC")
        return
      }

      // Prevent duplicate initialization
      // Use refs to get latest values, avoiding stale closure issues
      if (connectionRef.current || isInitializingRef.current) {
        console.log("WebRTC connection already exists or initialization in progress, skipping")
        return
      }
      
      // Don't re-initialize if we had a fatal error
      if (hasFatalErrorRef.current) {
        console.log("Fatal error occurred previously, preventing re-initialization")
        return
      }
      
      isInitializingRef.current = true

      // Clean up any existing local stream from preview before initializing WebRTC
      // Use refs to get latest values, avoiding stale closure issues
      const currentLocalStream = localStreamRef.current
      const currentConnection = connectionRef.current
      if (currentLocalStream && !currentConnection) {
        console.log("Cleaning up preview stream before initializing WebRTC")
        currentLocalStream.getTracks().forEach(track => track.stop())
        setLocalStream(null)
        localStreamRef.current = null
      }

      try {
        const isInitiator = !isVolunteer
        console.log("Initializing WebRTC connection:", {
          userId,
          volunteerId,
          requestId,
          isVolunteer,
          isInitiator
        })
        
        const webrtcConnection = new WebRTCConnection()

        await webrtcConnection.initialize(
          userId,
          volunteerId,
          requestId,
          isInitiator,
          (state) => {
            setConnectionState(state)
            if (state.connectionState === "failed") {
              setIsReconnecting(true)
            } else if (state.connectionState === "connected") {
              setIsReconnecting(false)
              onConnectionStateChangeRef.current?.("connected")
            } else if (state.connectionState === "connecting") {
              onConnectionStateChangeRef.current?.("connecting")
            } else if (state.connectionState === "disconnected" || state.connectionState === "closed") {
              onConnectionStateChangeRef.current?.("disconnected")
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
            // Mark fatal errors that should prevent re-initialization
            // "Call is full" and similar errors indicate the call cannot proceed
            if (error.message.includes("Call is full") || 
                error.message.includes("Maximum") ||
                error.message.includes("too many users")) {
              console.warn("Fatal error detected, preventing re-initialization:", error.message)
              hasFatalErrorRef.current = true
            }
          },
          (attempt) => {
            setIsReconnecting(true)
            console.log(`Reconnection attempt ${attempt}`)
          },
          !isVolunteer, // Enable video only for blind users (not volunteers)
          () => {
            // Call ended callback - notify parent component
            // Use ref to get latest onEndCall to avoid stale closure
            console.log("Call ended, notifying parent component")
            onEndCallRef.current()
          }
        )

        setConnection(webrtcConnection)
        connectionRef.current = webrtcConnection
        isInitializingRef.current = false

        const localStream = webrtcConnection.getLocalStream()
        if (localStream) {
          setLocalStream(localStream)
          if (localVideoRef.current && !isVolunteer) {
          localVideoRef.current.srcObject = localStream
            // Ensure local video plays to keep track active
            localVideoRef.current.play().catch(err => {
              if (err.name !== "AbortError") {
                console.error("Error playing local video:", err)
              }
            })
          }
        }
      } catch (error) {
        console.error("Failed to initialize WebRTC:", error)
        isInitializingRef.current = false
        // Mark as fatal error if initialization fails completely
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.includes("Call is full") || 
            errorMessage.includes("Maximum") ||
            errorMessage.includes("too many users")) {
          hasFatalErrorRef.current = true
        }
      }
    }

    initConnection()

    return () => {
      // Reset initialization flag in case component unmounts during initialization
      isInitializingRef.current = false
      
      // Use ref to get the latest connection value, avoiding stale closure issues
      const currentConnection = connectionRef.current
      if (currentConnection) {
        currentConnection.endCall()
        setConnection(null)
        connectionRef.current = null
      }
      // Clean up local stream if we created it without WebRTC
      // Use refs to get latest values to avoid stale closure issues
      const currentLocalStream = localStreamRef.current
      if (currentLocalStream && !currentConnection) {
        currentLocalStream.getTracks().forEach(track => track.stop())
        setLocalStream(null)
        localStreamRef.current = null
      }
      // Reset fatal error flag on unmount to allow re-initialization if component remounts
      hasFatalErrorRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, userId, volunteerId, isVolunteer]) // Removed connection and localStream from deps - using refs instead to avoid stale closures

  // Ensure local video element plays when stream is available
  useEffect(() => {
    if (localStream && localVideoRef.current && !isVolunteer) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream
      }
      // Ensure video plays
      if (localVideoRef.current.paused) {
        localVideoRef.current.play().catch(err => {
          if (err.name !== "AbortError") {
            console.error("Error playing local video:", err)
          }
        })
      }
    }
  }, [localStream, isVolunteer])

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
    if (remoteStream) {
      // For blind users, wait for the hidden video element to mount before running full setup
      if (!isVolunteer && !remoteVideoRef.current) {
        console.log("Blind user: Waiting for hidden video element to mount...")
        let isCleanedUp = false
        const checkInterval = setInterval(() => {
          // Check if cleanup was called (dependencies changed)
          if (isCleanedUp) {
            clearInterval(checkInterval)
            return
          }
          
          if (remoteVideoRef.current) {
            clearInterval(checkInterval)
            // Element is now mounted - signal readiness so full setup can run
            setElementReady(true)
          }
        }, 100)
        
        // Clean up after 5 seconds if element still not mounted
        const timeout = setTimeout(() => {
          if (!isCleanedUp) {
            clearInterval(checkInterval)
            if (!remoteVideoRef.current) {
              console.warn("Blind user: Hidden video element not mounted after 5 seconds")
            }
          }
        }, 5000)
        
        return () => {
          isCleanedUp = true
          clearInterval(checkInterval)
          clearTimeout(timeout)
        }
      }
      
      // For blind users, also wait for elementReady state to be true
      // This ensures the full setup runs even if element mounts after stream is received
      if (!isVolunteer && !elementReady) {
        return
      }
      
      if (!remoteVideoRef.current) {
        console.warn(`Remote stream received but video element not available yet (${isVolunteer ? 'volunteer' : 'blind user'})`)
        return
      }
      
      const video = remoteVideoRef.current
      const videoTracks = remoteStream.getVideoTracks()
      const audioTracks = remoteStream.getAudioTracks()
      
      console.log(`Setting remote stream on video element (${isVolunteer ? 'volunteer' : 'blind user'}):`, {
        streamId: remoteStream.id,
        totalTracks: remoteStream.getTracks().length,
        videoTracks: videoTracks.length,
        audioTracks: audioTracks.length,
        videoTrackDetails: videoTracks.map(t => ({
          id: t.id,
          enabled: t.enabled,
          readyState: t.readyState,
          muted: t.muted,
          kind: t.kind
        })),
        audioTrackDetails: audioTracks.map(t => ({
          id: t.id,
          enabled: t.enabled,
          readyState: t.readyState,
          muted: t.muted,
          kind: t.kind
        }))
      })
      
      // Set the stream on the video element first
      if (video.srcObject !== remoteStream) {
        video.srcObject = remoteStream
      }
      
      // Ensure video element is not muted (for audio playback)
      if (video.muted) {
        console.log("Video element was muted, unmuting for audio playback")
        video.muted = false
      }
      
      // Ensure all tracks are enabled
      remoteStream.getTracks().forEach(track => {
        if (!track.enabled) {
          console.log(`Enabling ${track.kind} track:`, track.id)
          track.enabled = true
        }
      })
      
      // Ensure video tracks are enabled and monitor their state
      const cleanupFunctions: Array<() => void> = []
        
      // Monitor all tracks (video and audio)
      remoteStream.getTracks().forEach(track => {
        // Monitor track state changes
        const handleTrackStateChange = () => {
          console.log(`${track.kind} track state changed:`, {
            id: track.id,
            enabled: track.enabled,
            readyState: track.readyState,
            muted: track.muted
          })
          
          if (!remoteVideoRef.current) return
          
          const video = remoteVideoRef.current
          
          // When track unmutes, ensure video element is ready
          if (track.readyState === "live" && !track.muted) {
            if (track.kind === "video") {
              console.log("Video track unmuted - frames should now be arriving")
              
              // Force video to reload and play when track unmutes
              // Only reload if video has zero dimensions to avoid interrupting audio
              if (video.videoWidth === 0 || video.videoHeight === 0) {
                console.log("Video has zero dimensions when track unmutes, reloading video element")
                const wasPlaying = !video.paused
                const wasMuted = video.muted
                const wasVolume = video.volume
                
                video.load()
                
                // IMMEDIATELY restore audio settings after reload (load() resets everything)
                // This must be done synchronously, not in a callback
                video.muted = false
                video.volume = wasVolume > 0 ? wasVolume : 1
                console.log(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Video element audio restored after reload:`, {
                  muted: video.muted,
                  volume: video.volume
                })
                
                // Wait for video to load, then play
                const tryPlay = () => {
                  if (video.readyState >= 2) { // HAVE_CURRENT_DATA or higher
                    // Double-check audio settings before playing
                    if (video.muted) {
                      console.log(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Video was muted in tryPlay, unmuting`)
                      video.muted = false
                    }
                    if (video.volume === 0 || video.volume < 1) {
                      console.log(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Setting volume to 1 in tryPlay`)
                      video.volume = 1
                    }
                    if (wasPlaying || video.paused) {
                      console.log(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Playing video/audio after reload`)
                      video.play().catch(err => {
                        if (err.name !== "AbortError") {
                          console.error(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Error playing video after unmute:`, err)
                        }
                      })
                    }
                  } else {
                    setTimeout(tryPlay, 100)
                  }
                }
                
                video.addEventListener("loadeddata", tryPlay, { once: true })
                setTimeout(tryPlay, 200) // Fallback timeout
              } else {
                // Video already has dimensions, just ensure it's playing and not muted
                if (video.muted) {
                  video.muted = false
                }
                if (video.paused) {
                  video.play().catch(err => {
                    if (err.name !== "AbortError") {
                      console.error("Error playing video after unmute:", err)
                    }
                  })
                }
              }
            } else if (track.kind === "audio") {
              console.log(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Audio track unmuted - audio should now be playing`)
              
              // Ensure video element is not muted
              if (video.muted) {
                console.log(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Video element was muted, unmuting for audio playback`)
                video.muted = false
              }
              
              // Ensure volume is set
              if (video.volume === 0 || video.volume < 1) {
                console.log(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Setting video element volume to 1 for audio playback`)
                video.volume = 1
              }
              
              // Log audio track details
              console.log(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Audio track details (state change):`, {
                id: track.id,
                enabled: track.enabled,
                readyState: track.readyState,
                muted: track.muted
              })
              
              // Ensure video element is playing (it will play audio too)
              // DON'T reload - that would interrupt audio playback
              if (video.paused) {
                console.log(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Video element was paused, playing to start audio`)
                video.play().catch(err => {
                  if (err.name !== "AbortError") {
                    console.error(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Error playing video/audio after unmute:`, err)
                  }
                })
              } else {
                // Video is already playing, ensure audio continues
                // Call play() again to refresh audio without interrupting
                console.log(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Video already playing, refreshing audio playback`)
                const playPromise = video.play()
                if (playPromise !== undefined) {
                  playPromise.then(() => {
                    console.log(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Audio playback refreshed successfully`)
                  }).catch(err => {
                    if (err.name !== "AbortError") {
                      console.error(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Error refreshing audio playback:`, err)
                    }
                  })
                }
              }
            }
          } else if (track.muted && track.kind === "video") {
            // Track muted - wait for it to unmute again
            console.log("Video track muted - waiting for unmute...")
          }
        }
        
        // Handle unmute event specifically
        const handleUnmute = () => {
          console.log(`${track.kind} track unmute event fired - frames/audio are now being sent`)
          if (remoteVideoRef.current) {
            const video = remoteVideoRef.current
            
            if (track.kind === "video") {
              // Reload video element to pick up new frames
              console.log("Reloading video element on unmute event")
              const wasPlaying = !video.paused
              const wasMuted = video.muted
              
              // Only reload if video has zero dimensions
              if (video.videoWidth === 0 || video.videoHeight === 0) {
                const wasVolume = video.volume
                video.load()
                
                // IMMEDIATELY restore audio settings after reload (load() resets everything)
                video.muted = false
                video.volume = wasVolume > 0 ? wasVolume : 1
                console.log(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Video element audio restored after reload (unmute event):`, {
                  muted: video.muted,
                  volume: video.volume
                })
                
                // Wait for video to be ready, then play
                const tryPlay = () => {
                  if (video.readyState >= 2) { // HAVE_CURRENT_DATA or higher
                    // Double-check audio settings before playing
                    if (video.muted) {
                      video.muted = false
                    }
                    if (video.volume === 0 || video.volume < 1) {
                      video.volume = 1
                    }
                    if (wasPlaying || video.paused) {
                      video.play().catch(err => {
                        if (err.name !== "AbortError") {
                          console.error(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Error playing ${track.kind} on unmute:`, err)
                        }
                      })
                    }
                  } else {
                    // Wait a bit more for video to load
                    setTimeout(tryPlay, 100)
                  }
                }
                
                video.addEventListener("loadeddata", tryPlay, { once: true })
                setTimeout(tryPlay, 200) // Fallback timeout
              } else {
                // Video already has dimensions, just ensure it's playing and not muted
                if (video.muted) {
                  video.muted = false
                }
                if (video.paused) {
                  video.play().catch(err => {
                    if (err.name !== "AbortError") {
                      console.error(`Error playing ${track.kind} on unmute:`, err)
                    }
                  })
                }
              }
            } else if (track.kind === "audio") {
              // For audio, ensure it's playing but DON'T reload (reload would interrupt audio)
              console.log("Audio track unmuted - ensuring video element is playing audio")
              
              // Ensure video element is not muted
              if (video.muted) {
                console.log("Video element was muted, unmuting for audio playback")
                video.muted = false
              }
              
              // Ensure volume is set
              if (video.volume === 0 || video.volume < 1) {
                console.log("Setting video element volume to 1 for audio playback")
                video.volume = 1
              }
              
              // Log audio track details
              console.log("Audio track details (unmute event):", {
                id: track.id,
                enabled: track.enabled,
                readyState: track.readyState,
                muted: track.muted
              })
              
              if (video.paused) {
                video.play().catch(err => {
                  if (err.name !== "AbortError") {
                    console.error(`Error playing ${track.kind} on unmute:`, err)
                  }
                })
              } else {
                // Video is already playing, ensure audio continues
                // Call play() again to refresh audio without interrupting
                const playPromise = video.play()
                if (playPromise !== undefined) {
                  playPromise.catch(err => {
                    if (err.name !== "AbortError") {
                      console.error("Error refreshing audio playback:", err)
                    }
                  })
                }
              }
            }
          }
        }
        
        // Handle mute event
        const handleMute = () => {
          console.log(`${track.kind} track mute event fired - frames/audio stopped`)
          // Don't do anything on mute - just wait for unmute
        }
        
        // Check initial muted state
        if (track.muted) {
          console.log(`${track.kind} track is initially muted (normal during WebRTC negotiation), waiting for unmute...`)
        }
        
        track.addEventListener("ended", handleTrackStateChange)
        track.addEventListener("mute", handleMute)
        track.addEventListener("unmute", handleUnmute)
        
        // Also check initial state
        if (track.readyState === "live" && !track.muted) {
          // Track is already unmuted, trigger handler
          setTimeout(() => handleTrackStateChange(), 100)
        }
        
        // Store cleanup function
        cleanupFunctions.push(() => {
          track.removeEventListener("ended", handleTrackStateChange)
          track.removeEventListener("mute", handleMute)
          track.removeEventListener("unmute", handleUnmute)
        })
      })
      
      // Ensure video element is not muted and volume is set before playing
      if (video.muted) {
        console.log(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Video element was muted when setting stream, unmuting for audio playback`)
        video.muted = false
      }
      
      // Ensure volume is set to 1 for audio playback
      if (video.volume === 0 || video.volume < 1) {
        console.log(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Setting video element volume to 1 for audio playback`)
        video.volume = 1
      }
      
      console.log(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Video element configured for audio:`, {
        muted: video.muted,
        volume: video.volume,
        paused: video.paused,
        hasAudioTracks: audioTracks.length > 0
      })
      
      // Log audio track status (reuse audioTracks from above)
      if (audioTracks.length > 0) {
        console.log(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Audio tracks status when setting stream:`, audioTracks.map(t => ({
          id: t.id,
          enabled: t.enabled,
          readyState: t.readyState,
          muted: t.muted
        })))
      } else {
        console.warn(`${isVolunteer ? 'Volunteer' : 'Blind user'}: No audio tracks found in remote stream!`)
      }
      
      // Force video to play immediately (this will also play audio)
      console.log(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Attempting to play remote stream (video + audio)`)
      video.play().then(() => {
        console.log(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Video/audio play() promise resolved successfully`)
        // Verify audio is actually playing
        setTimeout(() => {
          if (video.paused) {
            console.warn(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Video element is paused after play() - audio may not be playing`)
          } else {
            console.log(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Video element is playing - audio should be active`)
          }
          // Check if we have audio tracks and they're enabled
          if (video.srcObject instanceof MediaStream) {
            const audioTracks = video.srcObject.getAudioTracks()
            const activeAudioTracks = audioTracks.filter(t => t.enabled && t.readyState === "live" && !t.muted)
            console.log(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Active audio tracks:`, activeAudioTracks.length, "out of", audioTracks.length)
          }
        }, 500)
      }).catch(err => {
        // Ignore AbortError - it's expected when srcObject changes
        if (err.name !== "AbortError") {
          console.error(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Error playing remote stream:`, err)
          // If it's a NotAllowedError, it's likely an autoplay policy issue
          if (err.name === "NotAllowedError") {
            console.warn(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Autoplay blocked - user interaction may be required for audio`)
          }
        }
      })
      
      // Also try playing after a short delay to handle muted tracks
      const playTimeout = setTimeout(() => {
        // Double-check muted state and volume
        if (video.muted) {
          console.log(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Video element was muted in delayed play, unmuting`)
          video.muted = false
        }
        if (video.volume === 0 || video.volume < 1) {
          console.log(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Setting video element volume to 1 in delayed play`)
          video.volume = 1
        }
        if (video.paused) {
          console.log(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Video element was paused, attempting to play`)
          video.play().catch(err => {
            if (err.name !== "AbortError") {
              console.error(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Error playing remote stream (delayed):`, err)
            }
          })
        } else {
          console.log(`${isVolunteer ? 'Volunteer' : 'Blind user'}: Video element is already playing`)
        }
      }, 500)
      
      // Return cleanup function for all listeners
      return () => {
        clearTimeout(playTimeout)
        cleanupFunctions.forEach(cleanup => cleanup())
      }
    } else if (remoteVideoRef.current && !remoteStream) {
      // Clear video element when stream is removed
      remoteVideoRef.current.srcObject = null
      // Reset element ready state when stream is removed
      if (!isVolunteer) {
        setElementReady(false)
      }
    }
  }, [remoteStream, isVolunteer, elementReady])

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        {/* For blind users: always show their own camera as main view */}
        {!isVolunteer && localStream && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ maxWidth: "100%", maxHeight: "100%" }}
          />
        )}
        
        {/* For blind users: hidden video element to play remote audio stream */}
        {!isVolunteer && remoteStream && (
          <video
            ref={setBlindUserRemoteVideoRef}
            autoPlay
            playsInline
            muted={false}
            className="hidden"
            style={{ width: 0, height: 0, position: "absolute", opacity: 0 }}
            onLoadedMetadata={() => {
              const video = remoteVideoRef.current
              if (video) {
                // Ensure video element is not muted for audio playback
                if (video.muted) {
                  console.log("Blind user: Video element was muted in onLoadedMetadata, unmuting for audio")
                  video.muted = false
                }
                
                // Ensure volume is set
                if (video.volume === 0 || video.volume < 1) {
                  console.log("Blind user: Setting video element volume to 1 for audio playback")
                  video.volume = 1
                }
                
                console.log("Blind user: Remote audio stream metadata loaded", {
                  readyState: video.readyState,
                  muted: video.muted,
                  volume: video.volume
                })
                
                // Check audio tracks
                if (video.srcObject instanceof MediaStream) {
                  const audioTracks = video.srcObject.getAudioTracks()
                  console.log("Blind user: Audio tracks in remote stream:", audioTracks.map(t => ({
                    id: t.id,
                    enabled: t.enabled,
                    readyState: t.readyState,
                    muted: t.muted
                  })))
                }
                
                video.play().catch(err => {
                  if (err.name !== "AbortError") {
                    console.error("Blind user: Error playing remote audio stream:", err)
                  }
                })
              }
            }}
            onCanPlay={() => {
              const video = remoteVideoRef.current
              if (video) {
                // Ensure video element is not muted and volume is set
                if (video.muted) {
                  console.log("Blind user: Video element was muted in onCanPlay, unmuting for audio")
                  video.muted = false
                }
                if (video.volume === 0 || video.volume < 1) {
                  console.log("Blind user: Setting video element volume to 1 in onCanPlay")
                  video.volume = 1
                }
                
                // Check audio tracks
                if (video.srcObject instanceof MediaStream) {
                  const audioTracks = video.srcObject.getAudioTracks()
                  console.log("Blind user: Audio tracks in onCanPlay:", audioTracks.map(t => ({
                    id: t.id,
                    enabled: t.enabled,
                    readyState: t.readyState,
                    muted: t.muted
                  })))
                }
                
                console.log("Blind user: Remote audio stream can play", {
                  readyState: video.readyState,
                  muted: video.muted,
                  volume: video.volume
                })
                
                video.play().catch(err => {
                  if (err.name !== "AbortError") {
                    console.error("Blind user: Error playing remote audio stream:", err)
                  }
                })
              }
            }}
          />
        )}
        
        {/* For volunteers: show remote stream (blind user's camera) */}
        {isVolunteer && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          muted={false}
          className="w-full h-full object-cover"
          style={{ maxWidth: "100%", maxHeight: "100%" }}
          onLoadedMetadata={() => {
            const video = remoteVideoRef.current
            if (video) {
              // Ensure video element is not muted for audio playback
              if (video.muted) {
                console.log("Video element was muted in onLoadedMetadata, unmuting for audio")
                video.muted = false
              }
              
              // Ensure volume is set
              if (video.volume === 0) {
                console.log("Video element volume was 0, setting to 1")
                video.volume = 1
              }
              
              console.log("Remote video metadata loaded", {
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                readyState: video.readyState,
                srcObject: video.srcObject ? "set" : "null",
                paused: video.paused,
                muted: video.muted,
                volume: video.volume
              })
              
              // Check audio tracks
              if (video.srcObject instanceof MediaStream) {
                const audioTracks = video.srcObject.getAudioTracks()
                console.log("Audio tracks in video element:", audioTracks.map(t => ({
                  id: t.id,
                  enabled: t.enabled,
                  readyState: t.readyState,
                  muted: t.muted
                })))
              }
              
              // Check if video has valid dimensions
              if (video.videoWidth === 0 || video.videoHeight === 0) {
                // Try to get video tracks from the stream
                if (video.srcObject instanceof MediaStream) {
                  const videoTracks = video.srcObject.getVideoTracks()
                  console.log("Video tracks in stream:", videoTracks.map(t => ({
                    id: t.id,
                    enabled: t.enabled,
                    readyState: t.readyState,
                    muted: t.muted
                  })))
                  
                  // Check if any track is active and enabled
                  const activeTrack = videoTracks.find(t => 
                    t.readyState === "live" && t.enabled
                  )
                  
                  if (activeTrack) {
                    // If track is muted, this is normal - wait for unmute
                    if (activeTrack.muted) {
                      console.log("Video track is muted (normal during negotiation), waiting for frames...")
                      // Don't warn yet - muted tracks will unmute when frames arrive
                    } else {
                      // Track is live and unmuted, but no dimensions yet - wait for frames
                      console.log("Active unmuted video track found, waiting for frames...")
                      setTimeout(() => {
                        if (video.videoWidth === 0 || video.videoHeight === 0) {
                          console.warn("Video still has zero dimensions after delay - track may need more time")
                          // Try reloading the video element
                          video.load()
                        }
                      }, 1000)
                    }
                  } else {
                    console.warn("No active video track found - video may not be available")
                  }
                }
              }
              
              video.play().catch(err => {
                // Ignore AbortError - it's expected when srcObject changes
                if (err.name !== "AbortError") {
                  console.error("Error playing video after metadata loaded:", err)
                }
              })
            }
          }}
          onCanPlay={() => {
            const video = remoteVideoRef.current
            if (video) {
              // Ensure video element is not muted and volume is set
              if (video.muted) {
                console.log("Video element was muted in onCanPlay, unmuting for audio")
                video.muted = false
              }
              if (video.volume === 0 || video.volume < 1) {
                console.log("Setting video element volume to 1 in onCanPlay")
                video.volume = 1
              }
              
              // Check audio tracks
              if (video.srcObject instanceof MediaStream) {
                const audioTracks = video.srcObject.getAudioTracks()
                console.log("Audio tracks in onCanPlay:", audioTracks.map(t => ({
                  id: t.id,
                  enabled: t.enabled,
                  readyState: t.readyState,
                  muted: t.muted
                })))
              }
              
              console.log("Remote video can play", {
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                readyState: video.readyState,
                muted: video.muted,
                volume: video.volume
              })
              
              // If video still has zero dimensions, check track state
              if (video.videoWidth === 0 || video.videoHeight === 0) {
                if (video.srcObject instanceof MediaStream) {
                  const videoTracks = video.srcObject.getVideoTracks()
                  const activeTrack = videoTracks.find(t => 
                    t.readyState === "live" && t.enabled
                  )
                  
                  if (activeTrack) {
                    // If track is muted, this is expected - frames will arrive when unmuted
                    if (activeTrack.muted) {
                      console.log("Video can play but track is muted - waiting for frames to arrive")
                      // Don't warn - muted state is normal during negotiation
                    } else {
                      // Track is unmuted but no dimensions yet - wait a bit
                      console.log("Active unmuted track exists, waiting for video frames...")
                      setTimeout(() => {
                        if (video.videoWidth === 0 || video.videoHeight === 0) {
                          console.warn("Video still has zero dimensions after waiting, attempting reload")
                          video.load()
                        } else {
                          console.log("Video dimensions resolved:", {
                            width: video.videoWidth,
                            height: video.videoHeight
                          })
                        }
                      }, 500)
                    }
                  } else {
                    console.warn("No active video track - video may not be available from remote peer")
                  }
                }
              } else {
                console.log("Video has valid dimensions:", {
                  width: video.videoWidth,
                  height: video.videoHeight
                })
              }
            }
          }}
          onPlay={() => {
            const video = remoteVideoRef.current
            if (video) {
              console.log("Remote video started playing", {
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight
              })
              
              // Check if video is playing but has zero dimensions
              if (video.videoWidth === 0 || video.videoHeight === 0) {
                // Check if track is muted - if so, this is normal
                if (video.srcObject instanceof MediaStream) {
                  const videoTracks = video.srcObject.getVideoTracks()
                  const activeTrack = videoTracks.find(t => 
                    t.readyState === "live" && t.enabled
                  )
                  
                  if (activeTrack?.muted) {
                    console.log("Video is playing but track is muted - frames will arrive when unmuted")
                    // Don't warn - muted state is normal during negotiation
                  } else {
                    // Track is unmuted but no dimensions - wait a bit before warning
                    setTimeout(() => {
                      if (video.videoWidth === 0 || video.videoHeight === 0) {
                        console.warn("Video is playing but has zero dimensions - video track may not be sending frames")
                      }
                    }, 1000)
                  }
                }
              }
            }
          }}
          onLoadedData={() => {
            const video = remoteVideoRef.current
            if (video && (video.videoWidth === 0 || video.videoHeight === 0)) {
              // Check if track is muted before warning
              if (video.srcObject instanceof MediaStream) {
                const videoTracks = video.srcObject.getVideoTracks()
                const activeTrack = videoTracks.find(t => 
                  t.readyState === "live" && t.enabled
                )
                
                if (activeTrack?.muted) {
                  console.log("Video data loaded but track is muted - waiting for frames")
                  // Don't warn - muted state is normal
                } else {
                  console.warn("Video data loaded but dimensions are still zero")
                }
              }
            }
          }}
        />
        )}
        
        {/* Show waiting message for volunteers when no remote stream */}
        {isVolunteer && !remoteStream && (
          <div className="text-white absolute inset-0 flex items-center justify-center z-10">
            Waiting for video feed...
          </div>
        )}
        
        {/* Show status message for blind users when waiting for volunteer */}
        {!isVolunteer && !remoteStream && localStream && (
          <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg z-10">
            <div className="text-sm font-semibold">Waiting for volunteer to join...</div>
            <div className="text-xs text-gray-300 mt-1">Your camera is ready</div>
          </div>
        )}
        
        {/* Show status message for blind users when connected */}
        {!isVolunteer && remoteStream && localStream && (
          <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg z-10">
            <div className="text-sm font-semibold">Connected to volunteer</div>
            <div className="text-xs text-gray-300 mt-1">They can see your camera</div>
          </div>
        )}
      </div>


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
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <Button
            variant="destructive"
            size="lg"
            onClick={handleEndCall}
            className="rounded-full w-16 h-16"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      )}
    </div>
  )
}

