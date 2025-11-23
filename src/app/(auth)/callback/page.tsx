"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authService } from "@/lib/services/auth"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function CallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const url = window.location.href
        await authService.handleOAuthCallback(url)
        setStatus("success")
        setTimeout(() => {
          const supabase = createClient()
          const { data: profile } = await supabase
            .from("users")
            .select("type")
            .eq("id", data.user.id)
            .single()
          
          const userType = profile?.type || "blind"
          router.push(`/dashboard/${userType}`)
        }, 1000)
      } catch (err: any) {
        setError(err.message || "Authentication failed")
        setStatus("error")
      }
    }

    handleCallback()
  }, [router])

  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Completing sign in...</CardTitle>
            <CardDescription>Please wait</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Success!</CardTitle>
          <CardDescription>Redirecting...</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

