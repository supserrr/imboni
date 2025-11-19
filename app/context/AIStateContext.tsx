import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { playStateSound } from '../utils/ElevenLabsAudio';

export type AIState = 'idle' | 'listening' | 'processing' | 'speaking' | 'lowConfidence';

interface AIStateContextType {
  state: AIState;
  dispatch: (action: AIStateAction) => void;
  isActive: boolean;
  onLowConfidence?: () => void;
}

type AIStateAction =
  | { type: 'SET_IDLE' }
  | { type: 'SET_LISTENING' }
  | { type: 'SET_PROCESSING' }
  | { type: 'SET_SPEAKING' }
  | { type: 'SET_LOW_CONFIDENCE' }
  | { type: 'END_SESSION' };

interface AIStateProviderProps {
  children: ReactNode;
  onLowConfidence?: () => void;
}

function aiStateReducer(state: AIState, action: AIStateAction): AIState {
  switch (action.type) {
    case 'SET_IDLE':
      return 'idle';
    case 'SET_LISTENING':
      return 'listening';
    case 'SET_PROCESSING':
      return 'processing';
    case 'SET_SPEAKING':
      return 'speaking';
    case 'SET_LOW_CONFIDENCE':
      return 'lowConfidence';
    case 'END_SESSION':
      return 'idle';
    default:
      return state;
  }
}

const AIStateContext = createContext<AIStateContextType | undefined>(undefined);

export function AIStateProvider({ children, onLowConfidence }: AIStateProviderProps) {
  const [state, dispatch] = useReducer(aiStateReducer, 'idle');
  const isActive = state !== 'idle';
  const previousStateRef = useRef<AIState>('idle');
  const onLowConfidenceRef = useRef(onLowConfidence);

  useEffect(() => {
    onLowConfidenceRef.current = onLowConfidence;
  }, [onLowConfidence]);

  /**
   * Handles haptic feedback for state transitions.
   *
   * @param newState - The new AI state.
   */
  async function triggerHapticFeedback(newState: AIState): Promise<void> {
    try {
      switch (newState) {
        case 'listening':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'processing':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'speaking':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'lowConfidence':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error triggering haptic feedback:', error);
    }
  }

  useEffect(() => {
    if (state !== previousStateRef.current) {
      const newState = state;
      previousStateRef.current = newState;

      (async () => {
        if (newState !== 'idle') {
          await playStateSound(newState);
        }
        
        await triggerHapticFeedback(newState);

        if (newState === 'lowConfidence' && onLowConfidenceRef.current) {
          onLowConfidenceRef.current();
        }
      })();
    }
  }, [state]);

  return (
    <AIStateContext.Provider value={{ state, dispatch, isActive, onLowConfidence }}>
      {children}
    </AIStateContext.Provider>
  );
}

/**
 * Hook to access the AI state context.
 *
 * @returns The AI state context value.
 */
export function useAIState() {
  const context = useContext(AIStateContext);
  if (context === undefined) {
    throw new Error('useAIState must be used within an AIStateProvider');
  }
  return context;
}

