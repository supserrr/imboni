import { createClient } from "@/lib/supabase/client"
import {
  MATCHING_ALGORITHM,
  VOLUNTEER_RESPONSE_TIMEOUT,
} from "@/lib/constants"
import type { HelpRequest } from "@/types/help-request"

export class MatchingService {
  private supabase = createClient()

  async createHelpRequest(userId: string): Promise<HelpRequest> {
    const { data, error } = await this.supabase
      .from("help_requests")
      .insert({
        user_id: userId,
        status: "pending",
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async findBestVolunteer(excludeIds: string[] = []): Promise<string | null> {
    const { data: volunteers, error } = await this.supabase
      .from("users")
      .select(
        `
        id,
        rating,
        reliability_score,
        volunteer_behavior (
          response_time_avg,
          accept_count,
          decline_count
        )
      `
      )
      .eq("type", "volunteer")
      .eq("availability", true)
      .not("id", "in", `(${excludeIds.join(",")})`)

    if (error) throw error
    if (!volunteers || volunteers.length === 0) return null

    let bestVolunteer: {
      id: string
      score: number
    } | null = null

    for (const volunteer of volunteers) {
      const behavior = Array.isArray(volunteer.volunteer_behavior)
        ? volunteer.volunteer_behavior[0]
        : volunteer.volunteer_behavior

      const rating = volunteer.rating || 5.0
      const reliabilityScore = volunteer.reliability_score || 100.0
      const responseTime = behavior?.response_time_avg || 0

      const score =
        reliabilityScore * MATCHING_ALGORITHM.RELIABILITY_WEIGHT -
        responseTime * MATCHING_ALGORITHM.RESPONSE_TIME_WEIGHT +
        rating * MATCHING_ALGORITHM.RATING_WEIGHT

      if (!bestVolunteer || score > bestVolunteer.score) {
        bestVolunteer = { id: volunteer.id, score }
      }
    }

    return bestVolunteer?.id || null
  }

  async assignVolunteer(
    requestId: string,
    volunteerId: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from("help_requests")
      .update({
        assigned_volunteer: volunteerId,
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)

    if (error) throw error

    setTimeout(() => {
      this.checkVolunteerResponse(requestId, volunteerId)
    }, VOLUNTEER_RESPONSE_TIMEOUT)
  }

  private async checkVolunteerResponse(
    requestId: string,
    volunteerId: string
  ): Promise<void> {
    const { data: request } = await this.supabase
      .from("help_requests")
      .select("status, assigned_volunteer")
      .eq("id", requestId)
      .single()

    if (
      request &&
      request.status === "pending" &&
      request.assigned_volunteer === volunteerId
    ) {
      await this.declineRequest(requestId, volunteerId)
    }
  }

  async declineRequest(requestId: string, volunteerId: string): Promise<void> {
    const { error } = await this.supabase.rpc("decline_help_request", {
      request_id: requestId,
      volunteer_id: volunteerId,
    })

    if (error) throw error
  }

  async acceptRequest(requestId: string, volunteerId: string): Promise<void> {
    const { error } = await this.supabase.rpc("accept_help_request", {
      request_id: requestId,
      volunteer_id: volunteerId,
    })

    if (error) throw error
  }

  async cancelRequest(requestId: string): Promise<void> {
    const { error } = await this.supabase
      .from("help_requests")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)

    if (error) throw error
  }

  async getHelpRequest(requestId: string): Promise<HelpRequest | null> {
    const { data, error } = await this.supabase
      .from("help_requests")
      .select("*")
      .eq("id", requestId)
      .single()

    if (error) throw error
    return data
  }
}

export const matchingService = new MatchingService()

