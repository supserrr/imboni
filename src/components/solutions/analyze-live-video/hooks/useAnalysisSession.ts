"use client"

import { useCallback } from 'react';
import { useFrameAnalysis } from '@/hooks/useFrameAnalysis';
import type { TriggerConfig } from '../player-types';

interface UseAnalysisSessionParams {
  inferenceUrl: string;
  captureFrame: () => string | null;
  triggerConfig: TriggerConfig;
  shouldAnalyze: boolean;
  onError: (message: string) => void;
}

export function useAnalysisSession({ inferenceUrl, captureFrame, triggerConfig, shouldAnalyze, onError }: UseAnalysisSessionParams) {
  const { clearHistory } = useFrameAnalysis({
    inferenceUrl,
    captureFrame,
    config: triggerConfig,
    shouldAnalyze,
    onError,
  });

  const reset = useCallback(() => {
    clearHistory();
  }, [clearHistory]);

  return { reset };
}

