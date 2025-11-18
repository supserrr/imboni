/**
 * Confidence handler for volunteer fallback.
 * Checks if Moondream confidence < 0.55 and triggers volunteer fallback flow.
 */

import { debug, info } from '@/lib/utils/logger';
import { isLowConfidence as checkLowConfidence } from '../vision/moondreamReasoning';
import { MoondreamResponse } from '../vision/moondreamReasoning';

/**
 * Confidence handler configuration.
 */
export interface ConfidenceHandlerConfig {
  threshold: number; // Default 0.55
  showPrompt: boolean; // Whether to show user prompt
}

/**
 * Default configuration.
 */
const DEFAULT_CONFIG: ConfidenceHandlerConfig = {
  threshold: 0.55,
  showPrompt: true,
};

/**
 * Checks if confidence is low and handles accordingly.
 *
 * @param analysis - Moondream analysis response
 * @param threshold - Confidence threshold (default 0.55)
 * @returns True if confidence is low
 */
export function isLowConfidence(analysis: MoondreamResponse, threshold: number = 0.55): boolean {
  return checkLowConfidence(analysis.confidence, threshold);
}

/**
 * Gets the volunteer fallback prompt message.
 *
 * @returns User-friendly prompt message
 */
export function getVolunteerPrompt(): string {
  return "I'm not completely confident about this. Would you like me to connect you with a volunteer to confirm?";
}

/**
 * Gets the continue anyway prompt message.
 *
 * @returns User-friendly prompt message
 */
export function getContinuePrompt(): string {
  return "Continue anyway";
}

/**
 * Handles low confidence detection.
 *
 * @param analysis - Moondream analysis response
 * @param threshold - Confidence threshold
 * @param config - Handler configuration
 * @returns Object with low confidence status and message
 */
export function handleLowConfidence(
  analysis: MoondreamResponse,
  threshold: number = 0.55,
  config: Partial<ConfidenceHandlerConfig> = {}
): {
  isLow: boolean;
  message?: string;
  shouldShowPrompt: boolean;
} {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const isLow = isLowConfidence(analysis, threshold);

  if (!isLow) {
    return {
      isLow: false,
      shouldShowPrompt: false,
    };
  }

  info('Low confidence detected', {
    confidence: analysis.confidence,
    threshold,
    description: analysis.description?.substring(0, 100),
  });

  return {
    isLow: true,
    message: finalConfig.showPrompt ? getVolunteerPrompt() : undefined,
    shouldShowPrompt: finalConfig.showPrompt,
  };
}

