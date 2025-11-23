"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function SignupRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = searchParams.get("type") || "blind"
  
  useEffect(() => {
    router.replace(`/signup/${type}`)
  }, [router, type])

  return null
}
