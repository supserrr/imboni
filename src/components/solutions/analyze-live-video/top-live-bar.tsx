"use client"

import { Github, Maximize2, X } from '@/components/ui/animated-icons';
import type { CSSProperties } from 'react';

interface TopLiveBarProps {
  isStreaming: boolean;
  isFullscreen: boolean;
  videoDisplayInfo: {
    isLargeView: boolean;
  };
  onEnterFullscreen: () => void;
  onExitFullscreen: () => void;
}

export function TopLiveBar({
  isStreaming,
  isFullscreen,
  videoDisplayInfo,
  onEnterFullscreen,
  onExitFullscreen,
}: TopLiveBarProps) {
  const { isLargeView } = videoDisplayInfo;
  const pillClasses = 'flex items-center gap-2 text-white font-semibold shadow-lg hover:scale-105 transition-transform';
  const pillStyle = (overrides: CSSProperties = {}): CSSProperties => ({
    padding: isLargeView ? '12px 24px' : '6px 12px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    background: 'rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '9999px',
    fontSize: isLargeView ? '14px' : '11px',
    opacity: 0.9,
    ...overrides,
  });
  const pillIconClass = isLargeView ? 'w-4 h-4' : 'w-3 h-3';
  const offset = videoDisplayInfo.isLargeView ? 16 : 8;
  return (
    <div
      id="top-live-bar"
      className="absolute z-20"
      style={{
        top: offset,
        left: offset,
        right: offset
      }}
    >
      <div className="flex justify-between">
        <div
          className="flex items-center opacity-90"
          style={{
            top: isLargeView ? '32px' : '12px',
            left: isLargeView ? '32px' : '12px',
            gap: isLargeView ? '16px' : '8px',
          }}
        >
          <div
            style={{
              width: isLargeView ? '48px' : '32px',
              height: isLargeView ? '48px' : '32px',
            }}
          >
            <img src="/md_logo.svg" alt="Imboni" width={48} height={48} className="w-full h-full" />
          </div>
          <span
            className={`text-white font-semibold tracking-tight hidden sm:block ${isLargeView ? 'text-2xl' : 'text-base'}`}
            style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)' }}
          >
            Imboni
          </span>
          {isStreaming && (
            <div className="flex items-center bg-red-500 rounded-md px-2 py-1" style={{ gap: '4px', marginLeft: '4px' }}>
              <div className="bg-white rounded-full animate-pulse" style={{ width: '6px', height: '6px' }} />
              <span className="text-white font-bold uppercase tracking-wide text-xs">Live</span>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <a
            href="https://github.com/m87-labs/Analyze-Live-Video-Solution"
            target="_blank"
            rel="noopener noreferrer"
            className={pillClasses}
            style={pillStyle()}
          >
            <Github className={pillIconClass} />
            <span>GitHub Source</span>
          </a>

          {!isFullscreen && (
            <a
              id="make-fullscreen"
              href="#"
              onClick={event => {
                event.preventDefault();
                onEnterFullscreen();
              }}
              className={pillClasses}
              style={pillStyle()}
            >

              <Maximize2 className={pillIconClass} />
              Fullscreen
            </a>
          )}

          {isFullscreen && (
            <button
              type="button"
              onClick={onExitFullscreen}
              className={pillClasses}
              style={pillStyle({
                padding: isLargeView ? '12px 18px' : '8px 12px',
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(12px) saturate(180%)',
                WebkitBackdropFilter: 'blur(12px) saturate(180%)',
              })}
              aria-label="Exit fullscreen"
            >
              <X className={pillIconClass} />
              <span className="hidden sm:inline">Close</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

