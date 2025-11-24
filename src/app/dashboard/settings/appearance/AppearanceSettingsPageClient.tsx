"use client"

import { useTheme } from "@/contexts/ThemeProvider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Theme } from "@/lib/theme"

export function AppearanceSettingsPageClient() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Appearance</h1>

        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>Choose your preferred theme</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light">Light</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark">Dark</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="system" />
                <Label htmlFor="system">System</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

