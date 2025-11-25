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

export type PermissionType = "camera" | "microphone"

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
              ? `${isCamera ? "Camera" : "Microphone"} Permission Denied`
              : isNotSupported
              ? `${isCamera ? "Camera" : "Microphone"} Not Available`
              : `${isCamera ? "Camera" : "Microphone"} Permission Required`}
          </DialogTitle>
          <div className="pt-4">
            {isDenied ? (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed">
                  {isCamera 
                    ? "Camera access has been denied. To use Imboni, you need to grant camera permission."
                    : "Microphone access has been denied. To use Imboni, you need to grant microphone permission."}
                </p>
                <div className="space-y-2">
                  <p className="font-medium text-sm">To enable {isCamera ? "camera" : "microphone"} access:</p>
                  <ol className="list-decimal list-outside space-y-2 text-sm leading-relaxed pl-5">
                    <li className="pl-2">Click the {isCamera ? "camera" : "microphone"} icon in your browser&apos;s address bar</li>
                    <li className="pl-2">Select &quot;Allow&quot; for {isCamera ? "camera" : "microphone"} access</li>
                    <li className="pl-2">Refresh this page</li>
                  </ol>
                </div>
              </div>
            ) : isNotSupported ? (
              <p className="text-sm leading-relaxed">
                Your device or browser doesn&apos;t support {isCamera ? "camera" : "microphone"} access. Please use a device with a {isCamera ? "camera" : "microphone"} and a modern browser.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed">
                  {isCamera
                    ? "Imboni needs access to your camera to analyze your surroundings and provide real-time descriptions."
                    : "Imboni needs access to your microphone to enable voice interaction and speech recognition."}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isCamera
                    ? "Your camera feed is processed locally and never stored. We respect your privacy."
                    : "Your audio is processed locally and never stored. We respect your privacy."}
                </p>
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
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    <span className="whitespace-nowrap">Allow Microphone</span>
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

