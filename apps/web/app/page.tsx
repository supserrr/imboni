'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { HandoffRequest, ImageAnalysisResult, WebRTCSignal } from '@imboni/shared';
import { shouldEscalate } from '@imboni/shared';
import { analyzeImage, requestHumanHandoff, subscribeToHandoff } from '@imboni/api-client';
import { getSupabaseClient } from '../lib/api';
import { WebRTCClient } from '../lib/webrtc';
import { CameraCapture } from './components/CameraCapture';
import { AIResponse } from './components/AIResponse';
import { HumanHandoff } from './components/HumanHandoff';
import { History } from './components/History';
import { Settings } from './components/Settings';
import { InCallControls } from './components/InCallControls';

const CONFIDENCE_THRESHOLD = 0.55;

export default function Home(): JSX.Element {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [result, setResult] = useState<ImageAnalysisResult | undefined>();
  const [history, setHistory] = useState<ImageAnalysisResult[]>([]);
  const [handoff, setHandoff] = useState<HandoffRequest | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locale, setLocale] = useState('en');
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [autoEscalated, setAutoEscalated] = useState(false);
  const [isHandoffProcessing, setIsHandoffProcessing] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [inCall, setInCall] = useState(false);
  const handoffId = handoff?.id ?? null;
  const handoffStatus = handoff?.status ?? null;
  const [rtcClient, setRtcClient] = useState<WebRTCClient | null>(null);
  const rtcClientRef = useRef<WebRTCClient | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    rtcClientRef.current = rtcClient;
    return () => {
      if (!rtcClient) {
        rtcClientRef.current = null;
      }
    };
  }, [rtcClient]);

  useEffect(() => {
    if (!localStream || !localVideoRef.current) {
      return;
    }
    localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (!remoteVideoRef.current) {
      return;
    }
    remoteVideoRef.current.srcObject = remoteStream ?? null;
  }, [remoteStream]);

  useEffect(() => {
    const currentHandoffId = handoffId;
    if (!currentHandoffId) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    const channel = subscribeToHandoff(supabase, currentHandoffId, (payload) => {
      setHandoff(payload);
      if (payload.status === 'connected') {
        setInCall(true);
      }
      if (payload.status === 'resolved' || payload.status === 'cancelled') {
        setInCall(false);
      }
    });

    channel.on('broadcast', { event: 'signal' }, async (payload) => {
      const signal = payload.payload as WebRTCSignal | undefined;
      if (!signal || signal.sender === 'user') {
        return;
      }
      if (signal.handoffId && signal.handoffId !== currentHandoffId) {
        return;
      }
      if (rtcClientRef.current) {
        await rtcClientRef.current.handleSignal({ handoffId: currentHandoffId, ...signal });
      }
    });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [handoffId, supabase]);

  useEffect(() => {
    if (!handoffId || (handoffStatus !== 'connected' && handoffStatus !== 'assigned')) {
      return;
    }

    const client = new WebRTCClient({
      supabase,
      handoffId: handoffId,
      senderId: 'user',
      onRemoteStream: (stream) => {
        setRemoteStream(stream);
      },
    });

    let cancelled = false;

    const prepareCall = async (): Promise<void> => {
      const stream = await client.prepare();
      if (cancelled) {
        client.close();
        return;
      }
      setRtcClient(client);
      setLocalStream(stream);
      if (handoffStatus === 'connected') {
        await client.startCall();
      }
    };

    void prepareCall();

    return () => {
      cancelled = true;
      client.close();
      setRtcClient(null);
      setLocalStream(null);
      setRemoteStream(null);
    };
  }, [handoffId, handoffStatus, supabase]);

  useEffect(() => {
    if (!handoff || handoff.status === 'resolved' || handoff.status === 'cancelled') {
      rtcClient?.close();
      setRtcClient(null);
      setLocalStream(null);
      setRemoteStream(null);
      setInCall(false);
    }
  }, [handoff?.status, handoff, rtcClient]);

  const handleCapture = useCallback(
    async (dataUrl: string) => {
      setIsLoading(true);
      setError(null);
      setAutoEscalated(false);
      try {
        const analysis = await analyzeImage(supabase, {
          userId: 'demo-user',
          imageSource: dataUrl,
          capturedAt: new Date().toISOString(),
        });
        setResult(analysis);
        setHistory((prev) => [analysis, ...prev].slice(0, 10));

        if (shouldEscalate(analysis.confidence, CONFIDENCE_THRESHOLD)) {
          setAutoEscalated(true);
          await handleHandoffRequest(analysis.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to analyse the image.');
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, handleHandoffRequest],
  );

  const handleHandoffRequest = useCallback(
    async (analysisId?: string) => {
      setIsHandoffProcessing(true);
      try {
        const targetAnalysisId = analysisId ?? result?.id;
        if (!targetAnalysisId) {
          throw new Error('No analysis available for handoff.');
        }
        const newHandoff = await requestHumanHandoff(supabase, targetAnalysisId);
        setHandoff(newHandoff);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to request a volunteer.');
      } finally {
        setIsHandoffProcessing(false);
      }
    },
    [result?.id, supabase],
  );

  const handleSnapshot = useCallback(() => {
    setHistory((prev) => (result ? [result, ...prev] : prev));
  }, [result]);

  const handleEndCall = useCallback(() => {
    rtcClient?.close();
    setRtcClient(null);
    setInCall(false);
    setLocalStream(null);
    setRemoteStream(null);
    if (handoff) {
      setHandoff({ ...handoff, status: 'resolved', updatedAt: new Date().toISOString() });
    }
  }, [handoff, rtcClient]);

  return (
    <main className="shell">
      <header className="shell__header">
        <button type="button" className="shell__chip" onClick={() => setShowHistory(true)} aria-haspopup="dialog">
          Recent
        </button>
        <button type="button" className="shell__chip" onClick={() => setShowSettings(true)} aria-haspopup="dialog">
          Settings
        </button>
      </header>
      <CameraCapture onCapture={handleCapture} />
      <AIResponse result={result} isLoading={isLoading} error={error} />
      <HumanHandoff
        onRequest={() => void handleHandoffRequest()}
        handoff={handoff}
        autoEscalated={autoEscalated}
        isProcessing={isHandoffProcessing}
      />
      {inCall ? (
        <>
          <section className="call" aria-label="Live volunteer connection">
            <video ref={localVideoRef} className="call__video" autoPlay muted playsInline aria-hidden="true" />
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={remoteVideoRef}
              className="call__video call__video--remote"
              autoPlay
              playsInline
              aria-describedby="remote-stream-description"
            />
          </section>
          <InCallControls
            flashlightOn={flashlightOn}
            onToggleFlashlight={() => setFlashlightOn((value) => !value)}
            onSnapshot={handleSnapshot}
            onEndCall={handleEndCall}
          />
        </>
      ) : null}
      {showHistory ? <History entries={history} onClose={() => setShowHistory(false)} /> : null}
      {showSettings ? (
        <Settings
          locale={locale}
          onLocaleChange={(value) => setLocale(value)}
          onClose={() => setShowSettings(false)}
        />
      ) : null}
    </main>
  );
}
