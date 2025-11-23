import { createClient } from "@/lib/supabase/client"

export class NotificationService {
  private supabase = createClient()
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null

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
    try {
      const permission = await this.requestPermission()
      if (permission !== "granted") {
        console.warn("Notification permission not granted")
        return
      }

      const registration = await this.registerServiceWorker()

      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await this.saveNotificationToken(userId, subscription)
        return
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        console.warn("VAPID public key not configured")
        return
      }

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
      })

      await this.saveNotificationToken(userId, newSubscription)
    } catch (error) {
      console.error("Failed to initialize notifications:", error)
      throw error
    }
  }

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<void> {
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

export const notificationService = new NotificationService()

