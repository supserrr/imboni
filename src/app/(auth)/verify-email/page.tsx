"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false)
  const supabase = createClient()

  const handleResend = async () => {
    setIsResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: "",
      })
      if (error) throw error
      toast.success("Verification email sent!")
    } catch (error: any) {
      toast.error(error.message || "Failed to resend email")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            Please check your email and click the verification link to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We've sent a verification link to your email address. Please check
            your inbox and click the link to verify your account.
          </p>
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={isResending}
            className="w-full"
          >
            {isResending ? "Sending..." : "Resend verification email"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

