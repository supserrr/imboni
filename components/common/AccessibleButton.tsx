import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from 'react-native';
import * as Haptics from 'expo-haptics';

interface AccessibleButtonProps extends TouchableOpacityProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export default function AccessibleButton({ label, onPress, variant = 'primary', style, ...props }: AccessibleButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.button, styles[variant], style]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label}
      activeOpacity={0.8}
      {...props}
    >
      <Text style={[styles.text, variant === 'secondary' && styles.textSecondary]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56, // Accessible target size
  },
  primary: {
    backgroundColor: '#007AFF',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  danger: {
    backgroundColor: '#FF3B30',
  },
  text: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  textSecondary: {
    color: '#007AFF',
  },
});

