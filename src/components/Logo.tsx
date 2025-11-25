"use client"

import Image from "next/image"

interface LogoProps {
  variant?: "full" | "icon"
  className?: string
  width?: number
  height?: number
}

/**
 * Logo component that uses the orange brand logo
 * @param variant - 'full' for full logo with text, 'icon' for icon only (default: 'icon')
 * @param className - Additional CSS classes
 * @param width - Image width (default: auto based on variant)
 * @param height - Image height (default: auto based on variant)
 */
export function Logo({ variant = "icon", className = "", width, height }: LogoProps) {
  // Always use orange logo
  const logoPath = "/logos/imboni-logo-full-orange.png"

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

