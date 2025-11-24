"use client"

import { Square } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Trigger, VideoDisplayInfo } from './player-types';

export interface PromptControlsOverlayProps {
  query1: string;
  setQuery1: (value: string) => void;
  selectedTriggerId: string;
  onTriggerChange: (value: string) => void;
  predefinedTriggers: Trigger[];
  customTriggers: Trigger[];
  videoDisplayInfo: VideoDisplayInfo;
  onStopStreaming: () => void;
  isStreaming: boolean;
}

export default function PromptControlsOverlay({
  query1,
  setQuery1,
  selectedTriggerId,
  onTriggerChange,
  predefinedTriggers,
  customTriggers,
  videoDisplayInfo,
  onStopStreaming,
  isStreaming,
}: PromptControlsOverlayProps) {
  const offset = videoDisplayInfo.isLargeView ? 16 : 8;
  return (
    <div
      className="absolute z-20 flex gap-3 items-end"
      style={{
        bottom: offset,
        left: offset,
        right: offset,
        pointerEvents: 'auto',
      }}
    >
      <div className="flex-1 min-w-0">
        <div
          className={`text-white uppercase tracking-wider mb-1 font-semibold ${videoDisplayInfo.isLargeView ? 'text-xs' : ''}`}
          style={{
            fontSize: videoDisplayInfo.isLargeView ? undefined : '10px',
            paddingLeft: videoDisplayInfo.isLargeView ? '32px' : '16px',
            opacity: 0.5,
          }}
        >
          Prompt
        </div>
        <div className="relative">
          <input
            type="text"
            value={query1}
            onChange={(e) => setQuery1(e.target.value)}
            className={`w-full text-white shadow-lg leading-snug outline-none placeholder:text-white placeholder:opacity-50 ${videoDisplayInfo.isLargeView ? 'text-2xl' : 'text-xs'}`}
            style={{
              padding: videoDisplayInfo.isLargeView ? '24px 32px' : '12px 16px',
              paddingRight: videoDisplayInfo.isLargeView ? '88px' : '44px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              background: 'rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderRadius: '9999px',
            }}
            placeholder="Enter query..."
          />
          {isStreaming && (
            <button
              onClick={onStopStreaming}
              className="absolute flex items-center justify-center bg-white hover:bg-white/90 transition-colors shadow-lg"
              style={{
                top: '50%',
                right: videoDisplayInfo.isLargeView ? '16px' : '8px',
                transform: 'translateY(-50%)',
                width: videoDisplayInfo.isLargeView ? '48px' : '28px',
                height: videoDisplayInfo.isLargeView ? '48px' : '28px',
                borderRadius: '50%',
              }}
              aria-label="Stop video"
            >
              <Square
                className="text-black fill-black"
                style={{
                  width: videoDisplayInfo.isLargeView ? '20px' : '12px',
                  height: videoDisplayInfo.isLargeView ? '20px' : '12px',
                }}
              />
            </button>
          )}
        </div>
      </div>

      <div
        className="flex-shrink-0 min-w-0"
        style={{ flexBasis: videoDisplayInfo.isLargeView ? '400px' : '110px', maxWidth: videoDisplayInfo.isLargeView ? '400px' : '110px' }}
      >
        <div
          className={`text-white uppercase tracking-wider mb-1 font-semibold ${videoDisplayInfo.isLargeView ? 'text-xs' : ''}`}
          style={{
            fontSize: videoDisplayInfo.isLargeView ? undefined : '10px',
            paddingLeft: videoDisplayInfo.isLargeView ? '32px' : '16px',
            opacity: 0.5,
          }}
        >
          Trigger
        </div>
        <Select value={selectedTriggerId} onValueChange={onTriggerChange}>
          <SelectTrigger
            className={`w-full text-white shadow-lg leading-snug border-none outline-none truncate white-caret ${videoDisplayInfo.isLargeView ? 'text-2xl' : 'text-xs'}`}
            style={{
              padding: videoDisplayInfo.isLargeView ? '24px 32px' : '12px 16px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              background: 'rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderRadius: '9999px',
              height: 'auto',
            }}
          >
            <SelectValue placeholder="Select trigger" className="truncate" />
          </SelectTrigger>
          <SelectContent
            className="text-white shadow-2xl"
            align="end"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.3)',
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderRadius: '24px',
              padding: '8px',
            }}
          >
            {predefinedTriggers.map(trigger => (
              <SelectItem
                key={trigger.id}
                value={trigger.id}
                className="text-white"
              >
                {trigger.name}
              </SelectItem>
            ))}
            {customTriggers.map(trigger => (
              <SelectItem
                key={trigger.id}
                value={trigger.id}
                className="text-white"
              >
                {trigger.name}
              </SelectItem>
            ))}
            <SelectItem value="custom" className="text-white">
              + Create custom trigger
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

