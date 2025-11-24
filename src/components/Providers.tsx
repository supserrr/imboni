"use client"

import { AuthProvider } from "@/contexts/AuthProvider"
import { ThemeProvider } from "@/contexts/ThemeProvider"
import { Toaster } from "@/components/ui/sonner"
import "@/lib/i18n"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  )
}

