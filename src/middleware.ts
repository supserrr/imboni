import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
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

  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard/") ||
    request.nextUrl.pathname.startsWith("/blind/") ||
    request.nextUrl.pathname.startsWith("/volunteer/") ||
    request.nextUrl.pathname.startsWith("/settings/")

  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    return NextResponse.redirect(redirectUrl)
  }

  if (user && isAuthRoute && request.nextUrl.pathname !== "/") {
    const redirectUrl = request.nextUrl.clone()
    const { data: userProfile } = await supabase
      .from("users")
      .select("type")
      .eq("id", user.id)
      .single()
    
    const userType = userProfile?.type || "blind"
    redirectUrl.pathname = `/dashboard/${userType}`
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

