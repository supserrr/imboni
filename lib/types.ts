/**
 * User role types in the application.
 */
export type UserRole = 'user' | 'volunteer';

/**
 * Call status types.
 */
export type CallStatus = 'pending' | 'active' | 'completed' | 'cancelled';

/**
 * User profile data structure.
 */
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  is_available?: boolean;
  language?: string;
}

/**
 * Call request data structure.
 */
export interface CallRequest {
  id: string;
  user_id: string;
  volunteer_id?: string;
  status: CallStatus;
  created_at: string;
  updated_at: string;
  ended_at?: string;
  description?: string;
}

/**
 * Database table definitions for Supabase.
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;
      };
      call_requests: {
        Row: CallRequest;
        Insert: Omit<CallRequest, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CallRequest, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}

