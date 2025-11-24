"use client"

import { Button } from "@/components/ui/button"
import { Settings, Play, Pause, RotateCcw, Camera } from "lucide-react"
import { QueryInput } from "./QueryInput"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SettingsDialog } from "./SettingsDialog"

interface ControlPanelProps {
  isActive: boolean
  isAnalyzing: boolean
  isPaused: boolean
  onStart: () => void
  onStop: () => void
  onPause: () => void
  onResume: () => void
  onQuery: (query: string) => void
  onSwitchCamera?: () => void
  showQueryInput?: boolean
  disabled?: boolean
}

/**
 * Main control panel for camera and analysis controls
 */
export function ControlPanel({
  isActive,
  isAnalyzing,
  isPaused,
  onStart,
  onStop,
  onPause,
  onResume,
  onQuery,
  onSwitchCamera,
  showQueryInput = true,
  disabled = false,
}: ControlPanelProps) {
  return (
    <div className="space-y-4">
      {showQueryInput && (
        <QueryInput onQuery={onQuery} isAnalyzing={isAnalyzing} disabled={disabled} />
      )}

      <div className="flex items-center justify-center gap-2">
        {!isActive ? (
          <Button
            onClick={onStart}
            disabled={disabled}
            size="lg"
            className="min-w-[120px] min-h-[44px]"
            aria-label="Start camera and begin analysis"
          >
            <Play className="w-5 h-5 mr-2" />
            Start
          </Button>
        ) : (
          <>
            {isPaused ? (
              <Button
                onClick={onResume}
                disabled={disabled}
                size="lg"
                variant="default"
                className="min-w-[120px]"
                aria-label="Resume analysis"
              >
                <Play className="w-5 h-5 mr-2" />
                Resume
              </Button>
            ) : (
              <Button
                onClick={onPause}
                disabled={disabled || isAnalyzing}
                size="lg"
                variant="default"
                className="min-w-[120px]"
                aria-label="Pause analysis"
              >
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
            )}

            <Button
              onClick={onStop}
              disabled={disabled}
              size="lg"
              variant="destructive"
              className="min-w-[120px] min-h-[44px]"
              aria-label="Stop camera and analysis"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Stop
            </Button>
          </>
        )}

        {onSwitchCamera && (
          <Button
            onClick={onSwitchCamera}
            disabled={disabled || !isActive}
            size="lg"
            variant="outline"
            aria-label="Switch camera"
          >
            <Camera className="w-5 h-5" />
          </Button>
        )}

        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="lg"
              variant="outline"
              disabled={disabled}
              aria-label="Open settings"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Settings</SheetTitle>
              <SheetDescription>
                Configure narration and analysis preferences
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <SettingsDialog />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

