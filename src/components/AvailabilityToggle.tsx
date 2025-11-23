"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface AvailabilityToggleProps {
  available: boolean
  onToggle: (available: boolean) => void
  disabled?: boolean
}

export function AvailabilityToggle({
  available,
  onToggle,
  disabled = false,
}: AvailabilityToggleProps) {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="availability"
        checked={available}
        onCheckedChange={onToggle}
        disabled={disabled}
      />
      <Label htmlFor="availability" className="cursor-pointer">
        {available ? "Available" : "Unavailable"}
      </Label>
    </div>
  )
}

