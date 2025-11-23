"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { HelpRequest } from "@/types/help-request"
import { POLLING_INTERVAL } from "@/lib/constants"

export function useHelpRequest(requestId: string | null) {
  const [request, setRequest] = useState<HelpRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!requestId) {
      setIsLoading(false)
      return
    }

    const fetchRequest = async () => {
      const { data, error } = await supabase
        .from("help_requests")
        .select("*")
        .eq("id", requestId)
        .single()

      if (!error && data) {
        setRequest(data)
      }
      setIsLoading(false)
    }

    fetchRequest()

    const channel = supabase
      .channel(`help_request_${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "help_requests",
          filter: `id=eq.${requestId}`,
        },
        (payload) => {
          setRequest(payload.new as HelpRequest)
        }
      )
      .subscribe()

    const pollInterval = setInterval(fetchRequest, POLLING_INTERVAL)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(pollInterval)
    }
  }, [requestId, supabase])

  return { request, isLoading }
}

