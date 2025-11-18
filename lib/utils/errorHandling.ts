/**
 * Centralized error handling for all API calls.
 * Provides retry logic with exponential backoff and user-friendly error messages.
 */

/**
 * Error categories for different handling strategies.
 */
export enum ErrorCategory {
  NETWORK = 'network',
  RATE_LIMIT = 'rate_limit',
  AUTH = 'auth',
  VALIDATION = 'validation',
  SERVER = 'server',
  UNKNOWN = 'unknown',
}

/**
 * Error with category and retry information.
 */
export class CategorizedError extends Error {
  category: ErrorCategory;
  retryable: boolean;
  retryAfter?: number; // Seconds to wait before retry

  constructor(
    message: string,
    category: ErrorCategory,
    retryable: boolean = false,
    retryAfter?: number
  ) {
    super(message);
    this.name = 'CategorizedError';
    this.category = category;
    this.retryable = retryable;
    this.retryAfter = retryAfter;
  }
}

/**
 * Categorizes an error based on its properties.
 *
 * @param error - Error to categorize
 * @returns Categorized error
 */
export function categorizeError(error: unknown): CategorizedError {
  if (error instanceof CategorizedError) {
    return error;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Rate limit errors
  if (
    lowerMessage.includes('429') ||
    lowerMessage.includes('rate limit') ||
    lowerMessage.includes('too many requests')
  ) {
    // Extract retry-after header if present (in format like "Retry-After: 60")
    const retryAfterMatch = errorMessage.match(/retry[-\s]after[:\s]+(\d+)/i);
    const retryAfter = retryAfterMatch ? parseInt(retryAfterMatch[1], 10) : 60;

    return new CategorizedError(
      'Too many requests. Please wait a moment.',
      ErrorCategory.RATE_LIMIT,
      true,
      retryAfter
    );
  }

  // Authentication errors
  if (
    lowerMessage.includes('401') ||
    lowerMessage.includes('403') ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('forbidden')
  ) {
    return new CategorizedError(
      'Authentication failed. Please check your API key.',
      ErrorCategory.AUTH,
      false
    );
  }

  // Network errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('aborted')
  ) {
    return new CategorizedError(
      'Network error. Please check your connection and try again.',
      ErrorCategory.NETWORK,
      true
    );
  }

  // Server errors (5xx)
  if (
    lowerMessage.includes('500') ||
    lowerMessage.includes('502') ||
    lowerMessage.includes('503') ||
    lowerMessage.includes('504') ||
    lowerMessage.includes('internal server error')
  ) {
    return new CategorizedError(
      'Server error. Please try again in a moment.',
      ErrorCategory.SERVER,
      true
    );
  }

  // Validation errors (4xx except auth)
  if (lowerMessage.includes('400') || lowerMessage.includes('422')) {
    return new CategorizedError(
      'Invalid request. Please check your input.',
      ErrorCategory.VALIDATION,
      false
    );
  }

  // Unknown error
  return new CategorizedError(
    errorMessage || 'An unexpected error occurred.',
    ErrorCategory.UNKNOWN,
    false
  );
}

/**
 * Retry configuration.
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number; // Milliseconds
  maxDelay: number; // Milliseconds
  backoffMultiplier: number;
}

/**
 * Default retry configuration.
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
};

/**
 * Calculates delay for exponential backoff.
 *
 * @param attempt - Attempt number (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
}

/**
 * Executes a function with retry logic and exponential backoff.
 *
 * @param fn - Function to execute
 * @param config - Retry configuration
 * @returns Result of the function
 * @throws Last error if all retries fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const categorized = categorizeError(error);

      // Don't retry if error is not retryable
      if (!categorized.retryable || attempt === config.maxRetries) {
        throw categorized;
      }

      // Use retry-after delay if specified, otherwise use exponential backoff
      const delay = categorized.retryAfter
        ? categorized.retryAfter * 1000
        : calculateBackoffDelay(attempt, config);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw categorizeError(lastError);
}

/**
 * Gets user-friendly error message for display.
 *
 * @param error - Error to convert
 * @returns User-friendly message
 */
export function getUserFriendlyMessage(error: unknown): string {
  const categorized = categorizeError(error);
  return categorized.message;
}

