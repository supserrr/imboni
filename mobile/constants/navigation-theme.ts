import { DefaultTheme, DarkTheme, Theme } from '@react-navigation/native';
import { Platform } from 'react-native';

const BrandColors = {
  lavender: '#E8D4E8',
  darkBrown: '#5C3A3A',
  lightBrown: '#8B6B6B',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#1C1C1E',
  mediumGray: '#8E8E93',
  lightGray: '#999999',
  red: '#FF3B30',
  blue: '#007AFF',
};

const WEB_FONT_STACK =
  'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';

const systemFonts = Platform.select({
  web: {
    regular: {
      fontFamily: WEB_FONT_STACK,
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: WEB_FONT_STACK,
      fontWeight: '500' as const,
    },
    bold: {
      fontFamily: WEB_FONT_STACK,
      fontWeight: '600' as const,
    },
    heavy: {
      fontFamily: WEB_FONT_STACK,
      fontWeight: '700' as const,
    },
  },
  ios: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '600' as const,
    },
    heavy: {
      fontFamily: 'System',
      fontWeight: '700' as const,
    },
  },
  default: {
    regular: {
      fontFamily: 'sans-serif',
      fontWeight: 'normal' as const,
    },
    medium: {
      fontFamily: 'sans-serif-medium',
      fontWeight: 'normal' as const,
    },
    bold: {
      fontFamily: 'sans-serif',
      fontWeight: '600' as const,
    },
    heavy: {
      fontFamily: 'sans-serif',
      fontWeight: '700' as const,
    },
  },
});

export const LightNavigationTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: BrandColors.darkBrown,
    background: BrandColors.lavender,
    card: BrandColors.white,
    text: BrandColors.darkBrown,
    border: BrandColors.lightBrown,
    notification: BrandColors.red,
  },
  fonts: systemFonts!,
};

export const DarkNavigationTheme: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: BrandColors.lavender,
    background: BrandColors.darkBrown,
    card: BrandColors.lavender,
    text: BrandColors.lavender,
    border: BrandColors.lightBrown,
    notification: BrandColors.red,
  },
  fonts: systemFonts!,
};

export { BrandColors };

