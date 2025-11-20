export type UserType = 'blind' | 'volunteer';

export interface UserProfile {
  id: string;
  type: UserType;
  full_name?: string;
  phone_number?: string;
  preferred_language: string;
  notification_token?: string;
  device_info?: {
    os: string;
    model: string;
    version: string;
  };
  profile_picture_url?: string;
  bio?: string;
  availability: boolean;
  rating: number;
  reliability_score: number;
  last_active: string;
  history_count: number;
  created_at: string;
  updated_at: string;
}

