import { Enums } from "./database"

export type RequestStatus = Enums<"request_status">

export interface HelpRequest {
  id: string
  user_id: string
  status: RequestStatus | null
  assigned_volunteer: string | null
  created_at: string | null
  updated_at: string | null
}

export interface HelpRequestWithUser extends HelpRequest {
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

