import { AccessibilityRole, AccessibilityState } from 'react-native';

export const getAccessibilityProps = (
  label: string,
  role: AccessibilityRole = 'none',
  state?: AccessibilityState,
  hint?: string
) => ({
  accessible: true,
  accessibilityLabel: label,
  accessibilityRole: role,
  accessibilityState: state,
  accessibilityHint: hint,
});

