import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';

interface RatingScreenProps {
  onRate: (rating: number) => void;
  onSkip?: () => void;
}

export default function RatingScreen({ onRate, onSkip }: RatingScreenProps) {
  const { colors, dark } = useTheme();
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const handleSubmit = () => {
    if (selectedRating !== null) {
      onRate(selectedRating);
    }
  };

  const styles = createStyles(colors, dark);

  return (
    <View style={[styles.container, { backgroundColor: dark ? '#000000' : colors.background }]}>
      <View style={styles.content}>
        <Ionicons name="star" size={60} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>
          Rate Your Experience
        </Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          How was your call with the volunteer?
        </Text>

        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <TouchableOpacity
              key={rating}
              onPress={() => setSelectedRating(rating)}
              style={styles.starButton}
            >
              <Ionicons
                name={selectedRating !== null && rating <= selectedRating ? 'star' : 'star-outline'}
                size={50}
                color={selectedRating !== null && rating <= selectedRating ? '#FFD700' : colors.border}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          {onSkip && (
            <TouchableOpacity
              style={[styles.skipButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={onSkip}
            >
              <Text style={[styles.skipButtonText, { color: colors.text }]}>Skip</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: selectedRating !== null ? '#007AFF' : colors.border },
            ]}
            onPress={handleSubmit}
            disabled={selectedRating === null}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
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
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 30,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginTop: 20,
      marginBottom: 10,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 40,
      opacity: 0.8,
    },
    ratingContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      maxWidth: 300,
      marginBottom: 40,
    },
    starButton: {
      padding: 5,
    },
    buttonContainer: {
      width: '100%',
      maxWidth: 400,
      flexDirection: 'row',
      gap: 15,
    },
    skipButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
    },
    skipButtonText: {
      fontSize: 17,
      fontWeight: '600',
    },
    submitButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '600',
    },
  });
}

