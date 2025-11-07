'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Props accepted by {@link CameraCapture}.
 */
export interface CameraCaptureProps {
  /** Invoked when a still photo is captured from the active stream. */
  readonly onCapture: (dataUrl: string) => Promise<void> | void;
  /** Optional textual label announced by assistive technology. */
  readonly label?: string;
}

/**
 * CameraCapture renders a minimalist camera preview with a single capture button.
 */
export function CameraCapture({ onCapture, label = 'Capture image' }: CameraCaptureProps): JSX.Element {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let stream: MediaStream;

    const initialise = async (): Promise<void> => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to access camera.');
      }
    };

    void initialise();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleCapture = useCallback(async () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setError('Unable to capture image.');
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    await onCapture(dataUrl);
  }, [onCapture]);

  return (
    <section aria-label="Camera" className="camera">
      <video ref={videoRef} autoPlay playsInline muted className="camera__preview" aria-hidden={!isReady} />
      {error ? (
        <p role="alert" className="camera__error">
          {error}
        </p>
      ) : (
        <button
          type="button"
          className="camera__button"
          onClick={() => void handleCapture()}
          aria-label={label}
        >
          Capture
        </button>
      )}
    </section>
  );
}
