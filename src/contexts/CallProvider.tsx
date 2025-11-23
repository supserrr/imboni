"use client"

import { createContext, useContext, useState, useCallback } from "react"
import type { CallState } from "@/types/webrtc"

interface CallContextType {
  callState: CallState
  isCallActive: boolean
  callDuration: number
  setCallState: (state: CallState) => void
  setCallDuration: (duration: number) => void
  resetCall: () => void
}

const CallContext = createContext<CallContextType | undefined>(undefined)

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [callState, setCallState] = useState<CallState>("idle")
  const [callDuration, setCallDuration] = useState(0)

  const resetCall = useCallback(() => {
    setCallState("idle")
    setCallDuration(0)
  }, [])

  const isCallActive =
    callState === "connecting" || callState === "connected"

  return (
    <CallContext.Provider
      value={{
        callState,
        isCallActive,
        callDuration,
        setCallState,
        setCallDuration,
        resetCall,
      }}
    >
      {children}
    </CallContext.Provider>
  )
}

export function useCall() {
  const context = useContext(CallContext)
  if (context === undefined) {
    throw new Error("useCall must be used within a CallProvider")
  }
  return context
}

