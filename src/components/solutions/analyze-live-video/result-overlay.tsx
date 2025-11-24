"use client"

import type { VideoDisplayInfo, ResultHistoryEntry } from './player-types';

export interface ResultOverlayProps {
  isFullscreen: boolean;
  videoDisplayInfo: VideoDisplayInfo;
  resultHistory: ResultHistoryEntry[];
}

export default function ResultOverlay({ isFullscreen, videoDisplayInfo, resultHistory }: ResultOverlayProps) {
  const baseBottom = (videoDisplayInfo.isLargeView ? 32 : 12) + (videoDisplayInfo.isLargeView ? 16 : 14) + (videoDisplayInfo.isLargeView ? 48 : 24) + (videoDisplayInfo.isLargeView ? 31 : 14) + (videoDisplayInfo.isLargeView ? 48 : 32);
  const fullscreenBottom = videoDisplayInfo.containerHeight - (videoDisplayInfo.offsetY + videoDisplayInfo.displayHeight) + baseBottom;

  return (
    <div
      className="absolute"
      style={{
        left: isFullscreen ? `${videoDisplayInfo.offsetX + (videoDisplayInfo.isLargeView ? 64 : 24)}px` : (videoDisplayInfo.isLargeView ? '32px' : '12px'),
        right: isFullscreen ? `calc(100% - ${videoDisplayInfo.offsetX + videoDisplayInfo.displayWidth - (videoDisplayInfo.isLargeView ? 64 : 24)}px)` : (videoDisplayInfo.isLargeView ? '32px' : '12px'),
        bottom: isFullscreen ? `${fullscreenBottom}px` : `${baseBottom}px`,
        maxWidth: videoDisplayInfo.isLargeView ? '800px' : undefined,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: videoDisplayInfo.isLargeView ? '16px' : '8px',
        pointerEvents: 'none',
      }}
    >
      {resultHistory.map((result, index) => {
        const opacityLevels = [1, 0.5, 0.25];
        return (
          <div
            key={result.id}
            className={`text-white shadow-lg leading-snug ${videoDisplayInfo.isLargeView ? 'text-2xl' : 'text-xs'}`}
            style={{
              padding: videoDisplayInfo.isLargeView ? '24px 32px' : '12px 16px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              background: result.isNotification ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              opacity: opacityLevels[index] || 0.25,
              animation: index === 0 ? 'slideUp 0.3s ease-out' : 'none',
              transition: 'opacity 0.3s ease-out',
              borderRadius: videoDisplayInfo.isLargeView ? '24px' : '16px',
            }}
          >
            {result.text}
          </div>
        );
      })}
    </div>
  );
}

