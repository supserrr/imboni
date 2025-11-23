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
          user_type: userType,
        },
      },
    })

    if (error) throw error

    if (data.user) {
      const { error: profileError } = await this.supabase
        .from("users")
        .insert({
          id: data.user.id,
          type: userType,
          full_name: fullName,
        })

      if (profileError) throw profileError
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
    const redirectUrl = `${window.location.origin}/auth/callback`
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
}

export const authService = new AuthService()

