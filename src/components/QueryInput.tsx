"use client"

import { useState, KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Mic } from "@/components/ui/animated-icons"

interface QueryInputProps {
  onQuery: (query: string) => void
  isAnalyzing: boolean
  disabled?: boolean
}

const PRESET_QUERIES = [
  "What's in front of me?",
  "Read any text you see",
  "Describe the colors",
  "Are there any people?",
  "What objects do you see?",
]

/**
 * Component for inputting custom queries
 */
export function QueryInput({ onQuery, isAnalyzing, disabled = false }: QueryInputProps) {
  const [query, setQuery] = useState("")

  const handleSubmit = () => {
    if (query.trim() && !isAnalyzing && !disabled) {
      onQuery(query.trim())
      setQuery("")
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handlePresetClick = (preset: string) => {
    if (!isAnalyzing && !disabled) {
      onQuery(preset)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Ask anything about what you see..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isAnalyzing || disabled}
          className="flex-1 min-h-[44px]"
          aria-label="Query input - Ask questions about what the camera sees"
          aria-describedby="query-help"
        />
        <span id="query-help" className="sr-only">
          Press Enter to submit your question, or click a preset question below
        </span>
        <Button
          onClick={handleSubmit}
          disabled={!query.trim() || isAnalyzing || disabled}
          size="icon"
          aria-label="Submit query"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESET_QUERIES.map((preset) => (
          <Button
            key={preset}
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(preset)}
            disabled={isAnalyzing || disabled}
            className="text-xs"
          >
            {preset}
          </Button>
        ))}
      </div>
    </div>
  )
}

