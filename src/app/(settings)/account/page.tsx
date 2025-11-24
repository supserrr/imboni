"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthProvider"
import { userService } from "@/lib/services/user"
import { authService } from "@/lib/services/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import type { User } from "@/types/user"

export default function AccountSettingsPage() {
  const { user: authUser, signOut } = useAuth()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fullName, setFullName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [isChangingEmail, setIsChangingEmail] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
      })
      toast.success("Your profile has been updated! Your changes are saved and ready to use.")
    } catch (error: any) {
      toast.error(error.message || "We couldn't update your profile right now. Please try again, and we're here to help if you need support.")
    }
  }

  const handleChangeEmail = async () => {
    if (!authUser || !newEmail) {
      toast.error("Please enter a new email address")
      return
    }

    if (newEmail === authUser.email) {
      toast.error("New email must be different from your current email")
      return
    }

    try {
      await authService.updateEmail(newEmail)
      toast.success("Email update request sent! Please check your new email for a confirmation link.")
      setNewEmail("")
      setIsChangingEmail(false)
    } catch (error: any) {
      toast.error(error.message || "We couldn't update your email right now. Please try again.")
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return
    }

    try {
      await authService.updatePassword(newPassword)
      toast.success("Your password has been updated successfully!")
      setNewPassword("")
      setConfirmPassword("")
      setIsChangingPassword(false)
    } catch (error: any) {
      toast.error(error.message || "We couldn't update your password right now. Please try again.")
    }
  }

  const handleDeleteAccount = async () => {
    if (!authUser) return

    setIsDeleting(true)
    try {
      await authService.deleteAccount(authUser.id)
      toast.success("Your account has been deleted successfully.")
      router.push("/login")
    } catch (error: any) {
      toast.error(error.message || "We couldn't delete your account right now. Please try again.")
      setIsDeleting(false)
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
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={authUser?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>

            <Button onClick={handleSave}>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Email</CardTitle>
            <CardDescription>Update your email address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isChangingEmail ? (
              <Button variant="outline" onClick={() => setIsChangingEmail(true)}>
                Change Email
              </Button>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newEmail">New Email</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email address"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleChangeEmail}>Update Email</Button>
                  <Button variant="outline" onClick={() => {
                    setIsChangingEmail(false)
                    setNewEmail("")
                  }}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isChangingPassword ? (
              <Button variant="outline" onClick={() => setIsChangingPassword(true)}>
                Change Password
              </Button>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleChangePassword}>Update Password</Button>
                  <Button variant="outline" onClick={() => {
                    setIsChangingPassword(false)
                    setNewPassword("")
                    setConfirmPassword("")
                  }}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </Button>
          </CardContent>
        </Card>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Account</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently removed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

