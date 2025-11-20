import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, Text, Alert, ActivityIndicator, Switch, ScrollView } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useAuth } from '../../context/AuthProvider';
import { UserService } from '../../services/user';
import { UserProfile } from '../../types/user';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';

export default function VolunteerHome() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Bottom sheet for training
  const trainingBottomSheetRef = useRef<BottomSheet>(null);
  const trainingSnapPoints = useMemo(() => ['70%', '85%'], []);

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

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.8}
        pressBehavior="close"
      />
    ),
    []
  );

  const CustomBackground = ({ style }: any) => (
    <BlurView
      intensity={dark ? 100 : 80}
      tint={dark ? 'dark' : 'light'}
      style={[
        style, 
        { 
          borderTopLeftRadius: 20, 
          borderTopRightRadius: 20, 
          overflow: 'hidden',
          backgroundColor: dark ? 'transparent' : 'rgba(255, 255, 255, 0.9)'
        }
      ]}
    />
  );

  const styles = createStyles(colors, dark);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.volunteerContainer, { paddingBottom: insets.bottom + 80 }]}
        >
        {/* Availability Toggle Row */}
        <View style={styles.availabilitySection}>
          <View style={[styles.availabilityRow, { 
            backgroundColor: colors.text,
            borderBottomColor: dark ? 'rgba(92, 58, 58, 0.2)' : 'rgba(232, 212, 232, 0.2)'
          }]}>
            <View style={styles.availabilityContent}>
              <Text style={[styles.availabilityTitle, { color: colors.background }]}>
                Availability
              </Text>
              <Text style={[styles.availabilitySubtitle, { 
                color: dark ? 'rgba(92, 58, 58, 0.7)' : 'rgba(232, 212, 232, 0.7)' 
              }]}>
                {userProfile?.availability ? 'You are available' : 'You are unavailable'}
              </Text>
            </View>
            <Switch
              value={userProfile?.availability}
              onValueChange={toggleAvailability}
              trackColor={{ false: '#000000', true: colors.background }}
              thumbColor='#FFFFFF'
              ios_backgroundColor='#000000'
            />
          </View>
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
                {userProfile?.history_count || 0}
              </Text>
              <Text style={[styles.statLabel, { color: dark ? colors.background : colors.secondary }]}>Calls Answered</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: dark ? 'rgba(92, 58, 58, 0.4)' : 'rgba(92, 58, 58, 0.1)' }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: dark ? colors.background : colors.text }]}>
                {userProfile?.rating?.toFixed(1) || '0.0'}
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
            {userProfile?.full_name || 'Volunteer'}
          </Text>
          <Text style={[styles.profileDetail, { color: dark ? colors.background : colors.secondary }]}>
            Member since {new Date(userProfile?.created_at || Date.now()).toLocaleDateString('en-US', { 
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
              {userProfile?.preferred_language?.toUpperCase() || 'EN'}
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
          onPress={() => trainingBottomSheetRef.current?.expand()}
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
            {userProfile?.availability 
              ? 'You will receive a notification when someone needs your help.'
              : 'Turn on availability to receive help requests.'}
          </Text>
        </View>
      </ScrollView>

      {/* Training Bottom Sheet */}
      <BottomSheet
        ref={trainingBottomSheetRef}
        index={-1}
        snapPoints={trainingSnapPoints}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        backgroundComponent={CustomBackground}
        handleIndicatorStyle={{ backgroundColor: dark ? '#C4A4C4' : '#8B6B6B' }}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.bottomSheetHeader}>
            <TouchableOpacity 
              onPress={() => trainingBottomSheetRef.current?.close()}
              style={styles.cancelButton}
            >
              <Text style={[styles.cancelText, { color: dark ? colors.primary : '#5C3A3A' }]}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bottomSheetScroll} showsVerticalScrollIndicator={false}>
            <Text style={[styles.trainingTitle, { color: dark ? '#FFFFFF' : '#2C1A1A' }]}>
              How to answer a Imboni call
            </Text>

            <Text style={[styles.trainingDescription, { color: dark ? 'rgba(255,255,255,0.8)' : '#5C3A3A' }]}>
              Help blind users see through video calls. You'll see their camera view and speak in your set language.
            </Text>

            {/* Receiving a call */}
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: dark ? 'rgba(92, 58, 58, 0.3)' : 'rgba(92, 58, 58, 0.15)' }]}>
                <Ionicons name="videocam" size={28} color={dark ? '#C4A4C4' : '#5C3A3A'} />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: dark ? '#FFFFFF' : '#2C1A1A' }]}>
                  Receiving a call
                </Text>
                <Text style={[styles.featureDescription, { color: dark ? 'rgba(255,255,255,0.7)' : '#5C3A3A' }]}>
                  Get a notification with ringtone. Tap to answer.
                </Text>
              </View>
            </View>

            {/* Flashlight */}
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: dark ? 'rgba(92, 58, 58, 0.3)' : 'rgba(92, 58, 58, 0.15)' }]}>
                <Ionicons name="flashlight" size={28} color={dark ? '#C4A4C4' : '#5C3A3A'} />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: dark ? '#FFFFFF' : '#2C1A1A' }]}>
                  Flashlight
                </Text>
                <Text style={[styles.featureDescription, { color: dark ? 'rgba(255,255,255,0.7)' : '#5C3A3A' }]}>
                  Turn on the caller's flashlight for better visibility.
                </Text>
              </View>
            </View>

            {/* Snapshot */}
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: dark ? 'rgba(92, 58, 58, 0.3)' : 'rgba(92, 58, 58, 0.15)' }]}>
                <Ionicons name="camera" size={28} color={dark ? '#C4A4C4' : '#5C3A3A'} />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: dark ? '#FFFFFF' : '#2C1A1A' }]}>
                  Snapshot
                </Text>
                <Text style={[styles.featureDescription, { color: dark ? 'rgba(255,255,255,0.7)' : '#5C3A3A' }]}>
                  Capture a still image to zoom or stabilize the view.
                </Text>
              </View>
            </View>

            {/* Try it out */}
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: dark ? 'rgba(92, 58, 58, 0.3)' : 'rgba(92, 58, 58, 0.15)' }]}>
                <Ionicons name="lock-closed" size={28} color={dark ? '#C4A4C4' : '#5C3A3A'} />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: dark ? '#FFFFFF' : '#2C1A1A' }]}>
                  Try it out
                </Text>
                <Text style={[styles.featureDescription, { color: dark ? 'rgba(255,255,255,0.7)' : '#5C3A3A' }]}>
                  Lock your phone to get a test call with a training video.
                </Text>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </BottomSheetView>
      </BottomSheet>
    </View>
    </GestureHandlerRootView>
  );
}

