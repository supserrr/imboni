"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Logo } from "@/components/Logo"
import Link from "next/link"
import { Mail, CheckCircle2 } from "lucide-react"

function VerifyEmailContent() {
  const [isResending, setIsResending] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get email from URL params if available
    const emailParam = searchParams.get("email")
    if (emailParam) {
      setEmail(emailParam)
    } else {
      // Try to get email from session
      try {
        const supabase = createClient()
        if (supabase) {
          supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
            if (session?.user?.email) {
              setEmail(session.user.email)
            }
          })
        }
      } catch (error) {
        console.error("Failed to create Supabase client:", error)
      }
    }
  }, [searchParams])

  const handleResend = async () => {
    if (!email) {
      toast.error("We couldn't find your email address. Please try signing up again, and we're here to help if you need support.")
      return
    }

    setIsResending(true)
    try {
      const supabase = createClient()
      if (!supabase) {
        throw new Error("Supabase client not available")
      }
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      })
      if (error) throw error
      toast.success("We've sent you a verification email. Please check your inbox. We're here to help you get started.")
    } catch (error: any) {
      toast.error(error.message || "We couldn't resend the email right now. Please try again, and we're here to help if you need support.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center">
            <Logo variant="full" className="h-8 w-auto" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </div>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
              We've sent a verification link to your email address. We're here to help you get started on your journey.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {email && (
              <div className="rounded-lg border bg-muted p-3 text-sm">
                <p className="text-muted-foreground">Email sent to:</p>
                <p className="font-medium">{email}</p>
              </div>
            )}
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p>Check your inbox for the verification email</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p>Click the link in the email to verify your account</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p>Check your spam folder if you don't see it</p>
              </div>
            </div>

          <Button
            variant="outline"
            onClick={handleResend}
              disabled={isResending || !email}
            className="w-full"
          >
            {isResending ? "Sending..." : "Resend verification email"}
          </Button>

            <div className="text-center text-sm">
              <Link href="/login" className="text-muted-foreground hover:text-foreground underline">
                Back to login
              </Link>
            </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
