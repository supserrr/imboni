"use client"

import { useCallback } from 'react';
import PlayerSurface from './player-surface';
import { useVideoSession, useTriggerManager, useAnalysisSession } from './hooks';
import type { Trigger } from './player-types';
export type { Trigger, CustomTriggerFormState } from './player-types';

interface PlayerProps {
  inferenceUrl: string;
  defaultFullscreen?: boolean;
}

const PRE_DEFINED_TRIGGERS: Trigger[] = [
  {
    id: 'smiling',
    name: 'Smiling',
    query: 'is anyone smiling? yes or no',
    triggerText: 'yes',
    notificationText: '😊 Smile Detected!',
  },
  {
    id: 'thumbs-up',
    name: 'Thumbs Up',
    query: 'is anyone giving a thumbs-up gesture? yes or no',
    triggerText: 'yes',
    notificationText: '👍 Thumbs Up Detected!',
  },
  {
    id: 'tongue-out',
    name: 'Sticking Tongue Out',
    query: 'is anyone sticking their tongue out? yes or no',
    triggerText: 'yes',
    notificationText: '👅 Tongue Out Detected!',
  },
  {
    id: 'peace-sign',
    name: 'Peace Sign',
    query: 'is anyone making a peace sign? yes or no',
    triggerText: 'yes',
    notificationText: '✌️ Peace Sign Detected!',
  },
  {
    id: 'drinking-water',
    name: 'Drinking Water',
    query: 'is anyone drinking water? yes or no',
    triggerText: 'yes',
    notificationText: '💧 Drinking Water Detected!',
  },
];

export default function Player({ inferenceUrl, defaultFullscreen = false }: PlayerProps) {
  const { state: videoState, actions: videoActions } = useVideoSession({ defaultFullscreen });
  const { state: triggerState, actions: triggerActions, config: triggerConfig } = useTriggerManager({
    predefinedTriggers: PRE_DEFINED_TRIGGERS,
  });

  const { resultHistory, reset } = useAnalysisSession({
    inferenceUrl,
    captureFrame: videoActions.captureFrame,
    triggerConfig,
    shouldAnalyze: videoState.isStreaming,
    onError: videoActions.setError,
  });

  const { stopStreaming } = videoActions;

  const handleStopStreaming = useCallback(() => {
    stopStreaming();
    reset();
  }, [stopStreaming, reset]);

  return (
    <div className={videoState.isFullscreen ? 'fixed inset-0 z-50 bg-black flex items-center justify-center' : 'w-full max-w-6xl mx-auto mt-8'}>
      <PlayerSurface
        video={videoState}
        videoActions={videoActions}
        triggers={triggerState}
        triggerActions={triggerActions}
        resultHistory={resultHistory}
        onStopStreaming={handleStopStreaming}
      />
    </div>
  );
}

