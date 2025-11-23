import { Enums } from "./database"

export type UserType = Enums<"user_type">

export interface User {
  id: string
  type: UserType
  availability: boolean | null
  rating: number | null
  reliability_score: number | null
  last_active: string | null
  history_count: number | null
  full_name: string | null
  phone_number: string | null
  preferred_language: string | null
  preferred_speaker: string | null
  preferred_speed: number | null
  notification_token: string | null
  device_info: Record<string, unknown> | null
  profile_picture_url: string | null
  bio: string | null
  created_at: string | null
  updated_at: string | null
}

export interface UserProfile extends User {
  email?: string
}

