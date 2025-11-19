import { useCallback, useRef } from 'react';
import { analyzeImage, type AnalysisResult } from '@/lib/bentoml-api';

export interface FrameAnalysisOptions {
  debounceMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export interface FrameAnalysisCallbacks {
  onResult?: (result: AnalysisResult) => void;
  onError?: (error: Error) => void;
  onRetry?: (attempt: number, maxRetries: number) => void;
}

/**
 * Hook for analyzing video frames with debouncing, retry logic, and structured results.
 * 
 * Features:
 * - Debounces frame captures to avoid excessive API calls
 * - Automatic retry on failures with exponential backoff
 * - Structured result/error callbacks
 * - Throttling protection
 */
export function useFrameAnalysis(
  options: FrameAnalysisOptions = {},
  callbacks: FrameAnalysisCallbacks = {}
) {
  const {
    debounceMs = 500,
    maxRetries = 3,
    retryDelayMs = 1000,
  } = options;

  const {
    onResult,
    onError,
    onRetry,
  } = callbacks;

  const isAnalyzingRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnalysisTimeRef = useRef(0);

  /**
   * Analyze a frame with retry logic and exponential backoff.
   */
  const analyzeWithRetry = useCallback(
    async (base64Image: string, attempt = 1): Promise<AnalysisResult> => {
      try {
        const result = await analyzeImage(base64Image);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        
        // Check if it's a throttling/rate limit error
        const isThrottleError = 
          err.message.includes('429') ||
          err.message.includes('throttle') ||
          err.message.includes('rate limit');

        if (attempt < maxRetries) {
          // Notify about retry
          onRetry?.(attempt, maxRetries);
          
          // Exponential backoff: 1s, 2s, 4s...
          const delay = retryDelayMs * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return analyzeWithRetry(base64Image, attempt + 1);
        }

        // Max retries reached
        throw err;
      }
    },
    [maxRetries, retryDelayMs, onRetry]
  );

  /**
   * Debounced frame analysis.
   * Only analyzes if enough time has passed since last analysis.
   */
  const analyzeFrame = useCallback(
    async (base64Image: string): Promise<AnalysisResult | null> => {
      // Prevent concurrent analyses
      if (isAnalyzingRef.current) {
        return null;
      }

      // Clear any pending debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      return new Promise((resolve) => {
        debounceTimerRef.current = setTimeout(async () => {
          const now = Date.now();
          const timeSinceLastAnalysis = now - lastAnalysisTimeRef.current;

          // Only analyze if debounce time has passed
          if (timeSinceLastAnalysis < debounceMs) {
            resolve(null);
            return;
          }

          try {
            isAnalyzingRef.current = true;
            lastAnalysisTimeRef.current = Date.now();

            const result = await analyzeWithRetry(base64Image);
            
            onResult?.(result);
            resolve(result);
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            onError?.(err);
            resolve(null);
          } finally {
            isAnalyzingRef.current = false;
          }
        }, debounceMs);
      });
    },
    [debounceMs, analyzeWithRetry, onResult, onError]
  );

  /**
   * Immediate analysis (bypasses debounce).
   * Useful for manual triggers.
   */
  const analyzeFrameImmediate = useCallback(
    async (base64Image: string): Promise<AnalysisResult | null> => {
      if (isAnalyzingRef.current) {
        return null;
      }

      // Clear debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      try {
        isAnalyzingRef.current = true;
        lastAnalysisTimeRef.current = Date.now();

        const result = await analyzeWithRetry(base64Image);
        
        onResult?.(result);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err);
        return null;
      } finally {
        isAnalyzingRef.current = false;
      }
    },
    [analyzeWithRetry, onResult, onError]
  );

  /**
   * Cancel any pending analysis.
   */
  const cancelPending = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  /**
   * Check if analysis is currently in progress.
   */
  const isAnalyzing = useCallback(() => {
    return isAnalyzingRef.current;
  }, []);

  return {
    analyzeFrame,
    analyzeFrameImmediate,
    cancelPending,
    isAnalyzing,
  };
}

