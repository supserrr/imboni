import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Platform } from 'react-native';
import CameraComponent, { CameraComponentRef } from '../../components/CameraView';
import { useTranslation } from 'react-i18next';
import { useIsFocused, useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { BentoMLService } from '../../services/bentoml';
import * as Speech from 'expo-speech';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Home() {
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
