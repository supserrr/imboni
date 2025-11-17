import * as Haptics from 'expo-haptics';
import { useAudio } from '../../contexts/AudioContext';

/**
 * Haptic feedback types.
 */
export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * Triggers haptic feedback.
 *
 * @param type - Type of haptic feedback
 */
export function triggerHaptic(type: HapticType = 'medium'): void {
  switch (type) {
    case 'light':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'medium':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'heavy':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    case 'success':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'warning':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
    case 'error':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
  }
}

/**
 * Announces screen content via TTS.
 *
 * @param text - Text to announce
 * @param interrupt - Whether to interrupt current speech
 */
export function announceScreen(text: string, interrupt: boolean = true): void {
  // This will be called from components using useAudio hook
  // Components should use useAudio().playText() directly
  console.log('Screen announcement:', text);
}

/**
 * Gets accessibility label for a button based on its action.
 *
 * @param action - Action description
 * @returns Accessibility label
 */
export function getAccessibilityLabel(action: string): string {
  return `${action}. Double tap to activate.`;
}

/**
 * Gets accessibility hint for navigation.
 *
 * @param destination - Destination screen name
 * @returns Accessibility hint
 */
export function getAccessibilityHint(destination: string): string {
  return `Navigates to ${destination} screen.`;
}

