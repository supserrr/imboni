"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Camera, Mic, AlertCircle } from "@/components/ui/animated-icons"
import type { CameraPermissionStatus } from "@/hooks/useCameraPermissions"

export type PermissionType = "camera" | "microphone" | "speech-recognition"

interface PermissionPromptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRequestPermission: () => Promise<void>
  permissionStatus: CameraPermissionStatus
  permissionType: PermissionType
}

/**
 * Dialog component for requesting camera or microphone permissions
 * Shows different messages based on permission status and type
 */
export function PermissionPrompt({
  open,
  onOpenChange,
  onRequestPermission,
  permissionStatus,
  permissionType,
}: PermissionPromptProps) {
  const isDenied = permissionStatus === "denied"
  const isNotSupported = permissionStatus === "not-supported"
  const isCamera = permissionType === "camera"
  const isMicrophone = permissionType === "microphone"
  const isSpeechRecognition = permissionType === "speech-recognition"

  const handleRequest = async () => {
    await onRequestPermission()
    // Close after permission is requested
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="mb-4 flex items-center justify-center gap-2">
            {isDenied || isNotSupported ? (
              <AlertCircle className="h-12 w-12 text-destructive" />
            ) : isCamera ? (
              <Camera className="h-12 w-12 text-primary" />
            ) : (
              <Mic className="h-12 w-12 text-primary" />
            )}
          </div>
          <DialogTitle className="text-center text-lg leading-tight">
            {isDenied
              ? `${isCamera ? "Camera" : isMicrophone ? "Microphone" : "Speech Recognition"} Permission Denied`
              : isNotSupported
              ? `${isCamera ? "Camera" : isMicrophone ? "Microphone" : "Speech Recognition"} Not Available`
              : `${isCamera ? "Camera" : isMicrophone ? "Microphone" : "Speech Recognition"} Permission Required`}
          </DialogTitle>
          <div className="pt-4">
            {isDenied ? (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed">
                  {isCamera 
                    ? "Camera access has been denied. To use Imboni, you need to grant camera permission."
                    : isMicrophone
                    ? "Microphone access has been denied. To use Imboni, you need to grant microphone permission."
                    : "Speech recognition access has been denied. To use voice mode, you need to grant speech recognition permission."}
                </p>
                <div className="space-y-2">
                  <p className="font-medium text-sm">To enable {isCamera ? "camera" : isMicrophone ? "microphone" : "speech recognition"} access:</p>
                  {isSpeechRecognition ? (
                    <ol className="list-decimal list-outside space-y-2 text-sm leading-relaxed pl-5">
                      <li className="pl-2">On iOS/Safari, tap &quot;Allow&quot; when prompted for speech recognition</li>
                      <li className="pl-2">If you don&apos;t see a prompt, go to Settings &gt; Safari &gt; Microphone and ensure it&apos;s enabled</li>
                      <li className="pl-2">Refresh this page and try again</li>
                    </ol>
                  ) : (
                    <ol className="list-decimal list-outside space-y-2 text-sm leading-relaxed pl-5">
                      <li className="pl-2">Click the {isCamera ? "camera" : "microphone"} icon in your browser&apos;s address bar</li>
                      <li className="pl-2">Select &quot;Allow&quot; for {isCamera ? "camera" : "microphone"} access</li>
                      <li className="pl-2">Refresh this page</li>
                    </ol>
                  )}
                </div>
              </div>
            ) : isNotSupported ? (
              <p className="text-sm leading-relaxed">
                Your device or browser doesn&apos;t support {isCamera ? "camera" : isMicrophone ? "microphone" : "speech recognition"} access. Please use a device with {isCamera ? "a camera" : isMicrophone ? "a microphone" : "speech recognition support"} and a modern browser.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed">
                  {isCamera
                    ? "Imboni needs access to your camera to analyze your surroundings and provide real-time descriptions."
                    : isMicrophone
                    ? "Imboni needs access to your microphone to enable voice interaction and speech recognition."
                    : "Imboni needs access to speech recognition to enable voice commands. On iOS and Safari, this requires a separate permission."}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isCamera
                    ? "Your camera feed is processed locally and never stored. We respect your privacy."
                    : isMicrophone
                    ? "Your audio is processed locally and never stored. We respect your privacy."
                    : "Your speech is processed locally and never stored. We respect your privacy."}
                </p>
                {isSpeechRecognition && (
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    Note: On iOS and Safari, you may see a separate permission prompt when you start voice mode.
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          {isDenied || isNotSupported ? (
            <Button onClick={handleCancel} className="w-full sm:w-auto">
              Close
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRequest}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {isCamera ? (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    <span className="whitespace-nowrap">Allow Camera</span>
                  </>
                ) : isMicrophone ? (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    <span className="whitespace-nowrap">Allow Microphone</span>
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    <span className="whitespace-nowrap">Allow Speech Recognition</span>
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

