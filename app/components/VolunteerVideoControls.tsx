import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';

interface VolunteerVideoControlsProps {
  onSnap: () => void;
  onEndCall: () => void;
  onToggleFlash: () => void;
  flashEnabled?: boolean;
}

/**
 * Three-button row component for volunteer video call screen.
 * Contains Snap, End Call, and Flash buttons with colors and state only.
 */
export function VolunteerVideoControls({
  onSnap,
  onEndCall,
  onToggleFlash,
  flashEnabled = false,
}: VolunteerVideoControlsProps) {
  const [snapActive, setSnapActive] = useState(false);
  const snapGlow = new Animated.Value(0);

  const handleSnap = async () => {
    setSnapActive(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Slight glow animation
    Animated.sequence([
      Animated.timing(snapGlow, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(snapGlow, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    onSnap();
    setTimeout(() => setSnapActive(false), 300);
  };

  const handleEndCall = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    // Shake animation
    Animated.sequence([
      Animated.timing(snapGlow, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(snapGlow, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(snapGlow, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();

    onEndCall();
  };

  const handleToggleFlash = async () => {
    await Haptics.selectionAsync();
    onToggleFlash();
  };

  const snapGlowOpacity = snapGlow.interpolate({
    inputRange: [-10, 0, 10],
    outputRange: [0, 1, 0],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.buttonWrapper,
          snapActive && { opacity: snapGlowOpacity },
        ]}
      >
        <TouchableOpacity
          style={[styles.button, styles.snapButton, snapActive && styles.snapActive]}
          onPress={handleSnap}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Snap</Text>
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity
        style={[styles.button, styles.endButton]}
        onPress={handleEndCall}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>End Call</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          styles.flashButton,
          flashEnabled && styles.flashEnabled,
        ]}
        onPress={handleToggleFlash}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Flash</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  buttonWrapper: {
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapButton: {
    backgroundColor: '#34C759',
  },
  snapActive: {
    backgroundColor: '#30D158',
    elevation: 5,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  endButton: {
    backgroundColor: '#FF3B30',
  },
  flashButton: {
    backgroundColor: '#5856D6',
  },
  flashEnabled: {
    backgroundColor: '#AF52DE',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

