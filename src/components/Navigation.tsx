"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/AuthProvider"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { LogIn, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

/**
 * Navigation component for landing page and non-dashboard pages
 * Dashboard has its own bottom tab navigation
 */
export function Navigation() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  // Don't show navigation on dashboard pages (they have bottom tabs)
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/dashboard")) {
    return null
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" role="navigation" aria-label="Main navigation">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo variant="full" className="h-8 w-auto" />
                    </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button asChild variant="ghost" size="sm" aria-label="Dashboard">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
              </>
            ) : (
              <>
              <Button asChild variant="ghost" size="sm" aria-label="Sign in">
                <Link href="/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
              </Button>
                <Button asChild size="sm" aria-label="Sign up">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

