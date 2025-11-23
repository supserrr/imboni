"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface RatingScreenProps {
  onRate: (rating: number) => void
  onSkip: () => void
}

export function RatingScreen({ onRate, onSkip }: RatingScreenProps) {
  const [selectedRating, setSelectedRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)

  const handleSubmit = () => {
    if (selectedRating > 0) {
      onRate(selectedRating)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Rate this call</h2>
        <p className="text-muted-foreground">
          How would you rate your experience?
        </p>
      </div>

      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => setSelectedRating(rating)}
            onMouseEnter={() => setHoveredRating(rating)}
            onMouseLeave={() => setHoveredRating(0)}
            className="focus:outline-none transition-transform hover:scale-110"
            aria-label={`Rate ${rating} stars`}
          >
            <Star
              className={cn(
                "w-12 h-12 transition-colors",
                rating <= (hoveredRating || selectedRating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-gray-300 text-gray-300"
              )}
            />
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onSkip}
          className="min-w-[120px]"
        >
          Skip
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={selectedRating === 0}
          className="min-w-[120px]"
        >
          Submit
        </Button>
      </div>
    </div>
  )
}

