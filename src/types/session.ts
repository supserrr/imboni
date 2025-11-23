export interface Session {
  id: string
  help_request_id: string | null
  user_id: string
  volunteer_id: string
  started_at: string | null
  ended_at: string | null
  duration: number | null
  rating: number | null
  created_at: string | null
}

export interface SessionWithUsers extends Session {
  user?: {
    id: string
    full_name: string | null
    profile_picture_url: string | null
  }
  volunteer?: {
    id: string
    full_name: string | null
    profile_picture_url: string | null
  }
}

