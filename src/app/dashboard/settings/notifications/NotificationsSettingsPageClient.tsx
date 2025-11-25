"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthProvider"
import { userService } from "@/lib/services/user"
import { notificationService } from "@/lib/services/notifications"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { AlertCircle, CheckCircle2, Bell, BellOff, Volume2, VolumeX } from "@/components/ui/animated-icons"
import type { User } from "@/types/user"

export function NotificationsSettingsPageClient() {
  const { user: authUser } = useAuth()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notificationEnabled, setNotificationEnabled] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>("default")
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (!authUser) {
      router.push("/login")
      return
    }

    const loadUser = async () => {
      try {
        const userData = await userService.getProfile(authUser.id)
        setUser(userData)
        setNotificationEnabled(!!userData?.notification_token)
        
        // Load sound preference from device_info
        const deviceInfo = userData?.device_info as Record<string, unknown> | null
        const soundPreference = deviceInfo?.notification_sound_enabled
        setSoundEnabled(soundPreference !== undefined ? (soundPreference as boolean) : true)
      } catch (error) {
        console.error("Failed to load user:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()

    // Check browser notification permission
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission)
    }
  }, [authUser, router])

  const handleToggleNotifications = async (enabled: boolean) => {
    if (!authUser) return

    // For enabling, we need to check permissions first, so don't do optimistic update
    // For disabling, we can do optimistic update
    if (!enabled) {
      // Optimistic update for disabling
      const previousValue = notificationEnabled
      setNotificationEnabled(false)
      
      try {
        await userService.updateNotificationToken(authUser.id, null)
        setUser(prev => prev ? { ...prev, notification_token: null } : null)
      } catch (error: any) {
        // Revert on error
        setNotificationEnabled(previousValue)
        toast.error(error.message || "Failed to update notification settings. Please try again.")
        return
      }
      return
    }

    // Enable notifications - request permission and initialize
    setIsUpdating(true)
    try {
      if (!("Notification" in window)) {
        toast.error("Your browser does not support notifications")
        setIsUpdating(false)
        return
      }

      if (Notification.permission === "denied") {
        toast.error("Notification permission is denied. Please enable it in your browser settings.")
        setIsUpdating(false)
        return
      }

      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission()
        setPermissionStatus(permission)
        
        if (permission !== "granted") {
          toast.error("Notification permission is required to enable notifications")
          setIsUpdating(false)
          return
        }
      }

      // Initialize notifications (this will create subscription and save token)
      await notificationService.initializeNotifications(authUser.id)
      
      // Reload user to get updated token
      const userData = await userService.getProfile(authUser.id)
      setUser(userData)
      setNotificationEnabled(!!userData?.notification_token)
    } catch (error: any) {
      toast.error(error.message || "Failed to update notification settings. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleToggleSound = async (enabled: boolean) => {
    if (!authUser) return

    // Optimistic update - update UI immediately
    const previousValue = soundEnabled
    setSoundEnabled(enabled)

    try {
      const currentDeviceInfo = (user?.device_info as Record<string, unknown>) || {}
      const updatedDeviceInfo = {
        ...currentDeviceInfo,
        notification_sound_enabled: enabled,
      }

      await userService.updateProfile(authUser.id, {
        device_info: updatedDeviceInfo,
      })

      setUser(prev => prev ? { ...prev, device_info: updatedDeviceInfo } : null)
    } catch (error: any) {
      // Revert on error
      setSoundEnabled(previousValue)
      toast.error(error.message || "Failed to update sound settings. Please try again.")
    }
  }

  const handleRequestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Your browser does not support notifications")
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setPermissionStatus(permission)
      
      if (permission === "granted") {
        toast.success("Notification permission granted!")
        if (authUser && !notificationEnabled) {
          await handleToggleNotifications(true)
        }
      } else if (permission === "denied") {
        toast.error("Notification permission was denied. Please enable it in your browser settings.")
      }
    } catch (error: any) {
      toast.error("Failed to request notification permission")
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 max-w-2xl">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  const isPermissionGranted = permissionStatus === "granted"
  const isPermissionDenied = permissionStatus === "denied"
  const canEnableNotifications = isPermissionGranted || permissionStatus === "default"

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Notifications</h1>

        <Card>
          <CardHeader>
            <CardTitle>Push Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="pushNotifications" className="flex items-center gap-2">
                {notificationEnabled ? (
                  <Bell className="h-4 w-4 text-primary" />
                ) : (
                  <BellOff className="h-4 w-4 text-muted-foreground" />
                )}
                Push Notifications
              </Label>
              <Switch
                id="pushNotifications"
                checked={notificationEnabled}
                onCheckedChange={handleToggleNotifications}
                disabled={isUpdating || isPermissionDenied}
              />
            </div>

            {isPermissionDenied && (
              <p className="text-sm text-destructive">
                Permission denied. Enable in browser settings.
              </p>
            )}

            {!isPermissionGranted && !isPermissionDenied && (
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Permission required
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRequestPermission}
                  disabled={isUpdating}
                >
                  Request
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sounds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="soundEnabled" className="flex items-center gap-2">
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-primary" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
                Play Sounds
              </Label>
              <Switch
                id="soundEnabled"
                checked={soundEnabled}
                onCheckedChange={handleToggleSound}
                disabled={isUpdating || !notificationEnabled}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

