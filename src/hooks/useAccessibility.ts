"use client"

import { useEffect, useCallback } from "react"

/**
 * Hook for managing accessibility features
 * - Keyboard shortcuts
 * - Screen reader announcements
 * - Focus management
 */
export function useAccessibility() {
  /**
   * Announce to screen readers
   */
  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    const announcement = document.createElement("div")
    announcement.setAttribute("role", "status")
    announcement.setAttribute("aria-live", priority)
    announcement.setAttribute("aria-atomic", "true")
    announcement.className = "sr-only"
    announcement.textContent = message

    document.body.appendChild(announcement)

    // Remove after announcement is read
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }, [])

  return {
    announce,
  }
}

/**
 * Keyboard shortcuts hook
 */
export function useKeyboardShortcuts(handlers: {
  onStart?: () => void
  onStop?: () => void
  onPause?: () => void
  onResume?: () => void
  onQuery?: () => void
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement).isContentEditable
      ) {
        return
      }

      // Space bar: Start/Resume
      if (event.key === " " && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault()
        if (handlers.onStart) {
          handlers.onStart()
        } else if (handlers.onResume) {
          handlers.onResume()
        }
        return
      }

      // Escape: Stop
      if (event.key === "Escape") {
        if (handlers.onStop) {
          handlers.onStop()
        }
        return
      }

      // P: Pause
      if (event.key === "p" || event.key === "P") {
        if (handlers.onPause) {
          handlers.onPause()
        }
        return
      }

      // Q: Focus query input
      if (event.key === "q" || event.key === "Q") {
        event.preventDefault()
        if (handlers.onQuery) {
          handlers.onQuery()
        }
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handlers])
}

