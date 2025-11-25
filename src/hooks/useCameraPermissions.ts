"use client"

import { useState, useEffect, useCallback } from "react"

export type CameraPermissionStatus = "granted" | "denied" | "prompt" | "checking" | "not-supported"

interface UseCameraPermissionsReturn {
  permissionStatus: CameraPermissionStatus
  requestPermission: () => Promise<boolean>
  checkPermission: () => Promise<void>
}

const PERMISSION_STORAGE_KEY = "camera-permission-status"

/**
 * Hook to check and request camera permissions
 * Stores permission status in localStorage to avoid repeated checks
 */
export function useCameraPermissions(): UseCameraPermissionsReturn {
  // Initialize from localStorage immediately to avoid delay on refresh
  const getInitialStatus = (): CameraPermissionStatus => {
    if (typeof window === "undefined") return "checking"
    const stored = localStorage.getItem(PERMISSION_STORAGE_KEY)
    if (stored === "granted" || stored === "denied") {
      return stored as CameraPermissionStatus
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
      if (stored === "granted" || stored === "denied") {
        setPermissionStatus(stored as CameraPermissionStatus)
      } else {
        setPermissionStatus("prompt")
      }
      return
    }

    try {
      const result = await navigator.permissions.query({ name: "camera" as PermissionName })
      
      let status: CameraPermissionStatus = "prompt"
      if (result.state === "granted") {
        status = "granted"
      } else if (result.state === "denied") {
        status = "denied"
      }

      // Only update if stored status isn't already "granted" (to prevent overriding on refresh)
      const stored = localStorage.getItem(PERMISSION_STORAGE_KEY)
      if (stored !== "granted" || status === "granted") {
        setPermissionStatus(status)
        // Store in localStorage
        localStorage.setItem(PERMISSION_STORAGE_KEY, status)
      }

      // Listen for permission changes
      result.onchange = () => {
        if (result.state === "granted") {
          setPermissionStatus("granted")
          localStorage.setItem(PERMISSION_STORAGE_KEY, "granted")
        } else if (result.state === "denied") {
          setPermissionStatus("denied")
          localStorage.setItem(PERMISSION_STORAGE_KEY, "denied")
        } else {
          setPermissionStatus("prompt")
          localStorage.setItem(PERMISSION_STORAGE_KEY, "prompt")
        }
      }
    } catch (error) {
      console.error("Error checking camera permission:", error)
      // Fallback: check localStorage if permission API fails
      const stored = localStorage.getItem(PERMISSION_STORAGE_KEY)
      if (stored === "granted" || stored === "denied") {
        setPermissionStatus(stored as CameraPermissionStatus)
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
      // Request permission by attempting to access camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      
      // Stop the stream immediately - we just needed to request permission
      stream.getTracks().forEach(track => track.stop())
      
      setPermissionStatus("granted")
      localStorage.setItem(PERMISSION_STORAGE_KEY, "granted")
      return true
    } catch (error: any) {
      console.error("Error requesting camera permission:", error)
      
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setPermissionStatus("denied")
        localStorage.setItem(PERMISSION_STORAGE_KEY, "denied")
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
    if (stored === "granted") {
      // If we have a stored "granted" status, use it immediately
      // This prevents re-prompting on refresh
      setPermissionStatus("granted")
      // Still check actual permission in background to keep it in sync
      // but don't override if stored says granted
      checkPermission().then(() => {
        // Only update if the actual check confirms it's still granted
        // If it changed to denied, update it
        const currentStored = localStorage.getItem(PERMISSION_STORAGE_KEY)
        if (currentStored !== "granted") {
          // Permission was revoked, update state
          const result = navigator.permissions?.query({ name: "camera" as PermissionName }).catch(() => null)
          if (result) {
            result.then(perm => {
              if (perm?.state === "denied") {
                setPermissionStatus("denied")
              }
            })
          }
        }
      }).catch(() => {
        // If check fails, keep the stored granted status
      })
    } else if (stored === "denied") {
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

