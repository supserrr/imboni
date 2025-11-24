"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/AuthProvider"
import { Button } from "@/components/ui/button"
import { History, Settings, Home, LogIn, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

export function Navigation() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <nav className="border-b bg-background" role="navigation" aria-label="Main navigation">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold">
              Imboni
            </Link>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" aria-label="Home">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Link>
              </Button>
              {user && (
                <>
                  <Button asChild variant="ghost" size="sm" aria-label="History">
                    <Link href="/history">
                      <History className="w-4 h-4 mr-2" />
                      History
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm" aria-label="Settings">
                    <Link href="/settings">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            ) : (
              <Button asChild variant="ghost" size="sm" aria-label="Sign in">
                <Link href="/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

