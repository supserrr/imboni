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
  confidence_threshold?: number;
  preferred_voice?: string;
  speech_rate?: number;
  verbosity_level?: 'detailed' | 'concise';
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
 * AI session data structure.
 */
export interface AISession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
  frames_analyzed: number;
  average_confidence: number;
}

/**
 * Audio playback state.
 */
export interface AudioState {
  isPlaying: boolean;
  isMuted: boolean;
  currentText?: string;
  queue: string[];
}

/**
 * AI analysis state.
 */
export interface AIAnalysisState {
  isActive: boolean;
  lastAnalysis?: {
    description: string;
    confidence: number;
    timestamp: number;
  };
  lowConfidenceDetected: boolean;
  query?: string;
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
      ai_sessions: {
        Row: AISession;
        Insert: Omit<AISession, 'id' | 'started_at'>;
        Update: Partial<Omit<AISession, 'id' | 'started_at'>>;
      };
    };
  };
}

