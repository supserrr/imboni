/**
 * Helper utility functions for the imboni application.
 */

/**
 * Formats a timestamp into a human-readable string.
 *
 * @param timestamp - The timestamp to format (in milliseconds).
 * @returns Formatted date string.
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Debounces a function call.
 *
 * @param func - The function to debounce.
 * @param wait - The delay in milliseconds.
 * @returns Debounced function.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Clamps a number between min and max values.
 *
 * @param value - The value to clamp.
 * @param min - The minimum value.
 * @param max - The maximum value.
 * @returns Clamped value.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Sleeps for a specified number of milliseconds.
 *
 * @param ms - The number of milliseconds to sleep.
 * @returns Promise that resolves after the delay.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

