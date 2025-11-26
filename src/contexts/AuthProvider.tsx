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

    // Helper function to check if error is a refresh token error
    const isRefreshTokenError = (error: any): boolean => {
      if (!error) return false
      const message = error.message || error.toString() || ""
      const status = error.status || error.statusCode
      return (
        message.includes("Refresh Token Not Found") ||
        message.includes("Invalid Refresh Token") ||
        message.includes("refresh_token_not_found") ||
        message.includes("JWTExpired") ||
        status === 401
      )
    }

    // Set up error handler to suppress refresh token errors from global handlers
    const errorHandler = (event: ErrorEvent | PromiseRejectionEvent) => {
      const error = event instanceof ErrorEvent ? event.error : event.reason
      if (isRefreshTokenError(error)) {
        // Suppress refresh token errors - we handle them gracefully
        event.preventDefault?.()
        return true
      }
      return false
    }

    // Intercept console.error to filter refresh token errors from Supabase
    // This prevents Supabase's internal error logging from showing refresh token errors
    const originalConsoleError = console.error
    const consoleErrorWrapper = (...args: any[]) => {
      // Check all arguments for refresh token error messages
      const allMessages = args.map(arg => {
        if (arg instanceof Error) {
          return arg.message || arg.toString()
        }
        return String(arg || "")
      }).join(" ")
      
      // Only suppress if it's specifically a refresh token error
      if (
        allMessages.includes("Refresh Token Not Found") ||
        allMessages.includes("Invalid Refresh Token") ||
        allMessages.includes("refresh_token_not_found")
      ) {
        // Suppress these errors - we handle them gracefully in our code
        return
      }
      // For all other errors, use the original console.error
      originalConsoleError.apply(console, args)
    }
    console.error = consoleErrorWrapper

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        
        // Handle refresh token errors
        if (error) {
          if (isRefreshTokenError(error)) {
            // Clear invalid session silently
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
        if (isRefreshTokenError(error)) {
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
      try {
        // Handle token refresh errors
        if (event === "TOKEN_REFRESHED" && !session) {
          // Token refresh failed, clear session
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
      } catch (error: any) {
        // Catch any errors in the auth state change handler
        if (isRefreshTokenError(error)) {
          setSession(null)
          setUser(null)
        } else {
          console.error("Error in auth state change:", error)
        }
      }
    })

    // Add global error listeners
    window.addEventListener("error", errorHandler)
    window.addEventListener("unhandledrejection", errorHandler)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener("error", errorHandler)
      window.removeEventListener("unhandledrejection", errorHandler)
      // Restore original console.error
      console.error = originalConsoleError
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

