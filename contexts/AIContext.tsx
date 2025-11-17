import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { analyzeFrame, isLowConfidence, MoondreamResponse } from '../lib/services/moondream';
import { useAuth } from './AuthContext';

/**
 * AI context interface for managing AI session state.
 */
interface AIContextType {
  isActive: boolean;
  isSampling: boolean;
  lastAnalysis: MoondreamResponse | null;
  lowConfidenceDetected: boolean;
  startSession: () => void;
  stopSession: () => void;
  analyzeImage: (imageBase64: string, query?: string) => Promise<MoondreamResponse>;
  currentQuery: string | undefined;
  setQuery: (query: string) => void;
  setAudioPlayCallback: (callback: (text: string) => Promise<void>) => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

/**
 * AI provider component that manages AI session and frame analysis.
 *
 * @param children - Child components
 * @returns AIContext provider
 */
export function AIProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [isSampling, setIsSampling] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<MoondreamResponse | null>(null);
  const [lowConfidenceDetected, setLowConfidenceDetected] = useState(false);
  const [currentQuery, setCurrentQuery] = useState<string | undefined>();
  const samplingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const confidenceThreshold = profile?.confidence_threshold || 0.7;
  const audioPlayCallbackRef = useRef<((text: string) => Promise<void>) | null>(null);

  /**
   * Starts an AI session.
   */
  const startSession = useCallback(() => {
    setIsActive(true);
    setLowConfidenceDetected(false);
    setLastAnalysis(null);
  }, []);

  /**
   * Stops an AI session.
   */
  const stopSession = useCallback(() => {
    setIsActive(false);
    setIsSampling(false);
    if (samplingIntervalRef.current) {
      clearInterval(samplingIntervalRef.current);
      samplingIntervalRef.current = null;
    }
    setLowConfidenceDetected(false);
    setLastAnalysis(null);
    setCurrentQuery(undefined);
  }, []);

  /**
   * Analyzes an image frame and handles response.
   *
   * @param imageBase64 - Base64 encoded image
   * @param query - Optional user query
   * @returns Analysis response
   */
  const analyzeImage = useCallback(
    async (imageBase64: string, query?: string): Promise<MoondreamResponse> => {
      setIsSampling(true);
      try {
        const analysis = await analyzeFrame(imageBase64, query || currentQuery);
        setLastAnalysis(analysis);

        // Check confidence
        const isLow = isLowConfidence(analysis.confidence, confidenceThreshold);
        setLowConfidenceDetected(isLow);

        // AI responses are displayed in UI - OS accessibility will announce them
        // No custom TTS narration - relying on OS screen reader

        return analysis;
      } catch (error) {
        console.error('Error analyzing image:', error);
        throw error;
      } finally {
        setIsSampling(false);
      }
    },
    [currentQuery, confidenceThreshold]
  );

  const setAudioPlayCallback = useCallback((callback: (text: string) => Promise<void>) => {
    audioPlayCallbackRef.current = callback;
  }, []);

  const value = {
    isActive,
    isSampling,
    lastAnalysis,
    lowConfidenceDetected,
    startSession,
    stopSession,
    analyzeImage,
    currentQuery,
    setQuery: setCurrentQuery,
    setAudioPlayCallback,
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

/**
 * Hook to access the AI context.
 *
 * @returns AI context
 * @throws Error if used outside AIProvider
 */
export function useAI() {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}

