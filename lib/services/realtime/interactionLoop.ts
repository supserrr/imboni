/**
 * Continuous interaction loop orchestration.
 * Manages voice → frame → AI reasoning → TTS pipeline with interruption handling.
 */

import { debug, info, error as logError, warn } from '@/lib/utils/logger';
import { startContinuousCapture, stopCapture, FrameCallback } from '../camera/frameCapture';
import { analyzeWithReasoning, MoondreamResponse, SessionContext as ReasoningSessionContext } from '../vision/moondreamReasoning';
import { synthesizeSpeech, AudioSource } from '../audio/elevenLabsTTS';
import { getWhisperClient, startStreaming, STTChunk } from '../audio/whisperGroq';
import { handleLowConfidence as handleLowConfidenceSTT, handleSTTError, resetFallbackState } from '../audio/whisperFallback';
import { handleLowConfidence as handleLowConfidenceVision, getVolunteerPrompt } from './confidenceHandler';
import { CameraView } from 'expo-camera';
import { Audio } from 'expo-av';
import { MediaStream } from 'react-native-webrtc';
import { triggerHaptic } from '@/lib/utils/accessibility';

/**
 * Interaction loop state.
 */
export enum InteractionState {
  IDLE = 'idle',
  LISTENING = 'listening',
  PROCESSING = 'processing',
  SPEAKING = 'speaking',
}

/**
 * Interaction loop callbacks.
 */
export interface InteractionCallbacks {
  onStateChange?: (state: InteractionState) => void;
  onUserSpeech?: (text: string) => void;
  onAIResponse?: (response: string, confidence: number) => void;
  onLowConfidence?: (message: string, shouldShowPrompt: boolean) => void;
  onError?: (error: Error) => void;
}

/**
 * Interaction loop configuration.
 */
export interface InteractionConfig {
  fps?: number; // Frames per second (default 2)
  confidenceThreshold?: number; // Confidence threshold (default 0.55)
  voiceId?: string; // ElevenLabs voice ID
  enableContinuousFrameAnalysis?: boolean; // Whether to analyze frames continuously
  enableInterruption?: boolean; // Whether user speech can interrupt AI response
}

/**
 * Interaction loop manager.
 */
class InteractionLoopManager {
  private state: InteractionState = InteractionState.IDLE;
  private callbacks: InteractionCallbacks = {};
  private config: InteractionConfig = {};
  private cameraRef: React.RefObject<CameraView> | null = null;
  private sessionContext: ReasoningSessionContext | null = null;
  
  private whisperClient = getWhisperClient();
  private audioStream: MediaStream | null = null;
  private currentSound: Audio.Sound | null = null;
  private frameCaptureCleanup: (() => void) | null = null;
  private whisperCleanup: (() => void) | null = null;
  
  private sttFallbackState = { retryCount: 0 };
  private isInterrupted = false;

  /**
   * Starts the interaction loop.
   *
   * @param cameraRef - Reference to camera component
   * @param audioStream - MediaStream for audio input
   * @param sessionContext - Session context for reasoning
   * @param callbacks - Interaction callbacks
   * @param config - Interaction configuration
   */
  async startLoop(
    cameraRef: React.RefObject<CameraView>,
    audioStream: MediaStream,
    sessionContext: ReasoningSessionContext,
    callbacks: InteractionCallbacks = {},
    config: InteractionConfig = {}
  ): Promise<void> {
    if (this.state !== InteractionState.IDLE) {
      warn('Interaction loop already active', { currentState: this.state });
      return;
    }

    this.cameraRef = cameraRef;
    this.audioStream = audioStream;
    this.sessionContext = sessionContext;
    this.callbacks = callbacks;
    this.config = {
      fps: 2,
      confidenceThreshold: 0.55,
      enableContinuousFrameAnalysis: true,
      enableInterruption: true,
      ...config,
    };

    resetFallbackState(this.sttFallbackState);
    this.isInterrupted = false;

    info('Starting interaction loop', { config: this.config });

    // Start listening for user speech
    await this.startListening();
  }

  /**
   * Stops the interaction loop.
   */
  async stopLoop(): Promise<void> {
    if (this.state === InteractionState.IDLE) {
      return;
    }

    info('Stopping interaction loop');

    // Stop frame capture
    if (this.frameCaptureCleanup) {
      this.frameCaptureCleanup();
      this.frameCaptureCleanup = null;
    }

    // Stop voice input
    if (this.whisperCleanup) {
      this.whisperCleanup();
      this.whisperCleanup = null;
    }

    // Stop any ongoing speech
    await this.stopSpeech();

    // Stop camera capture
    stopCapture();

    this.state = InteractionState.IDLE;
    this.callbacks = {};
    this.cameraRef = null;
    this.sessionContext = null;
    this.audioStream = null;
    this.isInterrupted = false;
  }

