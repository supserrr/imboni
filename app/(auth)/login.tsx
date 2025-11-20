import { useState } from 'react';
import { View, TextInput, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signIn } from '@/lib/auth';
import { Link, router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
        // Redirect handled by root layout listener usually, 
        // but we can also manually push if needed, though listener is better.
        // router.replace('/'); 
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Welcome Back</ThemedText>
      
      <TextInput
        style={[styles.input, { backgroundColor, color: textColor, borderColor }]}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        placeholderTextColor={colorScheme === 'dark' ? '#bf6f4a' : '#141414'}
      />
      
      <TextInput
        style={[styles.input, { backgroundColor, color: textColor, borderColor }]}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={colorScheme === 'dark' ? '#bf6f4a' : '#141414'}
      />

      <TouchableOpacity 
        style={[styles.button, { backgroundColor }]} 
        onPress={handleLogin} 
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Sign In"
      >
        <Text style={[styles.buttonText, { color: textColor }]}>{loading ? 'Signing in...' : 'Sign In'}</Text>
      </TouchableOpacity>

      <Link href="/register" asChild>
        <TouchableOpacity style={styles.linkButton}>
          <ThemedText>Don't have an account? Sign Up</ThemedText>
        </TouchableOpacity>
      </Link>
    </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: 'Ubuntu_400Regular',
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Ubuntu_700Bold',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
});

