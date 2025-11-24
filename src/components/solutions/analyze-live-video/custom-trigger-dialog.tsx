"use client"

import type { Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CustomTriggerFormState } from './player-types';

export interface CustomTriggerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: CustomTriggerFormState;
  onFormChange: Dispatch<SetStateAction<CustomTriggerFormState>>;
  onSubmit: () => void;
}

export default function CustomTriggerDialog({ isOpen, onOpenChange, form, onFormChange, onSubmit }: CustomTriggerDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="border-white/20 text-white rounded-3xl"
        style={{
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">Create custom trigger</DialogTitle>
          <DialogDescription className="text-white/70">
            Define a custom gesture or action to detect in the video stream.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <Label htmlFor="trigger-name" className="text-white/90 text-sm font-semibold">Trigger name</Label>
            <Input
              id="trigger-name"
              value={form.name}
              onChange={(e) => onFormChange(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Waving hand"
              className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/20 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="trigger-query" className="text-white/90 text-sm font-semibold">Detection query</Label>
            <Input
              id="trigger-query"
              value={form.query}
              onChange={(e) => onFormChange(prev => ({ ...prev, query: e.target.value }))}
              placeholder="e.g., is anyone waving? yes or no"
              className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/20 rounded-xl"
            />
            <p className="text-xs text-white/50 mt-2">The question to ask about each frame</p>
          </div>
          <div>
            <Label htmlFor="trigger-text" className="text-white/90 text-sm font-semibold">Trigger text</Label>
            <Input
              id="trigger-text"
              value={form.triggerText}
              onChange={(e) => onFormChange(prev => ({ ...prev, triggerText: e.target.value }))}
              placeholder="e.g., yes"
              className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/20 rounded-xl"
            />
            <p className="text-xs text-white/50 mt-2">Text to look for in the response (case-insensitive)</p>
          </div>
          <div>
            <Label htmlFor="notification-text" className="text-white/90 text-sm font-semibold">Notification text</Label>
            <Input
              id="notification-text"
              value={form.notificationText}
              onChange={(e) => onFormChange(prev => ({ ...prev, notificationText: e.target.value }))}
              placeholder="e.g., 👋 Wave Detected!"
              className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/20 rounded-xl"
            />
            <p className="text-xs text-white/50 mt-2">Message to display when the trigger is detected</p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 rounded-xl"
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} className="bg-white text-black hover:bg-white/90 rounded-xl">
            Create trigger
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