  /**
   * Handles user interruption.
   * Stops current action and restarts listening.
   */
  async handleInterruption(): Promise<void> {
    if (!this.config.enableInterruption) {
      return;
    }

    debug('User interruption detected');

    this.isInterrupted = true;

    // Stop current speech
    await this.stopSpeech();

    // Stop frame processing
    if (this.frameCaptureCleanup) {
      this.frameCaptureCleanup();
      this.frameCaptureCleanup = null;
    }

    // Restart listening
    await this.startListening();
  }

  /**
   * Starts listening for user speech.
   */
  private async startListening(): Promise<void> {
    if (!this.audioStream) {
      throw new Error('Audio stream not available');
    }

    this.setState(InteractionState.LISTENING);
    triggerHaptic('light');

    // Start STT streaming
    try {
      this.whisperCleanup = await startStreaming(
        this.audioStream,
        async (chunk: STTChunk) => {
          // Handle interruption if user speaks
          if (this.state === InteractionState.SPEAKING || this.state === InteractionState.PROCESSING) {
            await this.handleInterruption();
          }

          // Process STT chunk
          if (chunk.isFinal && chunk.text.trim()) {
            // Check confidence
            if (chunk.confidence < 0.7) {
              const shouldRetry = handleLowConfidenceSTT(chunk, this.sttFallbackState);
              
              if (shouldRetry) {
                debug('Low confidence STT, retrying', { confidence: chunk.confidence });
                return;
              }
            }

            // Reset fallback state on successful recognition
            resetFallbackState(this.sttFallbackState);

            // Process user speech
            await this.processUserSpeech(chunk.text);
          }
        },
        (error: Error) => {
          const shouldRetry = handleSTTError(error, this.sttFallbackState);
          
          if (!shouldRetry) {
            // Max retries reached, escalate
            if (this.callbacks.onError) {
              this.callbacks.onError(error);
            }
          }
        }
      );
    } catch (err) {
      logError('Failed to start STT streaming', err instanceof Error ? err : new Error(String(err)));
      if (this.callbacks.onError) {
        this.callbacks.onError(err instanceof Error ? err : new Error(String(err)));
      }
    }

    // Start continuous frame analysis if enabled
    if (this.config.enableContinuousFrameAnalysis && this.cameraRef) {
      this.startFrameAnalysis();
    }
  }

  /**
   * Processes user speech input.
   *
   * @param text - User speech text
   */
  private async processUserSpeech(text: string): Promise<void> {
    if (this.isInterrupted) {
      this.isInterrupted = false;
    }

    this.setState(InteractionState.PROCESSING);
    triggerHaptic('medium');

    if (this.callbacks.onUserSpeech) {
      this.callbacks.onUserSpeech(text);
    }

    // Stop frame capture temporarily while processing
    if (this.frameCaptureCleanup) {
      this.frameCaptureCleanup();
      this.frameCaptureCleanup = null;
    }

    try {
      // Capture current frame and analyze with user query
      if (!this.cameraRef?.current) {
        throw new Error('Camera not available');
      }

      const photo = await this.cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });

      if (!photo?.base64) {
        throw new Error('Failed to capture frame');
      }

      // Analyze with reasoning
      const analysis = await analyzeWithReasoning({
        imageBase64: photo.base64,
        userText: text,
        context: this.sessionContext || undefined,
      });

      // Check confidence
      const confidenceResult = handleLowConfidenceVision(analysis, this.config.confidenceThreshold);

      if (confidenceResult.isLow && confidenceResult.shouldShowPrompt) {
        if (this.callbacks.onLowConfidence) {
          this.callbacks.onLowConfidence(confidenceResult.message || '', true);
        }
      }

      // Format and speak response
      const response = this.formatResponse(analysis, confidenceResult.isLow);
      
      if (this.callbacks.onAIResponse) {
        this.callbacks.onAIResponse(response, analysis.confidence);
      }

      await this.speakResponse(response);

