import { createClient } from "@/lib/supabase/client"
import type { UserType } from "@/types/user"

export class AuthService {
  private supabase = createClient()

  async signUpWithEmail(
    email: string,
    password: string,
    fullName: string,
    userType: UserType
  ) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          type: userType,
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
          type: userType,
          full_name: fullName,
        }, {
          onConflict: "id"
        })

      if (profileError && !profileError.message.includes("duplicate key")) {
        throw profileError
      }

      if (userType === "volunteer") {
        const { error: behaviorError } = await this.supabase
          .from("volunteer_behavior")
          .upsert({
            volunteer_id: data.user.id,
          }, {
            onConflict: "volunteer_id"
          })
        
        if (behaviorError && !behaviorError.message.includes("duplicate key")) {
          console.error("Volunteer behavior creation error:", behaviorError)
        }
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

  async signInWithGoogle(userType: UserType) {
    const nextPath = userType === "volunteer" ? "/dashboard/volunteer" : "/dashboard/blind"
    const redirectUrl = `${window.location.origin}/auth/callback?next=${nextPath}&user_type=${userType}`
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          user_type: userType,
        },
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
    const code = new URL(url).searchParams.get("code")
    if (!code) throw new Error("No code in callback URL")

    const { data, error } = await this.supabase.auth.exchangeCodeForSession(
      code
    )
    if (error) throw error

    if (data.user) {
      const userType = data.user.user_metadata?.user_type as UserType
      if (userType) {
        const { error: profileError } = await this.supabase
          .from("users")
          .upsert({
            id: data.user.id,
            type: userType,
            full_name: data.user.user_metadata?.full_name || data.user.email,
          })

        if (profileError) throw profileError
      }
    }

    return data
  }

  async updateUserMetadataAfterOAuth(userId: string, userType: UserType) {
    const { data: user } = await this.supabase.auth.getUser()
    if (!user.user) return

    const { error } = await this.supabase
      .from("users")
      .upsert({
        id: userId,
        type: userType,
        full_name: user.user.user_metadata?.full_name || user.user.email,
      })

    if (error) throw error
  }
}

export const authService = new AuthService()

