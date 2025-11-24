"use client"

import { useAuth } from "@/contexts/AuthProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, User, Bell, Globe, Palette, Volume2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const settingsSections = [
    {
      title: "Account",
      description: "Manage your account settings",
      icon: User,
      href: "/dashboard/settings/account",
    },
    {
      title: "Notifications",
      description: "Configure notification preferences",
      icon: Bell,
      href: "/dashboard/settings/notifications",
    },
    {
      title: "Appearance",
      description: "Customize the app appearance",
      icon: Palette,
      href: "/dashboard/settings/appearance",
    },
    {
      title: "Languages",
      description: "Change language settings",
      icon: Globe,
      href: "/dashboard/settings/languages",
    },
    {
      title: "Narration",
      description: "Configure narration and analysis preferences",
      icon: Volume2,
      href: "/dashboard/settings/narration",
    },
  ]

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and preferences
        </p>
      </div>

      <div className="space-y-6">
        {settingsSections.map((section) => {
          const Icon = section.icon
          return (
            <Card key={section.href} className="hover:bg-muted/50 transition-colors">
              <Link href={section.href}>
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-none bg-primary/10 border border-border">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle>{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </CardHeader>
              </Link>
            </Card>
          )
        })}

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              {user?.email || "Not signed in"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSignOut}
              variant="destructive"
              className="w-full sm:w-auto"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

