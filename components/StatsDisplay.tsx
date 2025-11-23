"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star } from "lucide-react"

interface StatsDisplayProps {
  callsAnswered: number
  rating: number | null
}

export function StatsDisplay({ callsAnswered, rating }: StatsDisplayProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Calls Answered
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{callsAnswered}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Rating
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="text-2xl font-bold">
              {rating ? rating.toFixed(1) : "N/A"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

