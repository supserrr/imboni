"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { HelpRequest } from "@/types/help-request"
import { POLLING_INTERVAL } from "@/lib/constants"

export function useVolunteerRequests(volunteerId: string | null) {
  const [requests, setRequests] = useState<HelpRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!volunteerId) {
      setIsLoading(false)
      return
    }

    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from("help_requests")
        .select("*")
        .eq("assigned_volunteer", volunteerId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (!error && data) {
        setRequests(data)
      }
      setIsLoading(false)
    }

    fetchRequests()

    const channel = supabase
      .channel(`volunteer_${volunteerId}_requests`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "help_requests",
          filter: `assigned_volunteer=eq.${volunteerId}`,
        },
        () => {
          fetchRequests()
        }
      )
      .subscribe()

    const pollInterval = setInterval(fetchRequests, POLLING_INTERVAL)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(pollInterval)
    }
  }, [volunteerId, supabase])

  return { requests, isLoading }
}

