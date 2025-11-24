export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      help_requests: {
        Row: {
          assigned_volunteer: string | null
          created_at: string | null
          id: string
          status: Database["public"]["Enums"]["request_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_volunteer?: string | null
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_volunteer?: string | null
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_requests_assigned_volunteer_fkey"
            columns: ["assigned_volunteer"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string | null
          duration: number | null
          ended_at: string | null
          help_request_id: string | null
          id: string
          rating: number | null
          started_at: string | null
          user_id: string
          volunteer_id: string
        }
        Insert: {
          created_at?: string | null
          duration?: number | null
          ended_at?: string | null
          help_request_id?: string | null
          id?: string
          rating?: number | null
          started_at?: string | null
          user_id: string
          volunteer_id: string
        }
        Update: {
          created_at?: string | null
          duration?: number | null
          ended_at?: string | null
          help_request_id?: string | null
          id?: string
          rating?: number | null
          started_at?: string | null
          user_id?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_help_request_id_fkey"
            columns: ["help_request_id"]
            isOneToOne: false
            referencedRelation: "help_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          availability: boolean | null
          bio: string | null
          created_at: string | null
          device_info: Json | null
          full_name: string | null
          history_count: number | null
          id: string
          last_active: string | null
          notification_token: string | null
          phone_number: string | null
          preferred_language: string | null
          preferred_speaker: string | null
          preferred_speed: number | null
          profile_picture_url: string | null
          rating: number | null
          reliability_score: number | null
          type: Database["public"]["Enums"]["user_type"]
          updated_at: string | null
        }
        Insert: {
          availability?: boolean | null
          bio?: string | null
          created_at?: string | null
          device_info?: Json | null
          full_name?: string | null
          history_count?: number | null
          id: string
          last_active?: string | null
          notification_token?: string | null
          phone_number?: string | null
          preferred_language?: string | null
          preferred_speaker?: string | null
          preferred_speed?: number | null
          profile_picture_url?: string | null
          rating?: number | null
          reliability_score?: number | null
          type: Database["public"]["Enums"]["user_type"]
          updated_at?: string | null
        }
        Update: {
          availability?: boolean | null
          bio?: string | null
          created_at?: string | null
          device_info?: Json | null
          full_name?: string | null
          history_count?: number | null
          id?: string
          last_active?: string | null
          notification_token?: string | null
          phone_number?: string | null
          preferred_language?: string | null
          preferred_speaker?: string | null
          preferred_speed?: number | null
          profile_picture_url?: string | null
          rating?: number | null
          reliability_score?: number | null
          type?: Database["public"]["Enums"]["user_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      volunteer_behavior: {
        Row: {
          accept_count: number | null
          created_at: string | null
          decline_count: number | null
          last_active: string | null
          response_time_avg: number | null
          success_sessions: number | null
          updated_at: string | null
          volunteer_id: string
        }
        Insert: {
          accept_count?: number | null
          created_at?: string | null
          decline_count?: number | null
          last_active?: string | null
          response_time_avg?: number | null
          success_sessions?: number | null
          updated_at?: string | null
          volunteer_id: string
        }
        Update: {
          accept_count?: number | null
          created_at?: string | null
          decline_count?: number | null
          last_active?: string | null
          response_time_avg?: number | null
          success_sessions?: number | null
          updated_at?: string | null
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_behavior_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_history: {
        Row: {
          id: string
          user_id: string | null
          image_data: string | null
          prompt: string
          response: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          image_data?: string | null
          prompt: string
          response: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          image_data?: string | null
          prompt?: string
          response?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_help_request: {
        Args: { request_id: string; volunteer_id: string }
        Returns: undefined
      }
      decline_help_request: {
        Args: { request_id: string; volunteer_id: string }
        Returns: undefined
      }
      increment_decline_count: {
        Args: { volunteer_id: string }
        Returns: undefined
      }
    }
    Enums: {
      request_status:
        | "pending"
        | "accepted"
        | "declined"
        | "in_progress"
        | "completed"
        | "cancelled"
      user_type: "blind" | "volunteer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  T extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][T]["Row"]

export type TablesInsert<
  T extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][T]["Insert"]

export type TablesUpdate<
  T extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][T]["Update"]

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T]

