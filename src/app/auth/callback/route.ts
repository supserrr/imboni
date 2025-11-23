import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard/blind"
  const userType = searchParams.get("user_type") as "blind" | "volunteer" | null

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      if (userType) {
        const { error: profileError } = await supabase
          .from("users")
          .upsert({
            id: data.user.id,
            type: userType,
            full_name: data.user.user_metadata?.full_name || data.user.email,
          }, {
            onConflict: "id"
          })

        if (profileError && !profileError.message.includes("duplicate key")) {
          console.error("Profile creation error:", profileError)
        }

        if (userType === "volunteer") {
          await supabase
            .from("volunteer_behavior")
            .upsert({
              volunteer_id: data.user.id,
            }, {
              onConflict: "volunteer_id"
            })
        }
      } else {
        const { data: existingProfile } = await supabase
          .from("users")
          .select("type")
          .eq("id", data.user.id)
          .single()
        
        if (existingProfile) {
          const finalNext = existingProfile.type === "volunteer" 
            ? "/dashboard/volunteer" 
            : "/dashboard/blind"
          const forwardedHost = request.headers.get("x-forwarded-host")
          const isLocalEnv = process.env.NODE_ENV === "development"
          if (isLocalEnv) {
            return NextResponse.redirect(`${origin}${finalNext}`)
          } else if (forwardedHost) {
            return NextResponse.redirect(`https://${forwardedHost}${finalNext}`)
          } else {
            return NextResponse.redirect(`${origin}${finalNext}`)
          }
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocalEnv = process.env.NODE_ENV === "development"
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
