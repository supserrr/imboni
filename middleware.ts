import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Gets the remember me preference from cookies.
 * Returns true if remember me is enabled (30 days), false otherwise (12 hours).
 */
function getRememberMePreference(request: NextRequest): boolean {
  const rememberMeCookie = request.cookies.get("remember_me")
  return rememberMeCookie?.value === "true"
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables in middleware")
    return supabaseResponse
  }

  const rememberMe = getRememberMePreference(request)
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 12 * 60 * 60 // 30 days or 12 hours in seconds

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            // Set maxAge for Supabase auth cookies (typically start with 'sb-' and contain 'auth')
            const isAuthCookie = name.startsWith("sb-") && name.includes("auth")
            
            if (isAuthCookie) {
              supabaseResponse.cookies.set(name, value, {
                ...options,
                maxAge,
                path: options?.path || "/",
                sameSite: (options?.sameSite as "lax" | "strict" | "none") || "lax",
              })
            } else {
              // For other cookies, use the original options
              supabaseResponse.cookies.set(name, value, options)
            }
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup") ||
    request.nextUrl.pathname.startsWith("/verify-email") ||
    request.nextUrl.pathname.startsWith("/auth/callback") ||
    request.nextUrl.pathname.startsWith("/callback") ||
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/privacy-terms")

  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard")

  const isProtectedRoute = isDashboardRoute ||
    request.nextUrl.pathname.startsWith("/settings/")

  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    return NextResponse.redirect(redirectUrl)
  }

  // Fetch user profile once if user is authenticated (used for both dashboard and auth route checks)
  let userProfile: { type: string } | null = null
  let profileError: Error | null = null
  
  if (user) {
    const profileResult = await supabase
      .from("users")
      .select("type")
      .eq("id", user.id)
      .single()
    
    userProfile = profileResult.data
    profileError = profileResult.error
  }

  // For dashboard routes, just ensure user has a profile
  // No need to check user type for dashboard routes
  if (user && isDashboardRoute) {
    // Handle database query errors
    if (profileError) {
      console.error("Error fetching user profile in middleware:", profileError)
      // On error, allow request to proceed to avoid blocking legitimate access
      // The page component will handle user verification
      return supabaseResponse
    }
    
    // If user profile doesn't exist, reject access to dashboard
    // Users must have a profile to access dashboard routes
    if (!userProfile) {
      console.warn(`User profile not found for user ${user.id} in middleware - redirecting to signup`)
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/signup"
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Redirect authenticated users away from auth routes, but allow callback routes to complete
  // Callback routes must be allowed to process even for authenticated users to complete OAuth flow
  const isCallbackRoute = request.nextUrl.pathname.startsWith("/auth/callback") ||
                          request.nextUrl.pathname.startsWith("/callback")
  
  if (user && isAuthRoute && request.nextUrl.pathname !== "/" && !isCallbackRoute) {
    const redirectUrl = request.nextUrl.clone()
    
    // Handle database query errors
    if (profileError) {
      console.error("Error fetching user profile in middleware (auth route):", profileError)
      // On error, redirect to signup to allow user to complete profile setup
      redirectUrl.pathname = "/signup"
      return NextResponse.redirect(redirectUrl)
    }
    
    // If user profile doesn't exist, redirect to signup to complete profile setup
    if (!userProfile) {
      console.warn(`User profile not found for user ${user.id} in middleware (auth route) - redirecting to signup`)
      redirectUrl.pathname = "/signup"
      return NextResponse.redirect(redirectUrl)
    }
    
    // Redirect authenticated users to dashboard
    redirectUrl.pathname = "/dashboard"
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

