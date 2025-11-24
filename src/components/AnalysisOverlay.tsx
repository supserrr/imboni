"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import type { AnalysisResult } from "@/hooks/useMoondreamAnalysis"

interface AnalysisOverlayProps {
  result: AnalysisResult | null
  isAnalyzing: boolean
  error: Error | null
  showOverlay?: boolean
}

/**
 * Component for displaying current analysis results
 * Can be hidden for blind users (audio narration only)
 */
export function AnalysisOverlay({
  result,
  isAnalyzing,
  error,
  showOverlay = false,
}: AnalysisOverlayProps) {
  if (!showOverlay) {
    return null
  }

  return (
    <div className="absolute bottom-4 left-4 right-4 z-10 max-w-2xl">
      <Card className="bg-black/80 backdrop-blur-sm border-white/20 text-white">
        <CardContent className="p-4">
          {isAnalyzing && (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Analyzing scene...</span>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm">
              <p className="font-semibold">Error:</p>
              <p>{error.message}</p>
            </div>
          )}

          {result && !isAnalyzing && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                {result.prompt}
              </p>
              <p className="text-sm leading-relaxed">{result.answer}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

