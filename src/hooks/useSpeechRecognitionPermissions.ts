"use client"

import { useState, useEffect, useCallback } from "react"

export type SpeechRecognitionPermissionStatus = "granted" | "denied" | "prompt" | "checking" | "not-supported"

interface UseSpeechRecognitionPermissionsReturn {
  permissionStatus: SpeechRecognitionPermissionStatus
  requestPermission: () => Promise<boolean>
  checkPermission: () => Promise<void>
}

const SPEECH_RECOGNITION_PERMISSION_STORAGE_KEY = "speech-recognition-permission-status"

/**
 * Detect if browser is Safari or iOS
 */
const isSafari = (): boolean => {
  if (typeof window === "undefined") return false
  const userAgent = navigator.userAgent.toLowerCase()
  return /safari/.test(userAgent) && !/chrome/.test(userAgent) && !/chromium/.test(userAgent)
}

const isIOS = (): boolean => {
  if (typeof window === "undefined") return false
  return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
}

/**
 * Check if Speech Recognition API is available
 */
const isSpeechRecognitionAvailable = (): boolean => {
  if (typeof window === "undefined") return false
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
}

/**
 * Hook to check and request speech recognition permissions
 * For iOS and Safari, speech recognition requires a separate permission
 * that must be requested by actually starting recognition
 */
export function useSpeechRecognitionPermissions(): UseSpeechRecognitionPermissionsReturn {
  const getInitialStatus = (): SpeechRecognitionPermissionStatus => {
    if (typeof window === "undefined") return "checking"
    
    if (!isSpeechRecognitionAvailable()) {
      return "not-supported"
    }
    
    const stored = localStorage.getItem(SPEECH_RECOGNITION_PERMISSION_STORAGE_KEY)
    
    if (stored === "granted") {
      return "granted"
    } else if (stored === "denied") {
      return "denied"
    }
    
    return "prompt"
  }
  
  const [permissionStatus, setPermissionStatus] = useState<SpeechRecognitionPermissionStatus>(getInitialStatus())

  const checkPermission = useCallback(async () => {
    if (!isSpeechRecognitionAvailable()) {
      setPermissionStatus("not-supported")
      return
    }

    const stored = localStorage.getItem(SPEECH_RECOGNITION_PERMISSION_STORAGE_KEY)
    
    // For iOS/Safari, we need to actually try to start recognition to check permission
    // This is because there's no Permissions API for speech recognition
    if (isIOS() || isSafari()) {
      if (stored === "granted") {
        // Try to verify permission by creating a recognition instance
        try {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
          const recognition = new SpeechRecognition()
          
          // Set up a quick test - we'll catch any permission errors
          recognition.onerror = (event: any) => {
            if (event.error === "not-allowed" || event.error === "service-not-allowed") {
              setPermissionStatus("denied")
              localStorage.setItem(SPEECH_RECOGNITION_PERMISSION_STORAGE_KEY, "denied")
            }
          }
          
          recognition.onstart = () => {
            // If it starts, permission is granted
            setPermissionStatus("granted")
            localStorage.setItem(SPEECH_RECOGNITION_PERMISSION_STORAGE_KEY, "granted")
            recognition.stop()
          }
          
          // Try to start - this will trigger permission check on iOS/Safari
          recognition.start()
          
          // Stop after a short delay if it started
          setTimeout(() => {
            try {
              recognition.stop()
            } catch {
              // Ignore errors
            }
          }, 100)
        } catch (error: any) {
          if (error.name === "NotAllowedError" || error.message?.includes("not allowed")) {
            setPermissionStatus("denied")
            localStorage.setItem(SPEECH_RECOGNITION_PERMISSION_STORAGE_KEY, "denied")
          } else {
            // Keep stored status if verification fails
            setPermissionStatus(stored === "granted" ? "granted" : "prompt")
          }
        }
      } else if (stored === "denied") {
        setPermissionStatus("denied")
      } else {
        setPermissionStatus("prompt")
      }
      return
    }

    // For other browsers, check if we have stored status
    if (stored === "granted") {
      setPermissionStatus("granted")
    } else if (stored === "denied") {
      setPermissionStatus("denied")
    } else {
      setPermissionStatus("prompt")
    }
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSpeechRecognitionAvailable()) {
      setPermissionStatus("not-supported")
      return false
    }

    try {
      setPermissionStatus("checking")
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      // For iOS/Safari, we need to actually start recognition to request permission
      return new Promise((resolve) => {
        let resolved = false
        
        recognition.onstart = () => {
          if (!resolved) {
            resolved = true
            setPermissionStatus("granted")
            localStorage.setItem(SPEECH_RECOGNITION_PERMISSION_STORAGE_KEY, "granted")
            
            // Stop immediately after getting permission
            recognition.stop()
            resolve(true)
          }
        }
        
        recognition.onerror = (event: any) => {
          if (!resolved) {
            resolved = true
            if (event.error === "not-allowed" || event.error === "service-not-allowed") {
              setPermissionStatus("denied")
              localStorage.setItem(SPEECH_RECOGNITION_PERMISSION_STORAGE_KEY, "denied")
              resolve(false)
            } else if (event.error === "no-speech") {
              // No speech detected, but permission was granted
              setPermissionStatus("granted")
              localStorage.setItem(SPEECH_RECOGNITION_PERMISSION_STORAGE_KEY, "granted")
              recognition.stop()
              resolve(true)
            } else {
              // Other errors - might be permission related
              setPermissionStatus("denied")
              localStorage.setItem(SPEECH_RECOGNITION_PERMISSION_STORAGE_KEY, "denied")
              resolve(false)
            }
          }
        }
        
        recognition.onend = () => {
          // Recognition ended - if we haven't resolved yet, check status
          if (!resolved) {
            // If we got here without an error, permission might be granted
            // But we can't be sure, so check stored status
            const stored = localStorage.getItem(SPEECH_RECOGNITION_PERMISSION_STORAGE_KEY)
            if (stored === "granted") {
              resolved = true
              resolve(true)
            }
          }
        }
        
        // Set a timeout to avoid hanging
        setTimeout(() => {
          if (!resolved) {
            resolved = true
            // If we got here, permission might have been granted (user allowed it)
            // Check if recognition started at all
            const stored = localStorage.getItem(SPEECH_RECOGNITION_PERMISSION_STORAGE_KEY)
            if (stored === "granted") {
              resolve(true)
            } else {
              setPermissionStatus("prompt")
              resolve(false)
            }
          }
        }, 5000)
        
        // Start recognition - this will trigger permission prompt on iOS/Safari
        try {
          recognition.start()
        } catch (error: any) {
          if (!resolved) {
            resolved = true
            if (error.name === "NotAllowedError" || error.message?.includes("not allowed")) {
              setPermissionStatus("denied")
              localStorage.setItem(SPEECH_RECOGNITION_PERMISSION_STORAGE_KEY, "denied")
              resolve(false)
            } else {
              setPermissionStatus("not-supported")
              resolve(false)
            }
          }
        }
      })
    } catch (error: any) {
      console.error("Error requesting speech recognition permission:", error)
      setPermissionStatus("not-supported")
      return false
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(SPEECH_RECOGNITION_PERMISSION_STORAGE_KEY)
    
    if (stored === "granted") {
      setPermissionStatus("granted")
      // Verify permission is still valid in background
      checkPermission().catch(() => {
        // Keep granted status if check fails
      })
    } else if (stored === "denied") {
      setPermissionStatus("denied")
    } else {
      checkPermission()
    }
  }, [checkPermission])

  return {
    permissionStatus,
    requestPermission,
    checkPermission,
  }
}

