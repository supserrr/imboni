"use client"

import type { RefObject } from 'react';
import { TopLiveBar } from './top-live-bar';
import StartOverlay from './start-overlay';
import PromptControlsOverlay from './prompt-controls-overlay';
import ResultOverlay from './result-overlay';
import CustomTriggerDialog from './custom-trigger-dialog';
import type { ResultHistoryEntry } from './player-types';
import type { VideoSessionActions, VideoSessionState } from './hooks/useVideoSession';
import type { TriggerManagerActions, TriggerManagerState } from './hooks/useTriggerManager';

export interface PlayerSurfaceProps {
  video: VideoSessionState;
  videoActions: VideoSessionActions;
  triggers: TriggerManagerState;
  triggerActions: TriggerManagerActions;
  resultHistory: ResultHistoryEntry[];
  onStopStreaming: () => void;
}

export default function PlayerSurface({
  video,
  videoActions,
  triggers,
  triggerActions,
  resultHistory,
  onStopStreaming,
}: PlayerSurfaceProps) {
  const {
    containerRef,
    videoRef,
    isStreaming,
    isFullscreen,
    shouldMirror,
    displayInfo,
    error,
  } = video;
  const { startWebcam, startVideoFile, enterFullscreen, exitFullscreen } = videoActions;
  const {
    query1,
    selectedTriggerId,
    predefinedTriggers,
    customTriggers,
    isCustomModalOpen,
    customTriggerForm,
  } = triggers;
  const { setQuery1, handleTriggerChange, setIsCustomModalOpen, setCustomTriggerForm, createCustomTrigger } = triggerActions;

  const isMobile = displayInfo.displayWidth < 500;
  const defaultAspectRatio = isMobile ? '4/5' : '16/9';
  const aspectRatio = isFullscreen ? (isStreaming ? 'unset' : defaultAspectRatio) : defaultAspectRatio;

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative bg-black overflow-hidden"
        style={{
          aspectRatio,
          width: '100%',
          height: isFullscreen ? 'auto' : 'auto',
          borderRadius: isFullscreen ? '0' : '0.5rem',
        }}
      >
        {!isStreaming && (
          <StartOverlay onStartWebcam={startWebcam} onVideoFileChange={startVideoFile} />
        )}

        <TopLiveBar
          isStreaming={isStreaming}
          isFullscreen={isFullscreen}
          videoDisplayInfo={displayInfo}
          onEnterFullscreen={enterFullscreen}
          onExitFullscreen={exitFullscreen}
        />

        <video
          ref={videoRef as RefObject<HTMLVideoElement>}
          autoPlay
          playsInline
          muted
          className="w-full h-full"
          style={{
            objectFit: 'contain',
            objectPosition: isFullscreen ? 'top left' : 'center',
            transform: shouldMirror ? 'scaleX(-1)' : 'none',
          }}
        />

        <PromptControlsOverlay
          query1={query1}
          setQuery1={setQuery1}
          selectedTriggerId={selectedTriggerId}
          onTriggerChange={handleTriggerChange}
          predefinedTriggers={predefinedTriggers}
          customTriggers={customTriggers}
          videoDisplayInfo={displayInfo}
          onStopStreaming={onStopStreaming}
          isStreaming={isStreaming}
        />

        {isStreaming && (
          <ResultOverlay
            isFullscreen={isFullscreen}
            videoDisplayInfo={displayInfo}
            resultHistory={resultHistory}
          />
        )}

        {error && (
          <div className="absolute top-4 left-1/2 z-30 w-full px-4 flex justify-center pointer-events-none">
            <div className="max-w-xl w-full text-center text-sm sm:text-base text-white bg-red-500/80 border border-red-400/60 px-4 py-3 rounded-2xl shadow-lg backdrop-blur">
              {error}
            </div>
          </div>
        )}

        <CustomTriggerDialog
          isOpen={isCustomModalOpen}
          onOpenChange={(open) => setIsCustomModalOpen(open)}
          form={customTriggerForm}
          onFormChange={setCustomTriggerForm}
          onSubmit={createCustomTrigger}
        />
      </div>
    </div>
  );
}

