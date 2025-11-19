import { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import CameraView from '@/components/blind/CameraView';
import HelpRequestModal from '@/components/blind/HelpRequestModal';
import CallInterface from '@/components/blind/CallInterface';
import StateIndicator from '@/components/common/StateIndicator';
import AIButton from '@/components/common/AIButton';
import { useTTS } from '@/hooks/use-tts';
import { analyzeImage } from '@/lib/bentoml-api';
import { useHelpRequest } from '@/hooks/use-help-request';
import type { AIState } from '@/components/common/StateIndicator';

export default function LiveScreen() {
  const { speak, stop, isSpeaking } = useTTS();
  const { createRequest, activeRequest } = useHelpRequest();
  
  const [aiState, setAIState] = useState<AIState>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [lastAnalysisTime, setLastAnalysisTime] = useState(0);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isAnalyzingRef = useRef(false);

  const ANALYSIS_INTERVAL = 3000; // Analyze every 3 seconds in auto mode

  useEffect(() => {
      speak("Camera ready. Continuous analysis is active.");
      setAIState('listening');
  }, []);

  useEffect(() => {
      if (activeRequest && activeRequest.status === 'accepted' && activeRequest.assigned_volunteer) {
          // Transition to call
          speak("A volunteer has accepted your request. Connecting now.");
          setInCall(true);
          setAIState('idle');
      }
  }, [activeRequest]);

  useEffect(() => {
      if (isSpeaking) {
          setAIState('speaking');
      } else if (isProcessing) {
          setAIState('processing');
      } else if (aiState === 'speaking' && !isSpeaking) {
          setAIState('listening');
      }
  }, [isSpeaking, isProcessing, aiState]);

  const handleAnalysis = useCallback(async (base64: string) => {
    if (isAnalyzingRef.current) return;
    
    try {
      isAnalyzingRef.current = true;
      setIsProcessing(true);
      setAIState('processing');
      setLastAnalysisTime(Date.now());
      
      const result = await analyzeImage(base64);
      
      setIsProcessing(false);
      
      if (result.confidence >= 0.7) {
        setAIState('speaking');
        await speak(result.description);
        setAIState('listening');
      } else {
        setAIState('low_confidence');
        await speak("I'm not fully sure what this is. Would you like to connect to a volunteer?");
        setShowHelpModal(true);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setIsProcessing(false);
      setAIState('listening');
      await speak("Sorry, I couldn't analyze the image. Please try again.");
    } finally {
      isAnalyzingRef.current = false;
    }
  }, [speak]);

  const handleSnap = useCallback(async (base64: string) => {
    await handleAnalysis(base64);
  }, [handleAnalysis]);

  const handleManualAnalysis = useCallback(async () => {
    // This will be triggered by the AIButton
    // The CameraView will need to expose a method to capture
    // For now, we'll rely on the continuous mode
    if (!isProcessing) {
      setAIState('listening');
    }
  }, [isProcessing]);

  // Continuous analysis in auto mode
  useEffect(() => {
    if (!isAutoMode || inCall) {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
      return;
    }

    // Start continuous analysis
    analysisIntervalRef.current = setInterval(() => {
      // The CameraView will handle the actual capture
      // We'll trigger it via a ref or callback
      const timeSinceLastAnalysis = Date.now() - lastAnalysisTime;
      if (timeSinceLastAnalysis >= ANALYSIS_INTERVAL && !isAnalyzingRef.current) {
        // Trigger analysis - CameraView needs to expose capture method
        setAIState('listening');
      }
    }, ANALYSIS_INTERVAL);

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, [isAutoMode, inCall, lastAnalysisTime]);

  const handleRequestHelp = async () => {
      setShowHelpModal(false);
      setAIState('processing');
      await speak("Searching for a volunteer...");
      try {
          await createRequest();
      } catch (e) {
          setAIState('listening');
          await speak("Error creating request.");
      }
  };

  const handleEndCall = () => {
      setInCall(false);
      setAIState('listening');
      speak("Call ended.");
  };

  if (inCall && activeRequest) {
      return <CallInterface sessionId={activeRequest.id} onEndCall={handleEndCall} helpRequestId={activeRequest.id} />;
  }

  return (
    <View style={styles.container}>
      <CameraView 
        onSnap={handleSnap} 
        isProcessing={isProcessing}
        autoCapture={isAutoMode}
        captureInterval={ANALYSIS_INTERVAL}
      />
      
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <StateIndicator state={aiState} />
        </View>
        
        <View style={styles.bottomBar}>
          <AIButton 
            onPress={handleManualAnalysis}
            isProcessing={isProcessing}
            disabled={inCall}
          />
        </View>
      </View>
      
      <HelpRequestModal 
        visible={showHelpModal} 
        onYes={handleRequestHelp} 
        onNo={() => {
          setShowHelpModal(false);
          setAIState('listening');
        }} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  topBar: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    alignItems: 'flex-start',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});

