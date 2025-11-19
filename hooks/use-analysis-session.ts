import { useState, useCallback, useRef, useEffect } from 'react';
import type { AnalysisResult } from '@/lib/bentoml-api';
import { useFrameAnalysis, type FrameAnalysisCallbacks } from './use-frame-analysis';

export interface AnalysisHistoryItem extends AnalysisResult {
  timestamp: number;
  id: string;
}

export interface AnalysisSessionOptions {
  maxHistory?: number;
  autoAnalyze?: boolean;
  confidenceThreshold?: number;
  onLowConfidence?: () => void;
  onHighConfidence?: (result: AnalysisResult) => void;
}

/**
 * Hook that bridges video session with frame analysis.
 * 
 * Features:
 * - Manages rolling history of analysis results
 * - Tracks confidence levels
 * - Triggers callbacks based on confidence thresholds
 * - Connects frame captures to analysis pipeline
 */
export function useAnalysisSession(
  onFrameCapture: (callback: (base64: string) => void) => void,
  options: AnalysisSessionOptions = {}
) {
  const {
    maxHistory = 10,
    autoAnalyze = true,
    confidenceThreshold = 0.7,
    onLowConfidence,
    onHighConfidence,
  } = options;

  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastConfidence, setLastConfidence] = useState<number | null>(null);

  // Frame analysis callbacks
  const frameAnalysisCallbacks: FrameAnalysisCallbacks = {
    onResult: useCallback((result: AnalysisResult) => {
      setIsProcessing(false);
      setCurrentResult(result);
      setLastConfidence(result.confidence);

      // Add to history
      const historyItem: AnalysisHistoryItem = {
        ...result,
        timestamp: Date.now(),
        id: `analysis-${Date.now()}-${Math.random()}`,
      };

      setHistory((prev) => {
        const updated = [historyItem, ...prev];
        return updated.slice(0, maxHistory);
      });

      // Trigger confidence-based callbacks
      if (result.confidence >= confidenceThreshold) {
        onHighConfidence?.(result);
      } else {
        onLowConfidence?.();
      }
    }, [confidenceThreshold, maxHistory, onHighConfidence, onLowConfidence]),

    onError: useCallback((error: Error) => {
      setIsProcessing(false);
      console.error('Frame analysis error:', error);
    }, []),

    onRetry: useCallback((attempt: number, maxRetries: number) => {
      console.log(`Retrying analysis (attempt ${attempt}/${maxRetries})...`);
    }, []),
  };

  const {
    analyzeFrame,
    analyzeFrameImmediate,
    cancelPending,
    isAnalyzing,
  } = useFrameAnalysis({ debounceMs: 500, maxRetries: 3 }, frameAnalysisCallbacks);

  // Handle frame capture
  const handleFrameCapture = useCallback(
    async (base64: string) => {
      if (!autoAnalyze || isAnalyzing()) {
        return;
      }

      setIsProcessing(true);
      await analyzeFrame(base64);
    },
    [autoAnalyze, analyzeFrame, isAnalyzing]
  );

  // Register frame capture callback
  useEffect(() => {
    if (autoAnalyze) {
      onFrameCapture(handleFrameCapture);
    }
  }, [autoAnalyze, onFrameCapture, handleFrameCapture]);

  /**
   * Manually trigger analysis of a frame.
   */
  const analyzeManually = useCallback(
    async (base64: string): Promise<AnalysisResult | null> => {
      setIsProcessing(true);
      const result = await analyzeFrameImmediate(base64);
      return result;
    },
    [analyzeFrameImmediate]
  );

  /**
   * Clear analysis history.
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentResult(null);
    setLastConfidence(null);
  }, []);

  /**
   * Get the most recent analysis result.
   */
  const getLatestResult = useCallback((): AnalysisResult | null => {
    return history[0] || currentResult;
  }, [history, currentResult]);

  /**
   * Check if last analysis had low confidence.
   */
  const hasLowConfidence = useCallback((): boolean => {
    return lastConfidence !== null && lastConfidence < confidenceThreshold;
  }, [lastConfidence, confidenceThreshold]);

  return {
    // State
    history,
    currentResult,
    isProcessing,
    lastConfidence,
    
    // Actions
    analyzeManually,
    clearHistory,
    cancelPending,
    
    // Getters
    getLatestResult,
    hasLowConfidence,
    isAnalyzing: isAnalyzing(),
  };
}

