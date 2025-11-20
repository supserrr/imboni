import { StyleSheet, TouchableOpacity, View, Text, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { signOut } from '@/lib/auth';
import { router } from 'expo-router';

export default function Settings() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  
  const handleSignOut = async () => {
    await signOut();
    // Auth listener in RootLayout will handle redirect
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Settings</ThemedText>
      
      <View style={styles.section}>
        <ThemedText type="subtitle">Account</ThemedText>
        <TouchableOpacity style={[styles.button, { backgroundColor }]} onPress={handleSignOut}>
          <Text style={[styles.buttonText, { color: textColor }]}>Sign Out</Text>
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
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Ubuntu_700Bold',
  },
});

