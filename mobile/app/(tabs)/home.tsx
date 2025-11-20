import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Platform, ScrollView, ActivityIndicator, Switch } from 'react-native';
import CameraComponent, { CameraComponentRef } from '../../components/CameraView';
import { useTranslation } from 'react-i18next';
import { useIsFocused, useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { BentoMLService } from '../../services/bentoml';
import * as Speech from 'expo-speech';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthProvider';
import { UserService } from '../../services/user';
import { UserProfile } from '../../types/user';
import { Ionicons } from '@expo/vector-icons';

export default function Home() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const cameraRef = useRef<CameraComponentRef>(null);
  const { t, i18n } = useTranslation();
  const isFocused = useIsFocused();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, dark } = useTheme();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(1.0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        const profile = await UserService.getProfile(user.id);
        setUserProfile(profile);
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const toggleAvailability = async () => {
    if (!user?.id || !userProfile) return;
    
    try {
      const newAvailability = !userProfile.availability;
      await UserService.setAvailability(user.id, newAvailability);
      setUserProfile({ ...userProfile, availability: newAvailability });
    } catch (error) {
      Alert.alert('Error', 'Failed to update availability');
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const analyzeFrame = async () => {
      if (cameraRef.current && !isProcessing) {
         setIsProcessing(true);
         const uri = await cameraRef.current.takePicture();
         
         if (uri) {
           try {
             const result = await BentoMLService.analyzeImage(uri);
             setAnalysisResult(result.description);
             setConfidence(result.confidence);

             Speech.speak(result.description, {
               language: i18n.language,
               onDone: () => setIsProcessing(false),
             });
             
            if (result.confidence < 0.6) {
              setIsAnalyzing(false);
              Speech.stop();
              Speech.speak("I'm not sure what I'm seeing. Connecting you to a human helper...", { language: i18n.language });
              
              Alert.alert(
                "Low Confidence",
                "I'm not sure what I'm seeing. We'll connect you to a human volunteer helper soon.",
                [
                  { text: "Cancel", onPress: () => setIsAnalyzing(true) },
                  { text: "Get Help", onPress: () => {
                    // TODO: Implement volunteer matching and video call
                    Alert.alert("Coming Soon", "Volunteer connection feature will be available soon.");
                    setIsAnalyzing(true);
                  }}
                ]
              );
            }

           } catch (e: any) {
             console.error("Analysis error", e);
             setIsAnalyzing(false);
             setIsProcessing(false);
             
             const errorMessage = e.message?.includes('404') 
               ? 'AI backend is not available. Please make sure the BentoML service is running.'
               : 'Failed to analyze image. Please try again.';
             
             Alert.alert('Analysis Error', errorMessage, [
               { text: 'OK' }
             ]);
           } finally {
             setIsProcessing(false);
           }
         } else {
           setIsProcessing(false);
         }
      }
    };

    if (isFocused && isAnalyzing) {
      analyzeFrame(); 
      interval = setInterval(analyzeFrame, 5000); 
    } else {
      Speech.stop();
    }

    return () => {
      clearInterval(interval);
      Speech.stop();
    };
  }, [isFocused, isAnalyzing, isProcessing, i18n.language]);

  const toggleAnalysis = () => {
    setIsAnalyzing(!isAnalyzing);
  };

  const styles = createStyles(colors, dark);

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Volunteer Home Screen
  if (userProfile?.type === 'volunteer') {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.volunteerContainer}>
          {/* Header */}
          <View style={styles.volunteerHeader}>
            <Text style={[styles.volunteerTitle, { color: colors.text }]}>
              {userProfile.availability ? 'You are available' : 'You are unavailable'}
            </Text>
            <Switch
              value={userProfile.availability}
              onValueChange={toggleAvailability}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={userProfile.availability ? colors.background : '#f4f3f4'}
            />
          </View>

          {/* Stats Card */}
          <View style={[styles.statsCard, { 
            backgroundColor: colors.card,
            borderWidth: 2,
            borderColor: colors.border,
          }]}>
            <Ionicons name="globe-outline" size={80} color={dark ? colors.background : colors.primary} />
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: dark ? colors.background : colors.text }]}>
                  {userProfile.history_count || 0}
                </Text>
                <Text style={[styles.statLabel, { color: dark ? colors.background : colors.secondary }]}>Calls Answered</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: dark ? 'rgba(92, 58, 58, 0.4)' : 'rgba(92, 58, 58, 0.1)' }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: dark ? colors.background : colors.text }]}>
                  {userProfile.rating?.toFixed(1) || '0.0'}
                </Text>
                <Text style={[styles.statLabel, { color: dark ? colors.background : colors.secondary }]}>Rating</Text>
              </View>
            </View>
          </View>

          {/* Profile Info */}
          <View style={[styles.profileCard, { 
            backgroundColor: colors.card,
            borderWidth: 2,
            borderColor: colors.border,
          }]}>
            <Text style={[styles.profileName, { color: dark ? colors.background : colors.text }]}>
              {userProfile.full_name || 'Volunteer'}
            </Text>
            <Text style={[styles.profileDetail, { color: dark ? colors.background : colors.secondary }]}>
              Member since {new Date(userProfile.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            <View style={[styles.languageBadge, { 
              backgroundColor: colors.background,
              borderWidth: 2,
              borderColor: colors.border,
            }]}>
              <Text style={[styles.languageText, { color: dark ? colors.card : colors.text }]}>
                {userProfile.preferred_language?.toUpperCase() || 'EN'}
              </Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.learnButton, { 
              backgroundColor: dark ? colors.background : colors.primary,
              borderWidth: 2,
              borderColor: dark ? colors.border : colors.primary,
            }]}
            onPress={() => Alert.alert('Coming Soon', 'Training materials will be available soon.')}
            accessibilityRole="button"
            accessibilityLabel="Learn to answer a call"
          >
            <Text style={[styles.learnButtonText, { color: dark ? colors.card : colors.background }]}>
              Learn to answer a call
            </Text>
          </TouchableOpacity>

          {/* Notification Info */}
          <View style={[styles.infoCard, { 
            backgroundColor: colors.card,
            borderWidth: 2,
            borderColor: colors.border,
          }]}>
            <Text style={[styles.infoText, { color: dark ? colors.background : colors.secondary }]}>
              {userProfile.availability 
                ? 'You will receive a notification when someone needs your help.'
                : 'Turn on availability to receive help requests.'}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Blind User Home Screen (Camera View)
  return (
    <View style={styles.container}>
      <CameraComponent ref={cameraRef} onCapture={(uri) => console.log('Captured:', uri)} />
      
      <View style={[styles.overlay, { bottom: insets.bottom + 100 }]}>
        {analysisResult && (
          <BlurView intensity={80} tint={dark ? 'dark' : 'light'} style={styles.resultContainer}>
             <Text style={styles.resultText}>{analysisResult}</Text>
             <Text style={styles.confidenceText}>
               {confidence < 1 ? `Confidence: ${(confidence * 100).toFixed(0)}%` : ''}
             </Text>
          </BlurView>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.analyzeButton, isAnalyzing && styles.analyzingButton]} 
            onPress={toggleAnalysis}
            accessibilityRole="button"
            accessibilityLabel={isAnalyzing ? "Stop Analysis" : "Start AI"}
          >
            <Text style={styles.buttonText}>{isAnalyzing ? "Stop AI" : "Start AI"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: any, dark: boolean) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Volunteer Styles
  volunteerContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  volunteerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  volunteerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsCard: {
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 15,
  },
  statDivider: {
    width: 1,
    marginHorizontal: 20,
  },
  profileCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  profileDetail: {
    fontSize: 15,
    marginBottom: 15,
  },
  languageBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  learnButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  learnButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  infoCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Camera View Styles (for blind users)
  overlay: {
    position: 'absolute',
    left: 30,
    right: 30,
    alignItems: 'center',
  },
  resultContainer: {
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    width: '100%',
    minHeight: 80,
    justifyContent: 'center',
    overflow: 'hidden',
      backgroundColor: Platform.OS === 'android' ? (dark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)') : undefined,
  },
  resultText: {
      color: dark ? 'white' : colors.text,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  confidenceText: {
      color: dark ? '#ccc' : '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  buttonContainer: {
    width: '100%',
  },
  analyzeButton: {
      backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  analyzingButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: colors.background,
    fontSize: 17,
    fontWeight: '600',
  },
});
}
