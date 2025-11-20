import { TouchableOpacity, StyleSheet, View, ActivityIndicator } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AIButtonProps {
  onPress: () => void;
  isProcessing?: boolean;
  disabled?: boolean;
  size?: number;
}

/**
 * AI analysis button with haptic feedback and sound cues.
 * Provides accessible interaction for triggering AI image analysis.
 */
export default function AIButton({ 
  onPress, 
  isProcessing = false, 
  disabled = false,
  size = 80 
}: AIButtonProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#bf6f4a' : '#141414';
  
  const handlePress = async () => {
    if (disabled || isProcessing) return;

    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Sound cue can be added using expo-audio if needed in the future
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { width: size, height: size, borderRadius: size / 2, backgroundColor },
        (disabled || isProcessing) && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={disabled || isProcessing}
      accessibilityLabel={isProcessing ? 'Processing' : 'Analyze image'}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || isProcessing }}
    >
      {isProcessing ? (
        <ActivityIndicator color={iconColor} size="large" />
      ) : (
        <View style={styles.iconContainer}>
          <IconSymbol name="sparkles" size={size * 0.4} color={iconColor} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#141414',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

