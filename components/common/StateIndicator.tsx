import { View, StyleSheet, Text } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export type AIState = 'idle' | 'listening' | 'processing' | 'speaking' | 'low_confidence';

interface StateIndicatorProps {
  state: AIState;
}

/**
 * Visual indicator component that displays the current AI processing state.
 * Provides feedback for listening, processing, speaking, and low confidence states.
 */
export default function StateIndicator({ state }: StateIndicatorProps) {
  const getStateConfig = () => {
    switch (state) {
      case 'listening':
        return {
          icon: 'waveform',
          label: 'Listening',
          color: '#007AFF',
        };
      case 'processing':
        return {
          icon: 'gearshape.fill',
          label: 'Processing',
          color: '#FF9500',
        };
      case 'speaking':
        return {
          icon: 'speaker.wave.2.fill',
          label: 'Speaking',
          color: '#34C759',
        };
      case 'low_confidence':
        return {
          icon: 'exclamationmark.triangle.fill',
          label: 'Low Confidence',
          color: '#FF3B30',
        };
      default:
        return {
          icon: 'circle.fill',
          label: 'Ready',
          color: '#8E8E93',
        };
    }
  };

  const config = getStateConfig();

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.indicator, { backgroundColor: config.color }]}>
        <IconSymbol name={config.icon as any} size={20} color="white" />
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
    backgroundColor: 'rgba(0,0,0,0.3)',
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
    fontWeight: '600',
  },
});

