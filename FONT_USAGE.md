# Ubuntu Font Usage Guide

The Ubuntu font family is now available throughout the Imboni app. This guide shows how to use the different font variants.

## Available Font Variants

The following Ubuntu font variants are loaded and ready to use:

- `Ubuntu_300Light` - Light weight (300)
- `Ubuntu_300Light_Italic` - Light italic
- `Ubuntu_400Regular` - Regular weight (400) - **Default**
- `Ubuntu_400Regular_Italic` - Regular italic
- `Ubuntu_500Medium` - Medium weight (500)
- `Ubuntu_500Medium_Italic` - Medium italic
- `Ubuntu_700Bold` - Bold weight (700)
- `Ubuntu_700Bold_Italic` - Bold italic

## Usage Examples

### Basic Usage

```tsx
import { Text } from 'react-native';

// Regular text
<Text style={{ fontFamily: 'Ubuntu_400Regular' }}>
  Regular text
</Text>

// Bold text
<Text style={{ fontFamily: 'Ubuntu_700Bold' }}>
  Bold text
</Text>

// Medium italic
<Text style={{ fontFamily: 'Ubuntu_500Medium_Italic' }}>
  Medium italic text
</Text>
```

### With StyleSheet

```tsx
import { Text, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Ubuntu_700Bold',
    fontSize: 24,
  },
  body: {
    fontFamily: 'Ubuntu_400Regular',
    fontSize: 16,
  },
  emphasis: {
    fontFamily: 'Ubuntu_500Medium_Italic',
    fontSize: 16,
  },
});

<Text style={styles.title}>Title</Text>
<Text style={styles.body}>Body text</Text>
<Text style={styles.emphasis}>Emphasized text</Text>
```

### Recommended Font Weights

- **Titles/Headers**: `Ubuntu_700Bold` or `Ubuntu_500Medium`
- **Body Text**: `Ubuntu_400Regular`
- **Subtle Text**: `Ubuntu_300Light`
- **Emphasis**: `Ubuntu_500Medium_Italic` or `Ubuntu_400Regular_Italic`

## Notes

- Fonts are loaded asynchronously on app startup
- The splash screen is shown until fonts are ready
- If a font variant is not specified, the system default font will be used
- All font variants are bundled with the app, so they work offline

