import { createClient } from "@/lib/supabase/client"

export interface PastVolunteer {
  volunteer_id: string
  volunteer_name: string | null
  volunteer_rating: number | null
  last_call_date: string | null
  total_calls: number
}

export interface VolunteerHistory {
  volunteer_id: string
  volunteer_name: string | null
  volunteer_rating: number | null
  sessions: Array<{
    id: string
    started_at: string | null
    duration: number | null
    rating: number | null
  }>
}

export class HistoryService {
  private supabase = createClient()

  async getPastVolunteers(userId: string): Promise<PastVolunteer[]> {
    const { data, error } = await this.supabase
      .from("sessions")
      .select(
        `
        volunteer_id,
        started_at,
        volunteer:users!sessions_volunteer_id_fkey (
          id,
          full_name,
          rating
        )
      `
      )
      .eq("user_id", userId)
      .order("started_at", { ascending: false })

    if (error) throw error

    const volunteerMap = new Map<string, PastVolunteer>()

    data?.forEach((session) => {
      const volunteer = Array.isArray(session.volunteer)
        ? session.volunteer[0]
        : session.volunteer

      if (!volunteer) return

      const volunteerId = volunteer.id
      const existing = volunteerMap.get(volunteerId)

      if (existing) {
        existing.total_calls++
        if (
          session.started_at &&
          (!existing.last_call_date ||
            session.started_at > existing.last_call_date)
        ) {
          existing.last_call_date = session.started_at
        }
      } else {
        volunteerMap.set(volunteerId, {
          volunteer_id: volunteerId,
          volunteer_name: volunteer.full_name,
          volunteer_rating: volunteer.rating,
          last_call_date: session.started_at,
          total_calls: 1,
        })
      }
    })

    return Array.from(volunteerMap.values())
  }

  async getVolunteerHistory(
    userId: string,
    volunteerId: string
  ): Promise<VolunteerHistory | null> {
    const { data: volunteer, error: volunteerError } = await this.supabase
      .from("users")
      .select("id, full_name, rating")
      .eq("id", volunteerId)
      .single()

    if (volunteerError) throw volunteerError

    const { data: sessions, error: sessionsError } = await this.supabase
      .from("sessions")
      .select("id, started_at, duration, rating")
      .eq("user_id", userId)
      .eq("volunteer_id", volunteerId)
      .order("started_at", { ascending: false })

    if (sessionsError) throw sessionsError

    return {
      volunteer_id: volunteer.id,
      volunteer_name: volunteer.full_name,
      volunteer_rating: volunteer.rating,
      sessions: sessions || [],
    }
  }

  async getSessionHistory(userId: string, limit = 50) {
    const { data, error } = await this.supabase
      .from("sessions")
      .select(
        `
        *,
        volunteer:users!sessions_volunteer_id_fkey (
          id,
          full_name,
          profile_picture_url
        )
      `
      )
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }
}

export const historyService = new HistoryService()

