"use client"

import Link from "next/link"
import { SignupForm } from "@/components/forms/SignupForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function VolunteerSignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign up as Volunteer</CardTitle>
          <CardDescription>
            Create an account to help others
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm userType="volunteer" />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="underline hover:text-foreground">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

