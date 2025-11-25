import { createBrowserClient } from "@supabase/ssr"
import { Database } from "@/types/database"

/**
 * Gets the remember me preference from cookies.
 * Returns true if remember me is enabled (30 days), false otherwise (12 hours).
 */
function getRememberMePreference(): boolean {
  if (typeof document === "undefined") return false
  const cookies = document.cookie.split(";")
  const rememberMeCookie = cookies.find((cookie) => cookie.trim().startsWith("remember_me="))
  return rememberMeCookie?.includes("true") ?? false
}

export function createClient() {
  // Only create client in browser environment
  // With Cache Components, client components may be prerendered
  // Return null during SSR instead of throwing
  if (typeof window === "undefined") {
    return null as any
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return document.cookie.split(";").map((cookie) => {
          const [name, ...rest] = cookie.trim().split("=")
          return { name, value: rest.join("=") }
        })
      },
      setAll(cookiesToSet) {
        const rememberMe = getRememberMePreference()
        const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 12 * 60 * 60 // 30 days or 12 hours in seconds

        cookiesToSet.forEach(({ name, value, options }) => {
          // Set maxAge for Supabase auth cookies (typically start with 'sb-' and contain 'auth')
          const isAuthCookie = name.startsWith("sb-") && name.includes("auth")
          
          if (isAuthCookie) {
            const path = options?.path || "/"
            const sameSite = options?.sameSite || "Lax"
            const secure = options?.secure ? "; Secure" : ""
            document.cookie = `${name}=${value}; max-age=${maxAge}; path=${path}; SameSite=${sameSite}${secure}`
          } else {
            // For other cookies, use the original options
            const path = options?.path || "/"
            const sameSite = options?.sameSite || "Lax"
            const secure = options?.secure ? "; Secure" : ""
            const originalMaxAge = options?.maxAge ? `; max-age=${options.maxAge}` : ""
            document.cookie = `${name}=${value}; path=${path}; SameSite=${sameSite}${secure}${originalMaxAge}`
          }
        })
      },
    },
  })
}

