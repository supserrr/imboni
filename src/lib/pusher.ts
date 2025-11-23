import Pusher from "pusher"

/**
 * Server-side Pusher instance for API routes
 * Used for authenticating presence channels
 */
const PUSHER_APP_ID = process.env.PUSHER_APP_ID
const PUSHER_KEY = process.env.PUSHER_KEY
const PUSHER_SECRET = process.env.PUSHER_SECRET
const PUSHER_CLUSTER = process.env.PUSHER_CLUSTER

if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
  console.error("Missing Pusher environment variables:", {
    PUSHER_APP_ID: !!PUSHER_APP_ID,
    PUSHER_KEY: !!PUSHER_KEY,
    PUSHER_SECRET: !!PUSHER_SECRET,
    PUSHER_CLUSTER: !!PUSHER_CLUSTER,
  })
  throw new Error("Missing required Pusher environment variables. Please check your .env.local file.")
}

export const pusher = new Pusher({
  appId: PUSHER_APP_ID,
  key: PUSHER_KEY,
  secret: PUSHER_SECRET,
  cluster: PUSHER_CLUSTER,
  useTLS: true,
})

