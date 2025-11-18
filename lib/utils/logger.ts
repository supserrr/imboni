/**
 * Structured logging for debugging and monitoring.
 * Provides log levels and context tracking (session ID, user ID).
 */

/**
 * Log levels.
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Log context for tracking session and user information.
 */
export interface LogContext {
  sessionId?: string;
  userId?: string;
  [key: string]: unknown;
}

/**
 * Log entry structure.
 */
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Global log context (can be set per session).
 */
let globalContext: LogContext = {};

/**
 * Sets global log context.
 *
 * @param context - Context to set
 */
export function setLogContext(context: LogContext): void {
  globalContext = { ...globalContext, ...context };
}

/**
 * Clears global log context.
 */
export function clearLogContext(): void {
  globalContext = {};
}

/**
 * Formats log entry as string.
 *
 * @param entry - Log entry to format
 * @returns Formatted log string
 */
function formatLogEntry(entry: LogEntry): string {
  const parts: string[] = [];
  parts.push(`[${entry.timestamp}]`);
  parts.push(`[${entry.level.toUpperCase()}]`);
  
  if (entry.context?.sessionId) {
    parts.push(`[Session:${entry.context.sessionId.substring(0, 8)}]`);
  }
  
  if (entry.context?.userId) {
    parts.push(`[User:${entry.context.userId.substring(0, 8)}]`);
  }
  
  parts.push(entry.message);
  
  if (entry.error) {
    parts.push(`\n  Error: ${entry.error.name}: ${entry.error.message}`);
    if (entry.error.stack) {
      parts.push(`\n  Stack: ${entry.error.stack}`);
    }
  }
  
  // Add additional context fields
  if (entry.context) {
    const additionalContext: Record<string, unknown> = { ...entry.context };
    delete additionalContext.sessionId;
    delete additionalContext.userId;
    
    const contextKeys = Object.keys(additionalContext);
    if (contextKeys.length > 0) {
      const contextStr = contextKeys
        .map((key) => `${key}=${JSON.stringify(additionalContext[key])}`)
        .join(', ');
      parts.push(`\n  Context: ${contextStr}`);
    }
  }
  
  return parts.join(' ');
}

/**
 * Internal log function.
 *
 * @param level - Log level
 * @param message - Log message
 * @param context - Optional additional context
 * @param error - Optional error object
 */
function log(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context: { ...globalContext, ...context },
    error: error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : undefined,
  };

  const formatted = formatLogEntry(entry);

  // Use appropriate console method based on level
  switch (level) {
    case LogLevel.DEBUG:
      if (__DEV__) {
        console.debug(formatted);
      }
      break;
    case LogLevel.INFO:
      console.log(formatted);
      break;
    case LogLevel.WARN:
      console.warn(formatted);
      break;
    case LogLevel.ERROR:
      console.error(formatted);
      break;
  }
}

/**
 * Logs a debug message.
 * Only logs in development mode.
 *
 * @param message - Message to log
 * @param context - Optional additional context
 */
export function debug(message: string, context?: LogContext): void {
  log(LogLevel.DEBUG, message, context);
}

/**
 * Logs an info message.
 *
 * @param message - Message to log
 * @param context - Optional additional context
 */
export function info(message: string, context?: LogContext): void {
  log(LogLevel.INFO, message, context);
}

/**
 * Logs a warning message.
 *
 * @param message - Message to log
 * @param context - Optional additional context
 */
export function warn(message: string, context?: LogContext): void {
  log(LogLevel.WARN, message, context);
}

/**
 * Logs an error message.
 *
 * @param message - Message to log
 * @param error - Error object
 * @param context - Optional additional context
 */
export function error(message: string, error?: Error, context?: LogContext): void {
  log(LogLevel.ERROR, message, context, error);
}

