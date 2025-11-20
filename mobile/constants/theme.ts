/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Brand colors matching auth screens
export const BrandColors = {
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

const tintColorLight = BrandColors.darkBrown;
const tintColorDark = BrandColors.lavender;

export const Colors = {
  light: {
    text: BrandColors.darkBrown,
    background: BrandColors.lavender,
    tint: tintColorLight,
    icon: BrandColors.lightBrown,
    tabIconDefault: BrandColors.lightBrown,
    tabIconSelected: tintColorLight,
    card: BrandColors.white,
    border: BrandColors.lightBrown,
    notification: BrandColors.red,
    primary: BrandColors.darkBrown,
    secondary: BrandColors.lightBrown,
  },
  dark: {
    text: BrandColors.lavender,
    background: BrandColors.darkBrown,
    tint: tintColorDark,
    icon: BrandColors.lightBrown,
    tabIconDefault: BrandColors.lightBrown,
    tabIconSelected: tintColorDark,
    card: BrandColors.lavender,
    border: BrandColors.lightBrown,
    notification: BrandColors.red,
    primary: BrandColors.lavender,
    secondary: BrandColors.lightBrown,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
