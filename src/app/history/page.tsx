"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthProvider"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { History } from "lucide-react"
import Link from "next/link"

interface AnalysisHistoryItem {
  id: string
  prompt: string
  response: string
  created_at: string
}

export default function HistoryPage() {
  const { user } = useAuth()
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const loadHistory = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("analysis_history")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50)

        if (error) {
          console.error("Error loading history:", error)
        } else {
          setHistory((data as AnalysisHistoryItem[]) || [])
        }
      } catch (error) {
        console.error("Error loading history:", error)
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [user])

  if (!user) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Analysis History</CardTitle>
            <CardDescription>
              View your past analyses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">
              Please sign in to view your analysis history
            </p>
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading history...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Analysis History
          </CardTitle>
          <CardDescription>
            Your past camera analyses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No analysis history yet. Start using the camera to see your analyses here.
            </p>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <Card key={item.id} className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                      <p className="text-sm font-semibold text-muted-foreground">
                        {item.prompt}
                      </p>
                      <p className="text-sm leading-relaxed">{item.response}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

