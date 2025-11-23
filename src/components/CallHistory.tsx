"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateTime, formatDuration } from "@/lib/utils/format"
import { Star } from "lucide-react"
import type { SessionWithUsers } from "@/types/session"

interface CallHistoryProps {
  sessions: SessionWithUsers[]
}

export function CallHistory({ sessions }: CallHistoryProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No call history yet
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        const volunteer = session.volunteer
        return (
          <Card key={session.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src={volunteer?.profile_picture_url || undefined}
                  />
                  <AvatarFallback>
                    {volunteer?.full_name?.charAt(0).toUpperCase() || "V"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {volunteer?.full_name || "Volunteer"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {session.started_at
                      ? formatDateTime(session.started_at)
                      : "Unknown date"}
                  </p>
                </div>
                {session.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {session.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {session.duration && (
                  <span>Duration: {formatDuration(session.duration)}</span>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

