"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthProvider"
import { userService } from "@/lib/services/user"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Languages, Globe, CheckCircle2 } from "lucide-react"
import type { User } from "@/types/user"
import { useTranslation } from "react-i18next"

interface LanguageOption {
  code: string
  name: string
  nativeName: string
  flag: string
}

const languages: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
]

export default function LanguagesSettingsPage() {
  const { user: authUser } = useAuth()
  const router = useRouter()
  const { i18n } = useTranslation()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!authUser) {
      router.push("/login")
      return
    }

    const loadUser = async () => {
      try {
        const userData = await userService.getProfile(authUser.id)
        setUser(userData)
        const savedLanguage = userData?.preferred_language || i18n.language || "en"
        setSelectedLanguage(savedLanguage)
      } catch (error) {
        console.error("Failed to load user:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [authUser, router, i18n])

  const handleLanguageChange = async (languageCode: string) => {
    if (!authUser) return

    setSelectedLanguage(languageCode)
    setIsSaving(true)

    try {
      await userService.updateProfile(authUser.id, {
        preferred_language: languageCode,
      })

      // Update i18n language
      await i18n.changeLanguage(languageCode)

      setUser(prev => prev ? { ...prev, preferred_language: languageCode } : null)
      toast.success("Language preference updated successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to update language preference. Please try again.")
      // Revert selection on error
      const previousLanguage = user?.preferred_language || i18n.language || "en"
      setSelectedLanguage(previousLanguage)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 max-w-2xl">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  const currentLanguage = languages.find(lang => lang.code === selectedLanguage) || languages[0]

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Languages className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Languages</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Primary Language
            </CardTitle>
            <CardDescription>
              Choose your preferred language for the interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="primaryLanguage">Select Language</Label>
              <Select
                value={selectedLanguage}
                onValueChange={handleLanguageChange}
                disabled={isSaving}
              >
                <SelectTrigger id="primaryLanguage" className="h-auto min-h-[3.5rem] py-3 w-full">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {currentLanguage ? (
                      <>
                        <span className="text-xl flex-shrink-0">{currentLanguage.flag}</span>
                        <div className="flex flex-col items-start min-w-0 flex-1">
                          <span className="font-medium">{currentLanguage.name}</span>
                          <span className="text-xs text-muted-foreground">{currentLanguage.nativeName}</span>
                        </div>
                      </>
                    ) : (
                      <SelectValue placeholder="Select language" />
                    )}
                  </div>
                </SelectTrigger>
                <SelectContent className="min-w-[var(--radix-select-trigger-width)] w-[400px]">
                  {languages.map((language) => (
                    <SelectItem key={language.code} value={language.code}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{language.flag}</span>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{language.name}</span>
                          <span className="text-xs text-muted-foreground">{language.nativeName}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Language Information</CardTitle>
            <CardDescription>
              About language preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p>Your language preference is saved and will be used across the app</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p>Some features may not be available in all languages</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p>You can change your language preference at any time</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
