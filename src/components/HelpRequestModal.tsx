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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface HelpRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userName: string | null
  userAvatar?: string | null
  onAccept: () => void
  onDecline: () => void
  timeRemaining?: number
}

export function HelpRequestModal({
  open,
  onOpenChange,
  userName,
  userAvatar,
  onAccept,
  onDecline,
  timeRemaining,
}: HelpRequestModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Help Request</DialogTitle>
          <DialogDescription>
            A user needs your assistance. Would you like to help?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={userAvatar || undefined} />
            <AvatarFallback>
              {userName?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="font-semibold">{userName || "User"}</p>
            <p className="text-sm text-muted-foreground">
              Needs visual assistance
            </p>
          </div>
          {timeRemaining !== undefined && timeRemaining > 0 && (
            <p className="text-sm text-muted-foreground">
              {Math.ceil(timeRemaining / 1000)} seconds remaining
            </p>
          )}
        </div>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={onDecline}>
            Decline
          </Button>
          <Button onClick={onAccept}>Accept</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

