import { useThemePreference } from '../context/ThemeContext';

export function useColorScheme() {
  const { resolvedTheme } = useThemePreference();
  return resolvedTheme;
}
