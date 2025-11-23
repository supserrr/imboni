import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Imboni</h1>
          <p className="text-muted-foreground">
            Visual assistance at your fingertips
          </p>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>I need visual assistance</CardTitle>
              <CardDescription>
                Get help from volunteers via video call
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" size="lg">
                <Link href="/signup/blind">Get Started</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>I'd like to volunteer</CardTitle>
              <CardDescription>
                Help others by providing visual assistance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full" size="lg">
                <Link href="/signup/volunteer">Volunteer</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="underline hover:text-foreground">
            Log in
          </Link>
        </div>
      </div>
    </div>
  )
}
