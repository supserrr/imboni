"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function VolunteerHomeRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/dashboard/volunteer")
  }, [router])

  return null
}
