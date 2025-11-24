"use client"

import { useTheme } from "@/contexts/ThemeProvider"
import Image from "next/image"
import { useEffect, useState } from "react"

interface LogoProps {
  variant?: "full" | "icon"
  className?: string
  width?: number
  height?: number
}

/**
 * Logo component that auto-detects theme and uses appropriate variant
 * @param variant - 'full' for full logo with text, 'icon' for icon only (default: 'icon')
 * @param className - Additional CSS classes
 * @param width - Image width (default: auto based on variant)
 * @param height - Image height (default: auto based on variant)
 */
export function Logo({ variant = "icon", className = "", width, height }: LogoProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(false)

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
    // Check if dark theme is active
    const checkDarkTheme = () => {
      if (theme === "system") {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
        setIsDark(mediaQuery.matches)
      } else {
        setIsDark(theme === "dark")
      }
    }
    checkDarkTheme()
    
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handleChange = () => setIsDark(mediaQuery.matches)
      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }
  }, [theme])

  // Select logo based on theme and variant
  const logoPath = mounted
    ? isDark
      ? variant === "full"
        ? "/logos/imboni-logo-full-white.png"
        : "/logos/imboni-logo-white.png"
      : variant === "full"
      ? "/logos/imboni-logo-full-black.png"
      : "/logos/imboni-logo-black.png"
    : "/logos/imboni-logo-black.png" // Default for SSR

  // Default dimensions based on variant
  const defaultWidth = variant === "full" ? 200 : 40
  const defaultHeight = variant === "full" ? 60 : 40

  return (
    <Image
      src={logoPath}
      alt="Imboni Logo"
      width={width || defaultWidth}
      height={height || defaultHeight}
      className={className}
      priority
    />
  )
}

