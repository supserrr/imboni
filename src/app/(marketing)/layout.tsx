import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Imboni - AI Vision Assistant",
  description: "Real-time camera-based AI assistant for blind and low vision users powered by Moondream AI",
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

