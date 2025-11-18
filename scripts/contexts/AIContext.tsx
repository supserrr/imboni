/**
 * AI context for managing AI session state and interaction loop.
 * Integrates new pipeline with Supabase Edge Functions and Realtime sync.
 */

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { MoondreamResponse } from '@/lib/services/vision/moondreamReasoning';
import { useAuth } from './AuthContext';
import { startSession, endSession, addExchange, getContext, getHistory, getSession, getPreferences, updatePreferences, UserPreferences } from '@/lib/services/realtime/sessionContext';
import { setLogContext, clearLogContext } from '@/lib/utils/logger';

/**
 * AI context interface for managing AI session state.
 */
interface AIContextType {
  isActive: boolean;
  isProcessing: boolean;
  lastAnalysis: MoondreamResponse | null;
  lowConfidenceDetected: boolean;
  currentTranscript: string;
  sessionId: string | null;
  startSession: () => void;
  stopSession: () => void;
  handleUserSpeech: (text: string) => Promise<void>;
  analyzeImage: (imageBase64: string, query?: string) => Promise<MoondreamResponse>;
  currentQuery: string | undefined;
  setQuery: (query: string) => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

/**
 * AI provider component that manages AI session and frame analysis.
 * Uses new interaction loop and session context.
 *
 * @param children - Child components
 * @returns AIContext provider
 */
export function AIProvider({ children }: { children: React.ReactNode }) {
  const { profile, user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<MoondreamResponse | null>(null);
  const [lowConfidenceDetected, setLowConfidenceDetected] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string | undefined>();

  /**
   * Starts an AI session.
   */
  const startSessionHandler = useCallback(() => {
    if (!user || !profile) {
      return;
    }

    // Convert profile preferences to UserPreferences format
    const preferences: UserPreferences = {
      language: profile.language,
      preferred_voice: profile.preferred_voice,
      speech_rate: profile.speech_rate,
      verbosity_level: profile.verbosity_level || 'detailed',
      confidence_threshold: profile.confidence_threshold || 0.55, // Updated default from 0.7 to 0.55
    };

    // Start session with context manager
    const newSessionId = startSession(user.id, preferences);
    setSessionId(newSessionId);
    setIsActive(true);
    setLowConfidenceDetected(false);
    setLastAnalysis(null);
    setCurrentTranscript('');
    setIsProcessing(false);

    // Set log context for debugging
    setLogContext({
      sessionId: newSessionId,
      userId: user.id,
    });
  }, [user, profile]);

  /**
   * Stops an AI session.
   */
  const stopSessionHandler = useCallback(async () => {
    if (!sessionId) {
      return;
    }

    // End session and save to Supabase
    await endSession();
    
    setIsActive(false);
    setIsProcessing(false);
    setLowConfidenceDetected(false);
    setLastAnalysis(null);
    setCurrentTranscript('');
    setCurrentQuery(undefined);
    setSessionId(null);

    // Clear log context
    clearLogContext();
  }, [sessionId]);

  /**
   * Handles user speech input.
   *
   * @param text - User speech text
   */
  const handleUserSpeech = useCallback(async (text: string): Promise<void> => {
    if (!text.trim() || !isActive) {
      return;
    }

    setCurrentTranscript(text);
    setIsProcessing(true);

    // Add to conversation history
    addExchange(text, undefined);

    // Processing will be handled by interaction loop
    // This method is called by the interaction loop after STT
  }, [isActive]);

  /**
   * Analyzes an image frame and handles response.
   *
   * @param imageBase64 - Base64 encoded image
   * @param query - Optional user query
   * @returns Analysis response
   */
  const analyzeImage = useCallback(
    async (imageBase64: string, query?: string): Promise<MoondreamResponse> => {
      if (!sessionId || !profile) {
        throw new Error('Session not active');
      }

      setIsProcessing(true);
      try {
        // Use new moondreamReasoning service
        const { analyzeWithReasoning } = await import('@/lib/services/vision/moondreamReasoning');
        
        const analysis = await analyzeWithReasoning({
          imageBase64,
          userText: query || currentQuery,
          context: {
            conversationHistory: getHistory().map((ex) => ({
              userInput: ex.userInput,
              aiResponse: ex.aiResponse,
              timestamp: ex.timestamp,
            })),
            userPreferences: getPreferences() || undefined,
          },
        });

        setLastAnalysis(analysis);

        // Check confidence (threshold updated to 0.55)
        const confidenceThreshold = profile.confidence_threshold || 0.55;
        const isLow = analysis.confidence < confidenceThreshold;
        setLowConfidenceDetected(isLow);

        // Add to conversation history
        addExchange(undefined, analysis.description, analysis.confidence);

        return analysis;
      } catch (error) {
        console.error('Error analyzing image:', error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [sessionId, profile, currentQuery]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionId) {
        endSession().catch(console.error);
      }
      clearLogContext();
    };
  }, [sessionId]);

  const value = {
    isActive,
    isProcessing,
    lastAnalysis,
    lowConfidenceDetected,
    currentTranscript,
    sessionId,
    startSession: startSessionHandler,
    stopSession: stopSessionHandler,
    handleUserSpeech,
    analyzeImage,
    currentQuery,
    setQuery: setCurrentQuery,
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
