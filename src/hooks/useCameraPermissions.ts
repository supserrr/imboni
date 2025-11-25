"use client"

import { useState, useEffect, useCallback } from "react"

export type CameraPermissionStatus = "granted" | "denied" | "prompt" | "checking" | "not-supported"

interface UseCameraPermissionsReturn {
  permissionStatus: CameraPermissionStatus
  requestPermission: () => Promise<boolean>
  checkPermission: () => Promise<void>
}

const PERMISSION_STORAGE_KEY = "camera-permission-status"
const MICROPHONE_PERMISSION_STORAGE_KEY = "microphone-permission-status"

/**
 * Detect if browser is Safari
 * Safari has different permission handling and doesn't support Permissions API for camera/microphone
 */
const isSafari = (): boolean => {
  if (typeof window === "undefined") return false
  const userAgent = navigator.userAgent.toLowerCase()
  return /safari/.test(userAgent) && !/chrome/.test(userAgent) && !/chromium/.test(userAgent)
}

/**
 * Hook to check and request camera and microphone permissions
 * Stores permission status in localStorage to avoid repeated checks
 * Both permissions must be granted for the status to be "granted"
 */
export function useCameraPermissions(): UseCameraPermissionsReturn {
  // Initialize from localStorage immediately to avoid delay on refresh
  // For Safari, also check sessionStorage as backup
  const getInitialStatus = (): CameraPermissionStatus => {
    if (typeof window === "undefined") return "checking"
    
    const safari = isSafari()
    
    // Try localStorage first
    let stored = localStorage.getItem(PERMISSION_STORAGE_KEY)
    let micStored = localStorage.getItem(MICROPHONE_PERMISSION_STORAGE_KEY)
    
    // For Safari, also check sessionStorage as backup (Safari may clear localStorage)
    if (safari && (!stored || !micStored)) {
      const sessionStored = sessionStorage.getItem(PERMISSION_STORAGE_KEY)
      const sessionMicStored = sessionStorage.getItem(MICROPHONE_PERMISSION_STORAGE_KEY)
      
      // Restore from sessionStorage if localStorage was cleared
      if (sessionStored && !stored) {
        stored = sessionStored
        localStorage.setItem(PERMISSION_STORAGE_KEY, sessionStored)
      }
      if (sessionMicStored && !micStored) {
        micStored = sessionMicStored
        localStorage.setItem(MICROPHONE_PERMISSION_STORAGE_KEY, sessionMicStored)
      }
    }
    
    // Both permissions need to be granted for status to be "granted"
    if (stored === "granted" && micStored === "granted") {
      return "granted"
    } else if (stored === "denied" || micStored === "denied") {
      return "denied"
    }
    return "checking"
  }
  
  const [permissionStatus, setPermissionStatus] = useState<CameraPermissionStatus>(getInitialStatus())

  const checkPermission = useCallback(async () => {
    const safari = isSafari()
    
    // Check if browser supports permissions API (Safari doesn't for camera/microphone)
    // TypeScript-safe check: verify permissions API exists and is callable
    const supportsPermissionsAPI = typeof navigator !== "undefined" && 
                                   navigator.permissions && 
                                   typeof navigator.permissions.query === "function" && 
                                   !safari
    
    if (!supportsPermissionsAPI) {
      // Fallback: check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionStatus("not-supported")
        return
      }
      
      // For Safari or browsers without Permissions API, rely on getUserMedia verification
      const stored = localStorage.getItem(PERMISSION_STORAGE_KEY)
      const micStored = localStorage.getItem(MICROPHONE_PERMISSION_STORAGE_KEY)
      
      // If we have stored "granted" status, verify it with getUserMedia
      if (stored === "granted" && micStored === "granted") {
        try {
          // Verify permission is still granted by attempting to access media
          const testStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
          })
          testStream.getTracks().forEach(track => track.stop())
          
          // Permission is still granted, keep the status
          setPermissionStatus("granted")
          // Re-save to localStorage to prevent Safari from clearing it
          localStorage.setItem(PERMISSION_STORAGE_KEY, "granted")
          localStorage.setItem(MICROPHONE_PERMISSION_STORAGE_KEY, "granted")
          
          // For Safari, also update sessionStorage
          if (isSafari()) {
            try {
              sessionStorage.setItem(PERMISSION_STORAGE_KEY, "granted")
              sessionStorage.setItem(MICROPHONE_PERMISSION_STORAGE_KEY, "granted")
            } catch (e) {
              // Ignore storage errors
            }
          }
          return
        } catch (error: any) {
          // Permission was revoked
          if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
            setPermissionStatus("denied")
            localStorage.setItem(PERMISSION_STORAGE_KEY, "denied")
            localStorage.setItem(MICROPHONE_PERMISSION_STORAGE_KEY, "denied")
            return
          }
          // For other errors (like device not found), keep granted status
          // This is important for Safari which may throw non-permission errors
          setPermissionStatus("granted")
          return
        }
      } else if (stored === "denied" || micStored === "denied") {
        setPermissionStatus("denied")
      } else {
        setPermissionStatus("prompt")
      }
      return
    }

    try {
      // Check stored status first to preserve granted permissions on refresh
      const stored = localStorage.getItem(PERMISSION_STORAGE_KEY)
      const micStored = localStorage.getItem(MICROPHONE_PERMISSION_STORAGE_KEY)
      
      // If we have stored "granted" status, verify it's still valid with getUserMedia
      // This is more reliable than Permissions API which can return "prompt" even after grant
      if (stored === "granted" && micStored === "granted") {
        try {
          // Verify permission is still granted by attempting to access media
          const testStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
          })
          testStream.getTracks().forEach(track => track.stop())
          
          // Permission is still granted, keep the status
          setPermissionStatus("granted")
          // Ensure localStorage is still set to granted
          localStorage.setItem(PERMISSION_STORAGE_KEY, "granted")
          localStorage.setItem(MICROPHONE_PERMISSION_STORAGE_KEY, "granted")
          
          // For Safari, also update sessionStorage
          if (isSafari()) {
            try {
              sessionStorage.setItem(PERMISSION_STORAGE_KEY, "granted")
              sessionStorage.setItem(MICROPHONE_PERMISSION_STORAGE_KEY, "granted")
            } catch (e) {
              // Ignore storage errors
            }
          }
          return
        } catch (error: any) {
          // Permission was revoked, check Permissions API to get current state
          if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
            setPermissionStatus("denied")
            localStorage.setItem(PERMISSION_STORAGE_KEY, "denied")
            localStorage.setItem(MICROPHONE_PERMISSION_STORAGE_KEY, "denied")
            return
          }
          // For other errors, fall through to Permissions API check
        }
      }

      // Check both camera and microphone permissions using Permissions API
      const [cameraResult, microphoneResult] = await Promise.all([
        navigator.permissions.query({ name: "camera" as PermissionName }).catch(() => null),
        navigator.permissions.query({ name: "microphone" as PermissionName }).catch(() => null),
      ])
      
      let status: CameraPermissionStatus = "prompt"
      // Both permissions must be granted for status to be "granted"
      if (cameraResult?.state === "granted" && microphoneResult?.state === "granted") {
        status = "granted"
      } else if (cameraResult?.state === "denied" || microphoneResult?.state === "denied") {
        status = "denied"
      }

      // Only update localStorage if we got a definitive state (granted or denied)
      // Don't overwrite "granted" with "prompt" - "prompt" is just the default state
      if (status === "granted") {
        setPermissionStatus("granted")
        localStorage.setItem(PERMISSION_STORAGE_KEY, "granted")
        localStorage.setItem(MICROPHONE_PERMISSION_STORAGE_KEY, "granted")
      } else if (status === "denied") {
        setPermissionStatus("denied")
        localStorage.setItem(PERMISSION_STORAGE_KEY, "denied")
        localStorage.setItem(MICROPHONE_PERMISSION_STORAGE_KEY, "denied")
      } else {
        // Status is "prompt" - only update if we don't have a stored "granted" status
        // This prevents overwriting granted permissions on refresh
        if (stored !== "granted" && micStored !== "granted") {
          setPermissionStatus("prompt")
        } else {
          // Keep the stored granted status even if API returns "prompt"
          setPermissionStatus("granted")
        }
      }

      // Listen for permission changes on both
      if (cameraResult) {
        cameraResult.onchange = () => {
          const micStored = localStorage.getItem(MICROPHONE_PERMISSION_STORAGE_KEY)
          if (cameraResult.state === "granted" && micStored === "granted") {
          setPermissionStatus("granted")
          localStorage.setItem(PERMISSION_STORAGE_KEY, "granted")
          } else if (cameraResult.state === "denied") {
          setPermissionStatus("denied")
          localStorage.setItem(PERMISSION_STORAGE_KEY, "denied")
            localStorage.setItem(MICROPHONE_PERMISSION_STORAGE_KEY, "denied")
        } else {
            // State changed to "prompt" - only update if we don't have stored "granted"
            // This prevents overwriting granted permissions when API returns "prompt"
            const stored = localStorage.getItem(PERMISSION_STORAGE_KEY)
            if (stored !== "granted") {
          setPermissionStatus("prompt")
          localStorage.setItem(PERMISSION_STORAGE_KEY, "prompt")
            }
          }
        }
      }
      
      if (microphoneResult) {
        microphoneResult.onchange = () => {
          const camStored = localStorage.getItem(PERMISSION_STORAGE_KEY)
          if (microphoneResult.state === "granted" && camStored === "granted") {
            setPermissionStatus("granted")
            localStorage.setItem(MICROPHONE_PERMISSION_STORAGE_KEY, "granted")
          } else if (microphoneResult.state === "denied") {
            setPermissionStatus("denied")
            localStorage.setItem(MICROPHONE_PERMISSION_STORAGE_KEY, "denied")
            localStorage.setItem(PERMISSION_STORAGE_KEY, "denied")
          } else {
            // State changed to "prompt" - only update if we don't have stored "granted"
            // This prevents overwriting granted permissions when API returns "prompt"
            const micStored = localStorage.getItem(MICROPHONE_PERMISSION_STORAGE_KEY)
            if (micStored !== "granted") {
              setPermissionStatus("prompt")
              localStorage.setItem(MICROPHONE_PERMISSION_STORAGE_KEY, "prompt")
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking camera/microphone permission:", error)
      // Fallback: check localStorage if permission API fails
      const stored = localStorage.getItem(PERMISSION_STORAGE_KEY)
      const micStored = localStorage.getItem(MICROPHONE_PERMISSION_STORAGE_KEY)
      if (stored === "granted" && micStored === "granted") {
        setPermissionStatus("granted")
      } else if (stored === "denied" || micStored === "denied") {
        setPermissionStatus("denied")
      } else if (typeof navigator !== "undefined" && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function") {
        setPermissionStatus("prompt")
      } else {
        setPermissionStatus("not-supported")
      }
    }
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionStatus("not-supported")
      return false
    }

    try {
      setPermissionStatus("checking")
      // Request permission by attempting to access both camera and microphone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true 
      })
      
      // Stop the stream immediately - we just needed to request permission
      stream.getTracks().forEach(track => track.stop())
      
      setPermissionStatus("granted")
      // Save to localStorage immediately
      localStorage.setItem(PERMISSION_STORAGE_KEY, "granted")
      localStorage.setItem(MICROPHONE_PERMISSION_STORAGE_KEY, "granted")
      
      // For Safari, also save to sessionStorage as backup
      // Safari's ITP may clear localStorage, but sessionStorage is more persistent
      if (isSafari()) {
        try {
          sessionStorage.setItem(PERMISSION_STORAGE_KEY, "granted")
          sessionStorage.setItem(MICROPHONE_PERMISSION_STORAGE_KEY, "granted")
          // Also save a timestamp to help with persistence
          const timestamp = Date.now().toString()
          localStorage.setItem(`${PERMISSION_STORAGE_KEY}-timestamp`, timestamp)
          localStorage.setItem(`${MICROPHONE_PERMISSION_STORAGE_KEY}-timestamp`, timestamp)
          sessionStorage.setItem(`${PERMISSION_STORAGE_KEY}-timestamp`, timestamp)
          sessionStorage.setItem(`${MICROPHONE_PERMISSION_STORAGE_KEY}-timestamp`, timestamp)
        } catch (e) {
          // Ignore storage errors
        }
      }
      
      return true
    } catch (error: any) {
      console.error("Error requesting camera/microphone permission:", error)
      
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setPermissionStatus("denied")
        localStorage.setItem(PERMISSION_STORAGE_KEY, "denied")
        localStorage.setItem(MICROPHONE_PERMISSION_STORAGE_KEY, "denied")
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setPermissionStatus("not-supported")
      } else {
        setPermissionStatus("prompt")
      }
      return false
    }
  }, [])

  useEffect(() => {
    // Check stored permission status first
    const stored = localStorage.getItem(PERMISSION_STORAGE_KEY)
    const micStored = localStorage.getItem(MICROPHONE_PERMISSION_STORAGE_KEY)
    const safari = isSafari()
    
    if (stored === "granted" && micStored === "granted") {
      // If we have a stored "granted" status for both, use it immediately
      // This prevents re-prompting on refresh
      setPermissionStatus("granted")
      
      // For Safari, be more aggressive about preserving permissions
      // Safari may clear localStorage, so we verify but don't overwrite on errors
      if (safari) {
        // In Safari, verify with getUserMedia but be lenient with errors
        checkPermission().catch((error) => {
          // If verification fails in Safari, still keep granted status
          // Safari may throw errors even when permissions are granted
          console.log("[Safari] Permission verification failed, but keeping granted status:", error)
          // Only update if we get a definitive denial
          try {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
              .then(stream => {
                stream.getTracks().forEach(track => track.stop())
                // Permission is actually granted, ensure localStorage is set
                localStorage.setItem(PERMISSION_STORAGE_KEY, "granted")
                localStorage.setItem(MICROPHONE_PERMISSION_STORAGE_KEY, "granted")
              })
              .catch(err => {
                // Only update to denied if we get a clear permission denial
                if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                setPermissionStatus("denied")
                  localStorage.setItem(PERMISSION_STORAGE_KEY, "denied")
                  localStorage.setItem(MICROPHONE_PERMISSION_STORAGE_KEY, "denied")
                }
              })
          } catch {
            // Ignore errors, keep granted status
          }
        })
      } else {
        // For other browsers, verify permission is still valid in background
        checkPermission().catch(() => {
        // If check fails, keep the stored granted status
          // This prevents losing permission status on network errors or API failures
      })
      }
    } else if (stored === "denied" || micStored === "denied") {
      setPermissionStatus("denied")
      // Still check to see if user changed it in browser settings
      checkPermission()
    } else {
      // No stored status or it's "prompt", check actual permission
      checkPermission()
    }
  }, [checkPermission])

  return {
    permissionStatus,
    requestPermission,
    checkPermission,
  }
}

