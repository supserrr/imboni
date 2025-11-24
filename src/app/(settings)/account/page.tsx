"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthProvider"
import { userService } from "@/lib/services/user"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import type { User } from "@/types/user"

export default function AccountSettingsPage() {
  const { user: authUser, signOut } = useAuth()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fullName, setFullName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [bio, setBio] = useState("")

  useEffect(() => {
    if (!authUser) {
      router.push("/login")
      return
    }

    const loadUser = async () => {
      try {
        const userData = await userService.getProfile(authUser.id)
        setUser(userData)
        setFullName(userData?.full_name || "")
        setPhoneNumber(userData?.phone_number || "")
        setBio(userData?.bio || "")
      } catch (error) {
        console.error("Failed to load user:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [authUser, router])

  const handleSave = async () => {
    if (!authUser) return

    try {
      await userService.updateProfile(authUser.id, {
        full_name: fullName,
        phone_number: phoneNumber,
        bio: bio,
      })
      toast.success("Your profile has been updated! Your changes are saved and ready to use.")
    } catch (error: any) {
      toast.error(error.message || "We couldn't update your profile right now. Please try again, and we're here to help if you need support.")
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 max-w-2xl">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Account Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user?.profile_picture_url || undefined} />
                <AvatarFallback>
                  {user?.full_name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline">Change Photo</Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <Button onClick={handleSave}>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={signOut}>
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

