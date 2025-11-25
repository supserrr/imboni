"use client"

import { useEffect, useState } from "react"
import { useTheme } from "@/contexts/ThemeProvider"
import { useAuth } from "@/contexts/AuthProvider"
import { userService } from "@/lib/services/user"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Theme } from "@/lib/theme"
import type { User } from "@/types/user"

export function AppearanceSettingsPageClient() {
  const { user: authUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<User | null>(null)

  // Load theme from database on mount
  useEffect(() => {
    const loadTheme = async () => {
      if (!authUser) return

      try {
        const userData = await userService.getProfile(authUser.id)
        setUser(userData)

        const deviceInfo = userData?.device_info as Record<string, unknown> | null
        const dbTheme = deviceInfo?.theme as Theme | undefined

        if (dbTheme && dbTheme !== theme) {
          setTheme(dbTheme)
        }
      } catch (error) {
        console.error("Failed to load theme from database:", error)
      }
    }

    loadTheme()
  }, [authUser, theme, setTheme])

  // Save theme to database when changed
  const handleThemeChange = async (newTheme: Theme) => {
    if (!authUser) return

    // Optimistic update - update UI immediately
    const previousTheme = theme
    setTheme(newTheme)

    try {
      const deviceInfo = (user?.device_info as Record<string, unknown>) || {}
      const updatedDeviceInfo = {
        ...deviceInfo,
        theme: newTheme,
      }

      await userService.updateProfile(authUser.id, {
        device_info: updatedDeviceInfo,
      })
      setUser(prev => prev ? { ...prev, device_info: updatedDeviceInfo } : null)
    } catch (error) {
      console.error("Failed to save theme to database:", error)
      // Revert on error
      setTheme(previousTheme)
    }
  }

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
            <RadioGroup value={theme} onValueChange={(value) => handleThemeChange(value as Theme)}>
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

