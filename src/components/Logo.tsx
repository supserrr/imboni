"use client"

import Image from "next/image"

interface LogoProps {
  variant?: "full" | "icon"
  color?: "orange" | "black" | "white"
  className?: string
  width?: number
  height?: number
}

/**
 * Logo component that supports different color variants
 * @param variant - 'full' for full logo with text, 'icon' for icon only (default: 'icon')
 * @param color - 'orange' for orange logo, 'black' for black logo, 'white' for white logo (default: 'orange')
 * @param className - Additional CSS classes
 * @param width - Image width (default: auto based on variant)
 * @param height - Image height (default: auto based on variant)
 */
export function Logo({ variant = "icon", color = "orange", className = "", width, height }: LogoProps) {
  // Determine logo path based on variant and color
  let logoPath: string
  if (variant === "full") {
    if (color === "black") {
      logoPath = "/logos/imboni-logo-full-black.png"
    } else if (color === "white") {
      logoPath = "/logos/imboni-logo-full-white.png"
    } else {
      logoPath = "/logos/imboni-logo-full-orange.png"
    }
  } else {
    if (color === "black") {
      logoPath = "/logos/imboni-logo-black.png"
    } else if (color === "white") {
      logoPath = "/logos/imboni-logo-white.png"
    } else {
      logoPath = "/logos/imboni-logo-full-orange.png" // Default to full orange for icon variant
    }
  }

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

