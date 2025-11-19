import { useState } from 'react';
import { View, TextInput, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { signUp } from '@/lib/auth';
import { Link, router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [type, setType] = useState<'blind' | 'volunteer'>('blind');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    const { error } = await signUp(email, password, type);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Please check your email for confirmation.', [
          { text: 'OK', onPress: () => router.replace('/login') }
      ]);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Create Account</ThemedText>
      
      <View style={styles.typeContainer}>
        <TouchableOpacity 
          style={[styles.typeButton, type === 'blind' && styles.activeType]} 
          onPress={() => setType('blind')}
          accessibilityRole="radio"
          accessibilityState={{ checked: type === 'blind' }}
        >
          <Text style={[styles.typeText, type === 'blind' && styles.activeTypeText]}>I need help</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.typeButton, type === 'volunteer' && styles.activeType]} 
          onPress={() => setType('volunteer')}
          accessibilityRole="radio"
          accessibilityState={{ checked: type === 'volunteer' }}
        >
          <Text style={[styles.typeText, type === 'volunteer' && styles.activeTypeText]}>I want to help</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        placeholderTextColor="#888"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#888"
      />

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleRegister} 
        disabled={loading}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Sign Up'}</Text>
      </TouchableOpacity>

      <Link href="/login" asChild>
        <TouchableOpacity style={styles.linkButton}>
          <ThemedText>Already have an account? Sign In</ThemedText>
        </TouchableOpacity>
      </Link>
    </ThemedView>
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
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  typeButton: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
  },
  activeType: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeText: {
    fontSize: 16,
    color: '#000',
  },
  activeTypeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#000'
  },
  button: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
});