function createStyles(colors: any, dark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollView: {
      flex: 1,
    },
    volunteerContainer: {
      padding: 20,
      paddingTop: 85,
    },
    availabilitySection: {
      marginBottom: 20,
      borderRadius: 12,
      overflow: 'hidden',
    },
    availabilityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderBottomWidth: 0.5,
    },
    availabilityContent: {
      flex: 1,
      marginRight: 16,
    },
    availabilityTitle: {
      fontSize: 17,
      marginBottom: 4,
      fontWeight: '600',
    },
    availabilitySubtitle: {
      fontSize: 15,
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
    bottomSheetContent: {
      flex: 1,
      paddingHorizontal: 20,
    },
    bottomSheetHeader: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingTop: 10,
      paddingBottom: 10,
    },
    cancelButton: {
      padding: 8,
    },
    cancelText: {
      fontSize: 17,
      fontWeight: '600',
    },
    bottomSheetScroll: {
      flex: 1,
    },
    trainingTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 15,
      textAlign: 'center',
    },
    trainingDescription: {
      fontSize: 16,
      lineHeight: 22,
      marginBottom: 30,
      textAlign: 'center',
    },
    featureItem: {
      flexDirection: 'row',
      marginBottom: 30,
    },
    featureIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    featureContent: {
      flex: 1,
      justifyContent: 'center',
    },
    featureTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 6,
    },
    featureDescription: {
      fontSize: 15,
      lineHeight: 20,
    },
  });
}

