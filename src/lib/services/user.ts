import { createClient } from "@/lib/supabase/client"
import type { User, TablesUpdate } from "@/types/database"

export class UserService {
  private supabase = createClient()

  async getProfile(userId: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()

    if (error) throw error
    return data
  }

  async updateProfile(
    userId: string,
    updates: Partial<TablesUpdate<"users">>
  ): Promise<void> {
    const { error } = await this.supabase
      .from("users")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) throw error
  }

  async setAvailability(userId: string, isAvailable: boolean): Promise<void> {
    const { error } = await this.supabase
      .from("users")
      .update({
        availability: isAvailable,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) throw error
  }

  async updateNotificationToken(
    userId: string,
    token: string | null
  ): Promise<void> {
    const { error } = await this.supabase
      .from("users")
      .update({
        notification_token: token,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) throw error
  }
}

export const userService = new UserService()

