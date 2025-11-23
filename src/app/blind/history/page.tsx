"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthProvider"
import { CallHistory } from "@/components/CallHistory"
import { historyService } from "@/lib/services/history"
import type { SessionWithUsers } from "@/types/session"

export default function HistoryPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionWithUsers[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const loadHistory = async () => {
      try {
        const data = await historyService.getSessionHistory(user.id, 50)
        setSessions(data as SessionWithUsers[])
      } catch (error) {
        console.error("Failed to load history:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [user, router])

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 max-w-4xl">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Call History</h1>
        <CallHistory sessions={sessions} />
      </div>
    </div>
  )
}

