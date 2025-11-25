"use client"

import { BottomNavBar } from "@/components/ui/bottom-nav-bar"
import { useAuth } from "@/contexts/AuthProvider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0))" }}>
        <BottomNavBar stickyBottom />
      </div>
    </div>
  )
}

