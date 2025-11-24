import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      const { error: profileError } = await supabase
        .from("users")
        .upsert({
          id: data.user.id,
          type: "blind",
          full_name: data.user.user_metadata?.full_name || data.user.email || "User",
        }, {
          onConflict: "id"
        })

      if (profileError && !profileError.message.includes("duplicate key")) {
        console.error("Profile creation error:", profileError)
      }

      // Always redirect to dashboard
      const redirectPath = "/dashboard"
      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocalEnv = process.env.NODE_ENV === "development"
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectPath}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`)
      } else {
        return NextResponse.redirect(`${origin}${redirectPath}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
