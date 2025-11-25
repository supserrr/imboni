"use client"

import { createContext, useContext, useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { notificationService } from "@/lib/services/notifications"

interface AuthContextType {
  user: User | null
  session: any | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = useMemo(() => {
    try {
      return createClient()
    } catch (error) {
      console.error("Failed to create Supabase client:", error)
      return null
    }
  }, [])

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        
        // Handle refresh token errors
        if (error) {
          // Check if it's a refresh token error
          if (
            error.message?.includes("Refresh Token Not Found") ||
            error.message?.includes("Invalid Refresh Token") ||
            error.message?.includes("refresh_token_not_found") ||
            error.status === 401
          ) {
            // Clear invalid session
            console.warn("Invalid refresh token detected, clearing session")
            await supabase.auth.signOut()
            setSession(null)
            setUser(null)
            setIsLoading(false)
            return
          }
          // For other errors, log and continue
          console.error("Auth session error:", error)
        }
        
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          try {
            await notificationService.initializeNotifications(session.user.id)
          } catch (error) {
            console.error("Failed to initialize notifications:", error)
          }
        }
      } catch (error: any) {
        // Handle any unexpected errors
        if (
          error?.message?.includes("Refresh Token Not Found") ||
          error?.message?.includes("Invalid Refresh Token") ||
          error?.message?.includes("refresh_token_not_found")
        ) {
          console.warn("Invalid refresh token detected, clearing session")
          await supabase.auth.signOut()
          setSession(null)
          setUser(null)
        } else {
          console.error("Failed to initialize auth:", error)
        }
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      // Handle token refresh errors
      if (event === "TOKEN_REFRESHED" && !session) {
        // Token refresh failed, clear session
        console.warn("Token refresh failed, clearing session")
        setSession(null)
        setUser(null)
        return
      }
      
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user && event === "SIGNED_IN") {
        try {
          await notificationService.initializeNotifications(session.user.id)
        } catch (error) {
          console.error("Failed to initialize notifications:", error)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

