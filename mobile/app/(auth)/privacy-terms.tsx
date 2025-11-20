import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '../../constants/theme';

export default function PrivacyTerms() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userType = params.userType as string;

  const handleAgree = () => {
    // Proceed to permissions screen
    router.push({
      pathname: '/(auth)/permissions',
      params: { userType, acceptedTerms: 'true' }
    });
  };

  const openTerms = () => {
    Linking.openURL('https://imboni.app/terms');
  };

  const openPrivacy = () => {
    Linking.openURL('https://imboni.app/privacy');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back to Imboni"
      >
        <Ionicons name="chevron-back" size={24} color={BrandColors.darkBrown} />
        <Text style={styles.backText}>Imboni</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Privacy and Terms</Text>
        <Text style={styles.subtitle}>To use Imboni, you agree to the following:</Text>

        {/* Point 1 */}
        <View style={styles.point}>
          <View style={styles.iconContainer}>
            <Ionicons name="walk" size={28} color={BrandColors.lightBrown} />
          </View>
          <Text style={styles.pointText}>
            I will not use Imboni as a mobility device.
          </Text>
        </View>

        {/* Point 2 */}
        <View style={styles.point}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={28} color={BrandColors.lightBrown} />
          </View>
          <Text style={styles.pointText}>
            The data, videos, images, and personal information I submit to Imboni may be stored and processed in the U.S.A.
          </Text>
        </View>

        {/* Links */}
        <TouchableOpacity 
          style={styles.linkButton}
          onPress={openTerms}
          accessibilityRole="link"
          accessibilityLabel="Terms of Service"
        >
          <Text style={styles.linkText}>Terms of Service</Text>
          <Ionicons name="open-outline" size={20} color={BrandColors.darkBrown} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.linkButton}
          onPress={openPrivacy}
          accessibilityRole="link"
          accessibilityLabel="Privacy Policy"
        >
          <Text style={styles.linkText}>Privacy Policy</Text>
          <Ionicons name="open-outline" size={20} color={BrandColors.darkBrown} />
        </TouchableOpacity>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomContainer}>
        <Text style={styles.disclaimer}>
          By clicking 'I agree', I agree to everything above and accept the Terms of Service and Privacy Policy.
        </Text>

        <TouchableOpacity
          style={styles.agreeButton}
          onPress={handleAgree}
          accessibilityRole="button"
          accessibilityLabel="I agree"
        >
          <Text style={styles.agreeButtonText}>I agree</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.lavender,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  backText: {
    color: BrandColors.darkBrown,
    fontSize: 17,
    marginLeft: 5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: BrandColors.darkBrown,
    marginBottom: 20,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 17,
    color: BrandColors.darkBrown,
    marginBottom: 30,
  },
  point: {
    flexDirection: 'row',
    marginBottom: 25,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BrandColors.white,
    borderWidth: 2,
    borderColor: BrandColors.darkBrown,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: BrandColors.darkBrown,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  pointText: {
    flex: 1,
    fontSize: 17,
    color: BrandColors.darkBrown,
    lineHeight: 24,
    paddingTop: 8,
  },
  linkButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: BrandColors.white,
    borderWidth: 2,
    borderColor: BrandColors.darkBrown,
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: BrandColors.darkBrown,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  linkText: {
    fontSize: 17,
    color: BrandColors.darkBrown,
    fontWeight: '500',
  },
  spacer: {
    height: 20,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: BrandColors.lavender,
    borderTopWidth: 1,
    borderTopColor: 'rgba(92, 58, 58, 0.1)',
  },
  disclaimer: {
    fontSize: 14,
    color: BrandColors.lightBrown,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  agreeButton: {
    backgroundColor: BrandColors.darkBrown,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agreeButtonText: {
    color: BrandColors.lavender,
    fontSize: 17,
    fontWeight: '600',
  },
});

