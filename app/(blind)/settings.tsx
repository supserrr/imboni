import { StyleSheet, TouchableOpacity, View, Text, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { signOut } from '@/lib/auth';
import { router } from 'expo-router';

export default function Settings() {
  const handleSignOut = async () => {
    await signOut();
    // Auth listener in RootLayout will handle redirect
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Settings</ThemedText>
      
      <View style={styles.section}>
        <ThemedText type="subtitle">Account</ThemedText>
        <TouchableOpacity style={styles.button} onPress={handleSignOut}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  section: {
    marginTop: 40,
  },
  button: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

