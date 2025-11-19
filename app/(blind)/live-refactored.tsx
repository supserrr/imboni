import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import CameraView from '@/components/blind/CameraView';
import HelpRequestModal from '@/components/blind/HelpRequestModal';
import CallInterface from '@/components/blind/CallInterface';
import StateIndicator from '@/components/common/StateIndicator';
import AIButton from '@/components/common/AIButton';
import { useTTS } from '@/hooks/use-tts';
import { useHelpRequest } from '@/hooks/use-help-request';
import { useVideoSession } from '@/hooks/use-video-session';
import { useAnalysisSession } from '@/hooks/use-analysis-session';
import type { AIState } from '@/components/common/StateIndicator';

/**
 * Live screen for blind users - refactored with domain-specific hooks.
 * 
 * This screen orchestrates:
 * - Video session (camera, permissions, frame capture)
 * - Analysis session (frame analysis, history, confidence tracking)
 * - TTS feedback
 * - Help request flow
 */
export default function LiveScreen() {
  const { speak, stop, isSpeaking } = useTTS();
  const { createRequest, activeRequest } = useHelpRequest();
  
  const [aiState, setAIState] = useState<AIState>('idle');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [inCall, setInCall] = useState(false);

  // Video session - manages camera, permissions, frame capture
  const videoSession = useVideoSession({
    autoRequestPermission: true,
    defaultFacing: 'back',
    captureInterval: 3000,
  });

  // Analysis session - bridges video with analysis
  const handleHighConfidence = useCallback((result: { description: string; confidence: number }) => {
    setAIState('speaking');
    speak(result.description);
  }, [speak]);

  const handleLowConfidence = useCallback(() => {
    setAIState('low_confidence');
    speak("I'm not fully sure what this is. Would you like to connect to a volunteer?");
    setShowHelpModal(true);
  }, [speak]);

  const registerFrameCapture = useCallback((callback: (base64: string) => void) => {
    videoSession.registerFrameCapture(callback);
  }, [videoSession]);

  const analysisSession = useAnalysisSession(
    registerFrameCapture,
    {
      maxHistory: 10,
      autoAnalyze: !inCall,
      confidenceThreshold: 0.7,
      onHighConfidence: handleHighConfidence,
      onLowConfidence: handleLowConfidence,
    }
  );

  // Initialize on mount
  useEffect(() => {
    speak("Camera ready. Continuous analysis is active.");
    setAIState('listening');
  }, [speak]);

  // Start auto-capture when ready
  useEffect(() => {
    if (videoSession.permission?.granted && !inCall) {
      const cleanup = videoSession.startAutoCapture();
      return cleanup;
    }
  }, [videoSession.permission?.granted, videoSession.startAutoCapture, inCall]);

  // Handle call transition
  useEffect(() => {
    if (activeRequest && activeRequest.status === 'accepted' && activeRequest.assigned_volunteer) {
      speak("A volunteer has accepted your request. Connecting now.");
      setInCall(true);
      setAIState('idle');
      videoSession.deactivate();
    }
  }, [activeRequest, speak, videoSession]);

  // Update AI state based on processing/speaking
  useEffect(() => {
    if (isSpeaking) {
      setAIState('speaking');
    } else if (analysisSession.isProcessing) {
      setAIState('processing');
    } else if (aiState === 'speaking' && !isSpeaking) {
      setAIState('listening');
    }
  }, [isSpeaking, analysisSession.isProcessing, aiState]);

  // Manual analysis trigger
  const handleManualAnalysis = useCallback(async () => {
    if (analysisSession.isProcessing || inCall) {
      return;
    }

    setAIState('processing');
    const base64 = await videoSession.captureFrame();
    if (base64) {
      await analysisSession.analyzeManually(base64);
    }
  }, [analysisSession, videoSession, inCall]);

  // Help request handlers
  const handleRequestHelp = useCallback(async () => {
    setShowHelpModal(false);
    setAIState('processing');
    await speak("Searching for a volunteer...");
    try {
      await createRequest();
    } catch (e) {
      setAIState('listening');
      await speak("Error creating request.");
    }
  }, [speak, createRequest]);

  const handleCancelHelp = useCallback(() => {
    setShowHelpModal(false);
    setAIState('listening');
  }, []);

  // Call handlers
  const handleEndCall = useCallback(() => {
    setInCall(false);
    setAIState('listening');
    videoSession.activate();
    speak("Call ended.");
  }, [speak, videoSession]);

  // Render call interface if in call
  if (inCall && activeRequest) {
    return (
      <CallInterface
        sessionId={activeRequest.id}
        onEndCall={handleEndCall}
        helpRequestId={activeRequest.id}
      />
    );
  }

  // Main UI
  return (
    <View style={styles.container}>
      <CameraView
        cameraRef={videoSession.cameraRef}
        facing={videoSession.facing}
        permission={videoSession.permission}
        requestPermission={videoSession.requestPermission}
        toggleCameraFacing={videoSession.toggleCameraFacing}
        isProcessing={analysisSession.isProcessing}
        onManualCapture={handleManualAnalysis}
      />
      
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <StateIndicator state={aiState} />
        </View>
        
        <View style={styles.bottomBar}>
          <AIButton
            onPress={handleManualAnalysis}
            isProcessing={analysisSession.isProcessing}
            disabled={inCall}
          />
        </View>
      </View>
      
      <HelpRequestModal
        visible={showHelpModal}
        onYes={handleRequestHelp}
        onNo={handleCancelHelp}
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

