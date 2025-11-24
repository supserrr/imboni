import { createClient } from "@/lib/supabase/client"
import type { User } from "@/types/user"
import type { TablesUpdate } from "@/types/database"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

export class UserService {
  private _supabase: SupabaseClient<Database> | null = null

  private get supabase() {
    if (!this._supabase) {
      // Only create client in browser environment
      // With Cache Components, this may be called during SSR
      if (typeof window === "undefined") {
        return null as any
      }
      try {
        this._supabase = createClient()
        if (!this._supabase) {
          return null as any
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        console.error("Failed to create Supabase client:", errorMessage)
        return null as any
      }
    }
    return this._supabase
  }

  async getProfile(userId: string): Promise<User | null> {
    const supabase = this.supabase
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()

    if (error) throw error
    if (!data) return null
    // Convert database type to User type
    return {
      ...data,
      device_info: data.device_info as Record<string, unknown> | null,
    } as User
  }

  async updateProfile(
    userId: string,
    updates: Partial<TablesUpdate<"users">>
  ): Promise<void> {
    const supabase = this.supabase
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }
    const { error } = await supabase
      .from("users")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) throw error
  }

  async setAvailability(userId: string, isAvailable: boolean): Promise<void> {
    const supabase = this.supabase
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }
    const { error } = await supabase
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
    const supabase = this.supabase
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }
    const { error } = await supabase
      .from("users")
      .update({
        notification_token: token,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) throw error
  }
}

// Export service instance - will be created lazily when accessed in browser
// During build time, the instance is created but won't be used
export const userService = new UserService()

