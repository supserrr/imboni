"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function BlindHomeRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/dashboard/blind")
  }, [router])

  return null
}
