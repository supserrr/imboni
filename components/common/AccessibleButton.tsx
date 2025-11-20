import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AccessibleButtonProps extends TouchableOpacityProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export default function AccessibleButton({ label, onPress, variant = 'primary', style, ...props }: AccessibleButtonProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const colorScheme = useColorScheme();
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const buttonStyle = variant === 'secondary' 
    ? { backgroundColor: 'transparent', borderColor, borderWidth: 2 }
    : { backgroundColor };

  return (
    <TouchableOpacity
      style={[styles.button, buttonStyle, style]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label}
      activeOpacity={0.8}
      {...props}
    >
      <Text style={[styles.text, { color: textColor }, variant === 'secondary' && { color: textColor }]}>{label}</Text>
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
  text: {
    fontSize: 18,
    fontFamily: 'Ubuntu_700Bold',
  },
});

