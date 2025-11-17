import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Privacy and Terms agreement screen component.
 */
export default function PrivacyScreen() {
  const router = useRouter();
  const { profile } = useAuth();

  /**
   * Handles agreement and navigation to main app.
   */
  const handleAgree = () => {
    if (profile) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/login');
    }
  };

  /**
   * Opens external links.
   *
   * @param url - URL to open
   */
  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Privacy and Terms</Text>
          <Text style={styles.intro}>
            To use Imboni, you agree to the following:
          </Text>

          <View style={styles.agreementItems}>
            <View style={styles.agreementItem}>
              <Text style={styles.agreementIcon}>🚶</Text>
              <Text style={styles.agreementText}>
                I will not use Imboni as a mobility device.
              </Text>
            </View>

            <View style={styles.agreementItem}>
              <Text style={styles.agreementIcon}>📹</Text>
              <Text style={styles.agreementText}>
                Imboni can record, review, and share videos and images for safety, quality, and as
                further described in the Privacy Policy.
              </Text>
            </View>

            <View style={styles.agreementItem}>
              <Text style={styles.agreementIcon}>🔒</Text>
              <Text style={styles.agreementText}>
                The data, videos, images, and personal information I submit to Imboni may be stored
                and processed in various locations as described in the Privacy Policy.
              </Text>
            </View>
          </View>

          <View style={styles.linksContainer}>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => openLink('https://example.com/terms')}>
              <Text style={styles.linkText}>Terms of Service</Text>
              <Text style={styles.linkArrow}>↗</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => openLink('https://example.com/privacy')}>
              <Text style={styles.linkText}>Privacy Policy</Text>
              <Text style={styles.linkArrow}>↗</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.finalStatement}>
            By clicking 'I agree', I agree to everything above and accept the Terms of Service and
            Privacy Policy.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.agreeButton} onPress={handleAgree}>
          <Text style={styles.agreeButtonText}>I agree</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  intro: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 32,
    lineHeight: 22,
  },
  agreementItems: {
    gap: 24,
    marginBottom: 32,
  },
  agreementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  agreementIcon: {
    fontSize: 32,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a1a1a',
    textAlign: 'center',
    lineHeight: 48,
  },
  agreementText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  linksContainer: {
    gap: 16,
    marginBottom: 32,
  },
  linkButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  linkText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  linkArrow: {
    fontSize: 18,
    color: '#007AFF',
  },
  finalStatement: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  agreeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  agreeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

