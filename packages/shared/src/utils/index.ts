import type { ConfidenceScore } from '../types';

/**
 * Calculates a qualitative label for a numeric confidence score.
 * @param confidence Numeric confidence object emitted by the AI pipeline.
 * @returns One of `"low"`, `"medium"`, or `"high"` representing the score band.
 */
export const confidenceBand = (confidence: ConfidenceScore): 'low' | 'medium' | 'high' => {
  if (confidence.value >= 0.75) {
    return 'high';
  }
  if (confidence.value >= 0.4) {
    return 'medium';
  }
  return 'low';
};

/**
 * Determines whether the system should escalate the interaction to a human volunteer.
 * @param confidence Confidence metrics for the current AI response.
 * @param threshold Configurable numeric threshold used for escalation decisions.
 * @returns True when the confidence value is below the specified threshold.
 */
export const shouldEscalate = (
  confidence: ConfidenceScore,
  threshold: number = 0.5,
): boolean => confidence.value < threshold;

/**
 * Ensures a confidence value is clamped within the `0` to `1` range.
 * @param value Raw numeric value to normalise.
 * @returns Normalised numeric value.
 */
export const clampConfidence = (value: number): number => {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
};
