import { createClient } from "@/lib/supabase/client"
import type { UserType } from "@/types/user"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

export class AuthService {
  private _supabase: SupabaseClient<Database> | null = null

  private get supabase() {
    if (!this._supabase) {
      // Only create client in browser environment
      if (typeof window === "undefined") {
        // During build/SSR, return null - methods will handle this gracefully
        return null as any
      }
      try {
        this._supabase = createClient()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        console.error("Failed to create Supabase client:", errorMessage)
        return null as any
      }
    }
    return this._supabase
  }

  async signUpWithEmail(
    email: string,
    password: string,
    fullName: string
  ) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          type: "blind",
        },
      },
    })

    if (error) {
      if (
        error.message?.includes("already registered") ||
        error.message?.includes("already exists") ||
        error.message?.includes("User already registered") ||
        error.status === 422
      ) {
        const customError = new Error("ACCOUNT_EXISTS")
        customError.name = "AccountExistsError"
        throw customError
      }
      throw error
    }

    if (data.user) {
      const { error: profileError } = await this.supabase
        .from("users")
        .upsert({
          id: data.user.id,
          type: "blind",
          full_name: fullName,
        }, {
          onConflict: "id"
        })

      if (profileError && !profileError.message.includes("duplicate key")) {
        throw profileError
      }
    }

    return data
  }

  async signInWithEmail(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  }

  async signInWithGoogle() {
    const redirectUrl = `${window.location.origin}/auth/callback`
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    })

    if (error) throw error
    return data
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut()
    if (error) throw error
  }

  async getSession() {
    const {
      data: { session },
      error,
    } = await this.supabase.auth.getSession()
    if (error) throw error
    return session
  }

  async getUser() {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser()
    if (error) throw error
    return user
  }

  async updateUserMetadata(userId: string, metadata: Record<string, unknown>) {
    const { error } = await this.supabase.auth.updateUser({
      data: metadata,
    })
    if (error) throw error
  }

  async handleOAuthCallback(url: string) {
    const urlObj = new URL(url)
    const code = urlObj.searchParams.get("code")
    if (!code) throw new Error("No code in callback URL")


    const { data, error } = await this.supabase.auth.exchangeCodeForSession(
      code
    )
    if (error) throw error

    if (data.user) {
      // Default to "blind" user type
        const { error: profileError } = await this.supabase
          .from("users")
          .upsert({
            id: data.user.id,
          type: "blind",
          full_name: data.user.user_metadata?.full_name || data.user.email || "User",
        }, {
          onConflict: "id"
          })

      if (profileError && !profileError.message.includes("duplicate key")) {
        throw profileError
      }
    }

    return data
  }

  async updateUserMetadataAfterOAuth(userId: string) {
    const { data: user } = await this.supabase.auth.getUser()
    if (!user.user) return

    const { error } = await this.supabase
      .from("users")
      .upsert({
        id: userId,
        type: "blind",
        full_name: user.user.user_metadata?.full_name || user.user.email,
      })

    if (error) throw error
  }

  async updateEmail(newEmail: string) {
    const { error } = await this.supabase.auth.updateUser({
      email: newEmail,
    })
    if (error) throw error
  }

  async updatePassword(newPassword: string) {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) throw error
  }

  async deleteAccount(userId: string) {
    // Delete user profile from users table
    const { error: deleteError } = await this.supabase
      .from("users")
      .delete()
      .eq("id", userId)

    if (deleteError) throw deleteError

    // Sign out the user
    await this.signOut()
  }
}

// Export service instance - will be created lazily when accessed in browser
// During build time, the instance is created but won't be used
export const authService = new AuthService()

