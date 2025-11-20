/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// App color palette: #bf6f4a (warm orange) and #141414 (dark)
// Light mode: #141414 text on #bf6f4a background
// Dark mode: #bf6f4a text on #141414 background
export const PRIMARY_COLOR = '#bf6f4a';
export const DARK_COLOR = '#141414';

export const Colors = {
  light: {
    text: DARK_COLOR,
    background: PRIMARY_COLOR,
    tint: DARK_COLOR,
    icon: DARK_COLOR,
    tabIconDefault: DARK_COLOR,
    tabIconSelected: DARK_COLOR,
    cardBackground: PRIMARY_COLOR,
    border: DARK_COLOR,
    secondaryText: DARK_COLOR,
  },
  dark: {
    text: PRIMARY_COLOR,
    background: DARK_COLOR,
    tint: PRIMARY_COLOR,
    icon: PRIMARY_COLOR,
    tabIconDefault: PRIMARY_COLOR,
    tabIconSelected: PRIMARY_COLOR,
    cardBackground: DARK_COLOR,
    border: PRIMARY_COLOR,
    secondaryText: PRIMARY_COLOR,
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
