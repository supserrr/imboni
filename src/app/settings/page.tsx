"use client"

import { SettingsDialog } from "@/components/SettingsDialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Configure narration and analysis preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsDialog />
        </CardContent>
      </Card>
    </div>
  )
}

