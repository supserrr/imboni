import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import CameraView from '@/components/blind/CameraView';
import HelpRequestModal from '@/components/blind/HelpRequestModal';
import CallInterface from '@/components/blind/CallInterface';
import { useTTS } from '@/hooks/use-tts';
import { analyzeImage } from '@/lib/bentoml-api';
import { useHelpRequest } from '@/hooks/use-help-request';

export default function LiveScreen() {
  const { speak, stop } = useTTS();
  const { createRequest, activeRequest } = useHelpRequest();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [inCall, setInCall] = useState(false);

  useEffect(() => {
      speak("Camera ready. Tap the bottom button to take a picture.");
  }, []);

  useEffect(() => {
      if (activeRequest && activeRequest.status === 'accepted' && activeRequest.assigned_volunteer) {
          // Transition to call
          speak("A volunteer has accepted your request. Connecting now.");
          setInCall(true);
      }
  }, [activeRequest]);

  const handleSnap = async (base64: string) => {
    try {
      setIsProcessing(true);
      speak("Processing image...");
      
      const result = await analyzeImage(base64);
      
      setIsProcessing(false);
      
      if (result.confidence > 0.7) {
        speak(result.description);
      } else {
        speak("I'm not fully sure what this is. Would you like to connect to a volunteer?");
        setShowHelpModal(true);
      }
    } catch (error) {
      setIsProcessing(false);
      speak("Sorry, I couldn't analyze the image. Please try again.");
    }
  };

  const handleRequestHelp = async () => {
      setShowHelpModal(false);
      speak("Searching for a volunteer...");
      try {
          await createRequest();
      } catch (e) {
          speak("Error creating request.");
      }
  };

  const handleEndCall = () => {
      setInCall(false);
      speak("Call ended.");
  };

  if (inCall && activeRequest) {
      return <CallInterface sessionId={activeRequest.id} onEndCall={handleEndCall} />;
  }

  return (
    <View style={styles.container}>
      <CameraView onSnap={handleSnap} isProcessing={isProcessing} />
      
      <HelpRequestModal 
        visible={showHelpModal} 
        onYes={handleRequestHelp} 
        onNo={() => setShowHelpModal(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

