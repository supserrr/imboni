import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { signOut } from '@/lib/auth';
import { router } from 'expo-router';

export default function Settings() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({}, 'cardBackground');
  
  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Volunteer Settings</ThemedText>
      
      <View style={styles.section}>
        <ThemedText type="subtitle">Availability</ThemedText>
        <View style={[styles.availabilityRow, { backgroundColor: cardBackground }]}>
            <ThemedText>Available for calls</ThemedText>
            {/* Toggle switch would go here */}
            <ThemedText style={{color: textColor, fontFamily: 'Ubuntu_700Bold'}}>ON</ThemedText>
        </View>
      </View>

      <View style={styles.section}>
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
  availabilityRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 15,
      padding: 15,
      borderRadius: 8,
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