      // Resume listening and frame analysis
      await this.startListening();
    } catch (err) {
      logError('Error processing user speech', err instanceof Error ? err : new Error(String(err)));
      if (this.callbacks.onError) {
        this.callbacks.onError(err instanceof Error ? err : new Error(String(err)));
      }
      
      // Resume listening even on error
      await this.startListening();
    }
  }

  /**
   * Starts continuous frame analysis.
   */
  private startFrameAnalysis(): void {
    if (!this.cameraRef) {
      return;
    }

    const onFrame: FrameCallback = async (frame) => {
      // Skip if processing or speaking
      if (this.state === InteractionState.PROCESSING || this.state === InteractionState.SPEAKING) {
        return;
      }

      // Skip if interrupted
      if (this.isInterrupted) {
        return;
      }

      try {
        // Analyze frame
        const analysis = await analyzeWithReasoning({
          imageBase64: frame.base64,
          context: this.sessionContext || undefined,
        });

        // Check confidence
        const confidenceResult = handleLowConfidenceVision(analysis, this.config.confidenceThreshold);

        if (confidenceResult.isLow && confidenceResult.shouldShowPrompt) {
          if (this.callbacks.onLowConfidence) {
            this.callbacks.onLowConfidence(confidenceResult.message || '', true);
          }
          return;
        }

        // Format and speak response if confidence is good
        const response = this.formatResponse(analysis, false);
        
        if (this.callbacks.onAIResponse) {
          this.callbacks.onAIResponse(response, analysis.confidence);
        }

        await this.speakResponse(response);
      } catch (err) {
        // Log but don't interrupt loop
        debug('Error analyzing frame', { error: err });
      }
    };

    this.frameCaptureCleanup = startContinuousCapture(
      this.cameraRef,
      this.config.fps || 2,
      onFrame,
      {
        shouldSkip: () => {
          // Skip if processing, speaking, or interrupted
          return (
            this.state === InteractionState.PROCESSING ||
            this.state === InteractionState.SPEAKING ||
            this.isInterrupted
          );
        },
      }
    );
  }

  /**
   * Formats AI response text.
   *
   * @param analysis - Moondream analysis
   * @param isLowConfidence - Whether confidence is low
   * @returns Formatted response text
   */
  private formatResponse(analysis: MoondreamResponse, isLowConfidence: boolean): string {
    if (isLowConfidence) {
      return getVolunteerPrompt();
    }

    // Simple formatting - actual formatting is done in aiResponse.ts
    return analysis.description || 'I see something, but I cannot describe it clearly.';
  }

  /**
   * Speaks AI response using TTS.
   *
   * @param text - Text to speak
   */
  private async speakResponse(text: string): Promise<void> {
    if (this.isInterrupted) {
      return;
    }

    this.setState(InteractionState.SPEAKING);
    triggerHaptic('medium');

    try {
      // Synthesize speech
      const audioSource = await synthesizeSpeech(text, this.config.voiceId, {
        speechRate: 1.0,
      });

      if (this.isInterrupted) {
        return;
      }

      // Play audio
      await this.playAudio(audioSource);

      // Resume listening after speech completes
      if (!this.isInterrupted) {
        await this.startListening();
      }
    } catch (err) {
      logError('Error speaking response', err instanceof Error ? err : new Error(String(err)));
      // Resume listening even on error
      if (!this.isInterrupted) {
        await this.startListening();
      }
    }
  }

  /**
   * Plays audio from source.
   *
   * @param audioSource - Audio source
   */
  private async playAudio(audioSource: AudioSource): Promise<void> {
    // Stop any existing audio
    await this.stopSpeech();

    // Load and play
    const { sound } = await Audio.Sound.createAsync(
      { uri: audioSource.uri },
      { shouldPlay: true, volume: 1.0 }
    );

    this.currentSound = sound;

    // Wait for playback to complete
    await new Promise<void>((resolve) => {
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && (status.didJustFinish || status.isStopped)) {
          resolve();
        }
      });
    });

    // Cleanup
    await this.stopSpeech();
  }

  /**
   * Stops any ongoing speech.
   */
  private async stopSpeech(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
      } catch (err) {
        // Ignore errors
      }
      this.currentSound = null;
    }
  }

  /**
   * Sets interaction state and notifies callbacks.
   *
   * @param newState - New state
   */
  private setState(newState: InteractionState): void {
    if (this.state === newState) {
      return;
    }

    this.state = newState;

    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(newState);
    }

    debug('Interaction state changed', { state: newState });
  }

  /**
   * Gets current interaction state.
   *
   * @returns Current state
   */
  getState(): InteractionState {
    return this.state;
  }
}

/**
 * Global interaction loop manager.
 */
const interactionLoopManager = new InteractionLoopManager();

/**
 * Exported functions.
 */
export function startLoop(
  cameraRef: React.RefObject<CameraView>,
  audioStream: MediaStream,
  sessionContext: ReasoningSessionContext,
  callbacks?: InteractionCallbacks,
  config?: InteractionConfig
): Promise<void> {
  return interactionLoopManager.startLoop(cameraRef, audioStream, sessionContext, callbacks, config);
}

export function stopLoop(): Promise<void> {
  return interactionLoopManager.stopLoop();
}

export function handleInterruption(): Promise<void> {
  return interactionLoopManager.handleInterruption();
}

export function getInteractionState(): InteractionState {
  return interactionLoopManager.getState();
}

