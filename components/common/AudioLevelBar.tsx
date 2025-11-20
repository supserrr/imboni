import { View, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';

interface AudioLevelBarProps {
  stream?: MediaStream | null;
  height?: number;
  barCount?: number;
}

/**
 * Visual audio level indicator component.
 * Displays audio input levels as animated bars for haptic/audio guidance.
 */
export default function AudioLevelBar({ 
  stream, 
  height = 40, 
  barCount = 5 
}: AudioLevelBarProps) {
  const [levels, setLevels] = useState<number[]>(new Array(barCount).fill(0));

  useEffect(() => {
    if (!stream) {
      setLevels(new Array(barCount).fill(0));
      return;
    }

    // Get audio tracks from stream
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      setLevels(new Array(barCount).fill(0));
      return;
    }

    // For React Native WebRTC, we'd need to use AudioContext or similar
    // This is a simplified version that simulates audio levels
    // In a real implementation, you'd analyze the audio stream
    const interval = setInterval(() => {
      // Simulate audio levels (0-1)
      const newLevels = Array.from({ length: barCount }, () => Math.random() * 0.7);
      setLevels(newLevels);
    }, 100);

    return () => clearInterval(interval);
  }, [stream, barCount]);

  return (
    <View style={[styles.container, { height }]}>
      {levels.map((level, index) => (
        <View
          key={index}
          style={[
            styles.bar,
            {
              height: height * level,
              backgroundColor: level > 0.5 ? '#bf6f4a' : '#141414',
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  bar: {
    width: 4,
    minHeight: 2,
    borderRadius: 2,
    backgroundColor: '#8E8E93',
  },
});

