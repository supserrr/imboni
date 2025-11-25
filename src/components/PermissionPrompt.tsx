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
import { Camera, AlertCircle } from "@/components/ui/animated-icons"
import type { CameraPermissionStatus } from "@/hooks/useCameraPermissions"

interface PermissionPromptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRequestPermission: () => Promise<void>
  permissionStatus: CameraPermissionStatus
}

/**
 * Dialog component for requesting camera permissions
 * Shows different messages based on permission status
 */
export function PermissionPrompt({
  open,
  onOpenChange,
  onRequestPermission,
  permissionStatus,
}: PermissionPromptProps) {
  const isDenied = permissionStatus === "denied"
  const isNotSupported = permissionStatus === "not-supported"

  const handleRequest = async () => {
    await onRequestPermission()
    // Don't close immediately - let the user see the result
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mb-4 flex items-center justify-center">
            {isDenied || isNotSupported ? (
              <AlertCircle className="h-12 w-12 text-destructive" />
            ) : (
              <Camera className="h-12 w-12 text-primary" />
            )}
          </div>
          <DialogTitle>
            {isDenied
              ? "Camera Permission Denied"
              : isNotSupported
              ? "Camera Not Available"
              : "Camera Permission Required"}
          </DialogTitle>
          <div className="pt-4">
            {isDenied ? (
              <div className="space-y-2">
                <p>
                  Camera access has been denied. To use Imboni, you need to grant camera permissions.
                </p>
                <p className="font-medium">To enable camera access:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Click the camera icon in your browser&apos;s address bar</li>
                  <li>Select &quot;Allow&quot; for camera access</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            ) : isNotSupported ? (
              <p>
                Your device or browser doesn&apos;t support camera access. Please use a device with a camera and a modern browser.
              </p>
            ) : (
              <div className="space-y-2">
                <p>
                  Imboni needs access to your camera to analyze your surroundings and provide real-time descriptions.
                </p>
                <p className="text-sm text-muted-foreground">
                  Your camera feed is processed locally and never stored. We respect your privacy.
                </p>
              </div>
            )}
          </div>
        </DialogHeader>
        <DialogFooter>
          {isDenied || isNotSupported ? (
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleRequest}>
                <Camera className="mr-2 h-4 w-4" />
                Allow Camera Access
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

