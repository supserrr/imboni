/**
 * Whisper fallback service for low confidence or failed STT.
 * Provides retry logic and user-friendly prompts.
 */

import { STTChunk } from './whisperGroq';
import { debug, warn, info } from '@/lib/utils/logger';

/**
 * Fallback configuration.
 */
export interface FallbackConfig {
  maxRetries: number;
  minConfidence: number;
  retryPrompt: string;
  escalatePrompt: string;
}

/**
 * Default fallback configuration.
 */
const DEFAULT_CONFIG: FallbackConfig = {
  maxRetries: 2,
  minConfidence: 0.7,
  retryPrompt: "I didn't catch that. Could you repeat?",
  escalatePrompt: "I'm having trouble understanding. Would you like me to connect you with a volunteer?",
};

/**
 * Fallback handler state.
 */
interface FallbackState {
  retryCount: number;
  lastError?: Error;
}

/**
 * Handles low confidence or failed STT with retry logic.
 *
 * @param chunk - STT chunk result
 * @param state - Fallback state
 * @param config - Fallback configuration
 * @returns True if should retry, false if should escalate
 */
export function handleLowConfidence(
  chunk: STTChunk,
  state: FallbackState,
  config: FallbackConfig = DEFAULT_CONFIG
): boolean {
  if (chunk.confidence >= config.minConfidence) {
    // Confidence is good, reset retry count
    state.retryCount = 0;
    state.lastError = undefined;
    return false;
  }

  state.retryCount += 1;
  
  debug('Low confidence STT detected', {
    confidence: chunk.confidence,
    text: chunk.text,
    retryCount: state.retryCount,
    minConfidence: config.minConfidence,
  });

  if (state.retryCount <= config.maxRetries) {
    info(`STT retry ${state.retryCount}/${config.maxRetries}`, {
      confidence: chunk.confidence,
      retryPrompt: config.retryPrompt,
    });
    return true; // Should retry
  }

  // Max retries reached, should escalate
  warn('Max STT retries reached, escalating to volunteer', {
    retryCount: state.retryCount,
    escalatePrompt: config.escalatePrompt,
  });
  return false; // Should escalate
}

/**
 * Handles STT errors with retry logic.
 *
 * @param error - Error that occurred
 * @param state - Fallback state
 * @param config - Fallback configuration
 * @returns True if should retry, false if should escalate
 */
export function handleSTTError(
  error: Error,
  state: FallbackState,
  config: FallbackConfig = DEFAULT_CONFIG
): boolean {
  state.retryCount += 1;
  state.lastError = error;

  debug('STT error detected', {
    error: error.message,
    retryCount: state.retryCount,
  });

  if (state.retryCount <= config.maxRetries) {
    info(`STT error retry ${state.retryCount}/${config.maxRetries}`, {
      error: error.message,
      retryPrompt: config.retryPrompt,
    });
    return true; // Should retry
  }

  // Max retries reached, should escalate
  warn('Max STT error retries reached, escalating to volunteer', {
    retryCount: state.retryCount,
    error: error.message,
    escalatePrompt: config.escalatePrompt,
  });
  return false; // Should escalate
}

/**
 * Gets the appropriate prompt for the current fallback state.
 *
 * @param state - Fallback state
 * @param config - Fallback configuration
 * @returns User-friendly prompt
 */
export function getFallbackPrompt(
  state: FallbackState,
  config: FallbackConfig = DEFAULT_CONFIG
): string {
  if (state.retryCount <= config.maxRetries) {
    return config.retryPrompt;
  }
  return config.escalatePrompt;
}

/**
 * Resets fallback state.
 *
 * @param state - Fallback state to reset
 */
export function resetFallbackState(state: FallbackState): void {
  state.retryCount = 0;
  state.lastError = undefined;
}

