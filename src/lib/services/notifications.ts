import { createClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

export class NotificationService {
  private _supabase: SupabaseClient<Database> | null = null
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null
  private initializationInProgress = false
  private initializedUsers = new Set<string>()

  private get supabase() {
    if (!this._supabase) {
      // Only create client in browser environment
      if (typeof window === "undefined") {
        // During build/SSR, return null - methods will handle this gracefully
        return null as any
      }
      try {
        this._supabase = createClient()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        console.error("Failed to create Supabase client:", errorMessage)
        return null as any
      }
    }
    return this._supabase
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      throw new Error("This browser does not support notifications")
    }

    const permission = await Notification.requestPermission()
    return permission
  }

  async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service workers are not supported")
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js")
      this.serviceWorkerRegistration = registration
      return registration
    } catch (error) {
      throw new Error(`Service worker registration failed: ${error}`)
    }
  }

  async saveNotificationToken(
    userId: string,
    subscription: PushSubscription
  ): Promise<void> {
    if (!this.supabase) {
      throw new Error("Supabase client is not available")
    }
    
    const subscriptionJson = subscription.toJSON()
    const token = JSON.stringify(subscriptionJson)

    const { error } = await this.supabase
      .from("users")
      .update({
        notification_token: token,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) throw error
  }

  async initializeNotifications(userId: string): Promise<void> {
    if (this.initializedUsers.has(userId) || this.initializationInProgress) {
      return
    }

    this.initializationInProgress = true

    try {
      const permission = await this.requestPermission()
      if (permission !== "granted") {
        return
      }

      const registration = await this.registerServiceWorker()

      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await this.saveNotificationToken(userId, subscription)
        this.initializedUsers.add(userId)
        return
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        // VAPID key not configured - notifications will not work
        // This is expected if push notifications are not set up
        return
      }

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      })

      await this.saveNotificationToken(userId, newSubscription)
      this.initializedUsers.add(userId)
    } catch (error) {
      console.error("Failed to initialize notifications:", error)
    } finally {
      this.initializationInProgress = false
    }
  }

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (!this.supabase) {
      throw new Error("Supabase client is not available")
    }
    
    const { data: user } = await this.supabase
      .from("users")
      .select("notification_token")
      .eq("id", userId)
      .single()

    if (!user?.notification_token) {
      throw new Error("User notification token not found")
    }

    const subscription = JSON.parse(user.notification_token)

    try {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription,
          title,
          body,
          data,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send notification")
      }
    } catch (error) {
      console.error("Failed to send push notification:", error)
      throw error
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/")

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }
}

// Export service instance - will be created lazily when accessed in browser
// During build time, the instance is created but won't be used
export const notificationService = new NotificationService()

