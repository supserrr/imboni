import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface AudioLevelBarProps {
  level: number; // 0-1 range
  color?: string;
}

/**
 * Visual bar component for microphone input level.
 * Optional component for low-vision users.
 */
export function AudioLevelBar({ level, color = '#34C759' }: AudioLevelBarProps) {
  const [animatedWidth] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: level,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [level, animatedWidth]);

  const width = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            { width, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 4,
    paddingHorizontal: 20,
  },
  track: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});

