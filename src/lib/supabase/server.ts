import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { Database } from "@/types/database"

/**
 * Gets the remember me preference from cookies.
 * Returns true if remember me is enabled (30 days), false otherwise (12 hours).
 */
function getRememberMePreference(cookieStore: ReturnType<typeof cookies>): boolean {
  const rememberMeCookie = cookieStore.get("remember_me")
  return rememberMeCookie?.value === "true"
}

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )
  }

  const cookieStore = await cookies()
  const rememberMe = getRememberMePreference(cookieStore)
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 12 * 60 * 60 // 30 days or 12 hours in seconds

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Set maxAge for Supabase auth cookies (typically start with 'sb-' and contain 'auth')
              const isAuthCookie = name.startsWith("sb-") && name.includes("auth")
              
              if (isAuthCookie) {
                cookieStore.set(name, value, {
                  ...options,
                  maxAge,
                  path: options?.path || "/",
                  sameSite: (options?.sameSite as "lax" | "strict" | "none") || "lax",
                })
              } else {
                // For other cookies, use the original options
                cookieStore.set(name, value, options)
              }
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

