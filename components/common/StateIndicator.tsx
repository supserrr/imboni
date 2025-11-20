import { View, StyleSheet, Text } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type AIState = 'idle' | 'listening' | 'processing' | 'speaking' | 'low_confidence';

interface StateIndicatorProps {
  state: AIState;
}

/**
 * Visual indicator component that displays the current AI processing state.
 * Provides feedback for listening, processing, speaking, and low confidence states.
 */
export default function StateIndicator({ state }: StateIndicatorProps) {
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#141414' : '#bf6f4a';
  
  const getStateConfig = () => {
    switch (state) {
      case 'listening':
        return {
          icon: 'waveform',
          label: 'Listening',
          color: '#bf6f4a',
        };
      case 'processing':
        return {
          icon: 'gearshape.fill',
          label: 'Processing',
          color: '#bf6f4a',
        };
      case 'speaking':
        return {
          icon: 'speaker.wave.2.fill',
          label: 'Speaking',
          color: '#bf6f4a',
        };
      case 'low_confidence':
        return {
          icon: 'exclamationmark.triangle.fill',
          label: 'Low Confidence',
          color: '#bf6f4a',
        };
      default:
        return {
          icon: 'circle.fill',
          label: 'Ready',
          color: '#141414',
        };
    }
  };

  const config = getStateConfig();

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.indicator, { backgroundColor: config.color }]}>
        <IconSymbol name={config.icon as any} size={20} color={iconColor} />
      </View>
      <ThemedText style={styles.label}>{config.label}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(20, 20, 20, 0.3)',
  },
  indicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Ubuntu_500Medium',
  },
});

