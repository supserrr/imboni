import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAIState } from '../context/AIStateContext';
import { playStateSound } from '../utils/ElevenLabsAudio';

interface AIButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Large central button component for triggering AI voice queries in Live Mode.
 * Handles haptics and state changes.
 */
export function AIButton({ onPress, disabled = false }: AIButtonProps) {
  const { state, dispatch } = useAIState();

  const handlePress = async () => {
    if (disabled || state !== 'idle') return;

    // Trigger haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Play listening sound
    await playStateSound('listening');

    // Set state to listening
    dispatch({ type: 'SET_LISTENING' });

    // Call the onPress handler
    onPress();
  };

  const getButtonText = () => {
    switch (state) {
      case 'idle':
        return 'Press to Ask';
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Processing...';
      case 'speaking':
        return 'Speaking...';
      case 'lowConfidence':
        return 'Requesting Help...';
      default:
        return 'Press to Ask';
    }
  };

  const getButtonColor = () => {
    switch (state) {
      case 'idle':
        return '#007AFF';
      case 'listening':
        return '#34C759';
      case 'processing':
        return '#FF9500';
      case 'speaking':
        return '#5856D6';
      case 'lowConfidence':
        return '#FF3B30';
      default:
        return '#007AFF';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: getButtonColor() }, disabled && styles.disabled]}
      onPress={handlePress}
      disabled={disabled || state !== 'idle'}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        <Text style={styles.buttonText}>{getButtonText()}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});

