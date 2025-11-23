self.addEventListener("push", (event) => {
  const data = event.data?.json() || {}
  const title = data.title || "Imboni"
  const options = {
    body: data.body || "You have a new notification",
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
    data: data.data || {},
    tag: data.tag || "default",
    requireInteraction: true,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const data = event.notification.data
  const urlToOpen = data.url || "/volunteer/home"

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed", event)
})

