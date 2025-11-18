/**
 * Adaptive throttling for APIs (rate limits, queuing).
 * Tracks API call frequency per service and implements backoff strategies.
 */

import { ErrorCategory, categorizeError } from './errorHandling';
import { warn, debug } from './logger';

/**
 * Throttle configuration for a service.
 */
export interface ThrottleConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerSecond: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
  backoffMultiplier: number;
}

/**
 * Request metadata.
 */
interface RequestMetadata {
  timestamp: number;
  service: string;
  success: boolean;
  errorCategory?: ErrorCategory;
}

/**
 * Service throttle state.
 */
interface ServiceThrottleState {
  requests: RequestMetadata[];
  backoffUntil: number;
  currentBackoffMs: number;
  consecutiveErrors: number;
}

/**
 * Default throttle configurations by service.
 */
const DEFAULT_THROTTLE_CONFIGS: Record<string, ThrottleConfig> = {
  groq: {
    maxRequestsPerMinute: 60,
    maxRequestsPerSecond: 10,
    initialBackoffMs: 1000,
    maxBackoffMs: 30000,
    backoffMultiplier: 2,
  },
  elevenlabs: {
    maxRequestsPerMinute: 120,
    maxRequestsPerSecond: 20,
    initialBackoffMs: 500,
    maxBackoffMs: 15000,
    backoffMultiplier: 1.5,
  },
  moondream: {
    maxRequestsPerMinute: 30,
    maxRequestsPerSecond: 5,
    initialBackoffMs: 2000,
    maxBackoffMs: 60000,
    backoffMultiplier: 2,
  },
  default: {
    maxRequestsPerMinute: 60,
    maxRequestsPerSecond: 10,
    initialBackoffMs: 1000,
    maxBackoffMs: 30000,
    backoffMultiplier: 2,
  },
};

/**
 * Throttle state per service.
 */
const throttleStates: Map<string, ServiceThrottleState> = new Map();

/**
 * Gets throttle state for a service, creating it if needed.
 *
 * @param service - Service name
 * @returns Throttle state
 */
function getThrottleState(service: string): ServiceThrottleState {
  if (!throttleStates.has(service)) {
    throttleStates.set(service, {
      requests: [],
      backoffUntil: 0,
      currentBackoffMs: 0,
      consecutiveErrors: 0,
    });
  }
  return throttleStates.get(service)!;
}

/**
 * Gets throttle config for a service.
 *
 * @param service - Service name
 * @returns Throttle configuration
 */
function getThrottleConfig(service: string): ThrottleConfig {
  return DEFAULT_THROTTLE_CONFIGS[service] || DEFAULT_THROTTLE_CONFIGS.default;
}

/**
 * Cleans up old requests from state.
 *
 * @param state - Throttle state
 * @param now - Current timestamp
 */
function cleanupOldRequests(state: ServiceThrottleState, now: number): void {
  // Keep only requests from the last minute
  const oneMinuteAgo = now - 60000;
  state.requests = state.requests.filter((req) => req.timestamp > oneMinuteAgo);
}

/**
 * Checks if a service should be throttled.
 *
 * @param service - Service name
 * @returns True if throttled, delay in milliseconds if throttled
 */
export function shouldThrottle(service: string): { throttled: boolean; delayMs: number } {
  const now = Date.now();
  const state = getThrottleState(service);
  const config = getThrottleConfig(service);

  // Clean up old requests
  cleanupOldRequests(state, now);

  // Check if we're in backoff period
  if (now < state.backoffUntil) {
    const delayMs = state.backoffUntil - now;
    debug(`Service ${service} in backoff period`, { delayMs, service });
    return { throttled: true, delayMs };
  }

  // Check requests per second
  const oneSecondAgo = now - 1000;
  const recentRequests = state.requests.filter((req) => req.timestamp > oneSecondAgo);
  
  if (recentRequests.length >= config.maxRequestsPerSecond) {
    const delayMs = 1000 - (now - recentRequests[0].timestamp);
    debug(`Service ${service} rate limited per second`, {
      count: recentRequests.length,
      limit: config.maxRequestsPerSecond,
      service,
    });
    return { throttled: true, delayMs: Math.max(delayMs, 100) };
  }

  // Check requests per minute
  if (state.requests.length >= config.maxRequestsPerMinute) {
    const oldestRequest = state.requests[0];
    const delayMs = 60000 - (now - oldestRequest.timestamp);
    debug(`Service ${service} rate limited per minute`, {
      count: state.requests.length,
      limit: config.maxRequestsPerMinute,
      service,
    });
    return { throttled: true, delayMs: Math.max(delayMs, 100) };
  }

  return { throttled: false, delayMs: 0 };
}

/**
 * Records a request for throttling purposes.
 *
 * @param service - Service name
 * @param success - Whether the request succeeded
 * @param error - Optional error that occurred
 */
export function recordRequest(service: string, success: boolean, error?: unknown): void {
  const now = Date.now();
  const state = getThrottleState(service);
  const config = getThrottleConfig(service);

  // Record request
  const category = error ? categorizeError(error).category : undefined;
  state.requests.push({
    timestamp: now,
    service,
    success,
    errorCategory: category,
  });

  // Update consecutive errors counter
  if (success) {
    state.consecutiveErrors = 0;
    // Reset backoff on successful request
    state.currentBackoffMs = 0;
  } else {
    state.consecutiveErrors += 1;

    // If rate limited, increase backoff
    if (category === ErrorCategory.RATE_LIMIT) {
      state.currentBackoffMs = Math.min(
        state.currentBackoffMs * config.backoffMultiplier || config.initialBackoffMs,
        config.maxBackoffMs
      );
      state.backoffUntil = now + state.currentBackoffMs;
      warn(`Service ${service} rate limited, backing off`, {
        backoffMs: state.currentBackoffMs,
        consecutiveErrors: state.consecutiveErrors,
        service,
      });
    } else if (state.consecutiveErrors >= 3) {
      // After 3 consecutive errors, start backoff
      state.currentBackoffMs = Math.min(
        state.currentBackoffMs * config.backoffMultiplier || config.initialBackoffMs,
        config.maxBackoffMs
      );
      state.backoffUntil = now + state.currentBackoffMs;
      warn(`Service ${service} backing off after consecutive errors`, {
        backoffMs: state.currentBackoffMs,
        consecutiveErrors: state.consecutiveErrors,
        service,
      });
    }
  }

  // Clean up old requests
  cleanupOldRequests(state, now);
}

/**
 * Waits if throttling is required.
 *
 * @param service - Service name
 * @returns Promise that resolves when throttling check passes
 */
export async function waitIfThrottled(service: string): Promise<void> {
  const check = shouldThrottle(service);
  if (check.throttled && check.delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, check.delayMs));
  }
}

/**
 * Resets throttle state for a service.
 *
 * @param service - Service name (optional, resets all if not provided)
 */
export function resetThrottle(service?: string): void {
  if (service) {
    throttleStates.delete(service);
  } else {
    throttleStates.clear();
  }
}

