import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Imboni - AI Vision Assistant",
  description: "An AI assistant designed to help blind and low vision users understand their surroundings with real-time visual descriptions",
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

