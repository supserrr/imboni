import { createClient } from "@/lib/supabase/client"
import type { UserType } from "@/types/user"

export class AuthService {
  private supabase = createClient()

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
}

export const authService = new AuthService()

