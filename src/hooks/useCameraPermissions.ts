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
 * Hook to check and request camera and microphone permissions
 * Stores permission status in localStorage to avoid repeated checks
 * Both permissions must be granted for the status to be "granted"
 */
export function useCameraPermissions(): UseCameraPermissionsReturn {
  // Initialize from localStorage immediately to avoid delay on refresh
  const getInitialStatus = (): CameraPermissionStatus => {
    if (typeof window === "undefined") return "checking"
    const stored = localStorage.getItem(PERMISSION_STORAGE_KEY)
    const micStored = localStorage.getItem(MICROPHONE_PERMISSION_STORAGE_KEY)
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
    // Check if browser supports permissions API
    if (!navigator.permissions || !navigator.permissions.query) {
      // Fallback: check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionStatus("not-supported")
        return
      }
      // If getUserMedia is available but permissions API is not, check localStorage
      const stored = localStorage.getItem(PERMISSION_STORAGE_KEY)
      const micStored = localStorage.getItem(MICROPHONE_PERMISSION_STORAGE_KEY)
      // Both permissions need to be granted
      if (stored === "granted" && micStored === "granted") {
        setPermissionStatus("granted")
      } else if (stored === "denied" || micStored === "denied") {
        setPermissionStatus("denied")
      } else {
        setPermissionStatus("prompt")
      }
      return
    }

    try {
      // Check both camera and microphone permissions
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

      // Only update if stored status isn't already "granted" (to prevent overriding on refresh)
      const stored = localStorage.getItem(PERMISSION_STORAGE_KEY)
      if (stored !== "granted" || status === "granted") {
        setPermissionStatus(status)
        // Store in localStorage
        if (cameraResult) {
          localStorage.setItem(PERMISSION_STORAGE_KEY, cameraResult.state)
        }
        if (microphoneResult) {
          localStorage.setItem(MICROPHONE_PERMISSION_STORAGE_KEY, microphoneResult.state)
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
          } else {
            setPermissionStatus("prompt")
            localStorage.setItem(PERMISSION_STORAGE_KEY, "prompt")
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
          } else {
            setPermissionStatus("prompt")
            localStorage.setItem(MICROPHONE_PERMISSION_STORAGE_KEY, "prompt")
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
      localStorage.setItem(PERMISSION_STORAGE_KEY, "granted")
      localStorage.setItem(MICROPHONE_PERMISSION_STORAGE_KEY, "granted")
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
    if (stored === "granted" && micStored === "granted") {
      // If we have a stored "granted" status for both, use it immediately
      // This prevents re-prompting on refresh
      setPermissionStatus("granted")
      // Still check actual permission in background to keep it in sync
      // but don't override if stored says granted
      checkPermission().then(async () => {
        // Only update if the actual check confirms it's still granted
        // If it changed to denied, update it
        const currentStored = localStorage.getItem(PERMISSION_STORAGE_KEY)
        const currentMicStored = localStorage.getItem(MICROPHONE_PERMISSION_STORAGE_KEY)
        if (currentStored !== "granted" || currentMicStored !== "granted") {
          // Permission was revoked, update state
          const [cameraResult, micResult] = await Promise.all([
            navigator.permissions?.query({ name: "camera" as PermissionName }).catch(() => null),
            navigator.permissions?.query({ name: "microphone" as PermissionName }).catch(() => null),
          ])
          if (cameraResult && micResult) {
            const [cam, mic] = await Promise.all([cameraResult, micResult])
            if (cam?.state === "denied" || mic?.state === "denied") {
              setPermissionStatus("denied")
            }
          }
        }
      }).catch(() => {
        // If check fails, keep the stored granted status
      })
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

