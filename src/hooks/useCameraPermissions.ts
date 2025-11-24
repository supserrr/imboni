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
  const [permissionStatus, setPermissionStatus] = useState<CameraPermissionStatus>("checking")

  const checkPermission = useCallback(async () => {
    // Check if browser supports permissions API
    if (!navigator.permissions || !navigator.permissions.query) {
      // Fallback: check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionStatus("not-supported")
        return
      }
      // If getUserMedia is available but permissions API is not, assume prompt state
      setPermissionStatus("prompt")
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

      setPermissionStatus(status)
      
      // Store in localStorage
      localStorage.setItem(PERMISSION_STORAGE_KEY, status)

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
      // Fallback: try to check via getUserMedia
      if (typeof navigator !== "undefined" && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function") {
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
    if (stored && (stored === "granted" || stored === "denied")) {
      setPermissionStatus(stored as CameraPermissionStatus)
    }
    
    // Then check actual permission status
    checkPermission()
  }, [checkPermission])

  return {
    permissionStatus,
    requestPermission,
    checkPermission,
  }
}

