export const USER_TYPES = {
  BLIND: "blind",
  VOLUNTEER: "volunteer",
} as const

export const REQUEST_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const

export const CALL_STATE = {
  IDLE: "idle",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  RATING: "rating",
  ENDED: "ended",
} as const

export const WEBRTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    ...(process.env.NEXT_PUBLIC_TURN_URL
      ? [
          {
            urls: process.env.NEXT_PUBLIC_TURN_URL,
            username: process.env.NEXT_PUBLIC_TURN_USERNAME,
            credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
          },
        ]
      : []),
  ],
}

export const MATCHING_ALGORITHM = {
  RELIABILITY_WEIGHT: 1,
  RESPONSE_TIME_WEIGHT: 0.5,
  RATING_WEIGHT: 10,
} as const

export const VOLUNTEER_RESPONSE_TIMEOUT = 30000 // 30 seconds

export const POLLING_INTERVAL = 2000 // 2 seconds

export const RECONNECTION_ATTEMPTS = 5
export const RECONNECTION_DELAYS = [1000, 2000, 4000, 8000, 16000] // Exponential backoff

