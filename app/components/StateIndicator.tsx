import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useAIState } from '../context/AIStateContext';

/**
 * Optional border overlay component to show AI state via colors.
 * States: Listening (green), Processing (orange), Speaking (purple), Low Confidence (red).
 */
export function StateIndicator() {
  const { state } = useAIState();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state !== 'idle') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state, pulseAnim]);

  const getBorderColor = () => {
    switch (state) {
      case 'listening':
        return '#34C759';
      case 'processing':
        return '#FF9500';
      case 'speaking':
        return '#5856D6';
      case 'lowConfidence':
        return '#FF3B30';
      default:
        return 'transparent';
    }
  };

  if (state === 'idle') {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.border,
        {
          borderColor: getBorderColor(),
          opacity: pulseAnim,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 4,
    borderRadius: 0,
  },
});

