import { createClient } from "@/lib/supabase/client"
import type { Session } from "@/types/session"

export class SessionService {
  private supabase = createClient()

  async startSession(
    requestId: string,
    userId: string,
    volunteerId: string
  ): Promise<Session> {
    const { data, error } = await this.supabase
      .from("sessions")
      .insert({
        help_request_id: requestId,
        user_id: userId,
        volunteer_id: volunteerId,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async endSession(
    sessionId: string,
    durationSeconds: number,
    rating?: number
  ): Promise<void> {
    const updates: {
      ended_at: string
      duration: number
      rating?: number
    } = {
      ended_at: new Date().toISOString(),
      duration: durationSeconds,
    }

    if (rating !== undefined) {
      updates.rating = rating
    }

    const { error } = await this.supabase
      .from("sessions")
      .update(updates)
      .eq("id", sessionId)

    if (error) throw error
  }

  async updateSessionRating(
    sessionId: string,
    rating: number
  ): Promise<void> {
    const { error } = await this.supabase
      .from("sessions")
      .update({
        rating,
      })
      .eq("id", sessionId)

    if (error) throw error
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const { data, error } = await this.supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single()

    if (error) throw error
    return data
  }
}

export const sessionService = new SessionService()

