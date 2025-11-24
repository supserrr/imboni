"use client"

import type { ChangeEvent } from 'react';

export interface StartOverlayProps {
  onStartWebcam: () => Promise<void> | void;
  onVideoFileChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void> | void;
}

export default function StartOverlay({ onStartWebcam, onVideoFileChange }: StartOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
      <div className="flex flex-col gap-3 sm:gap-4 items-center px-4 max-w-md w-full">
        <h2 className="text-white text-xl sm:text-2xl font-semibold text-center mb-2">
          Start your visual assistance journey
        </h2>
        <button
          onClick={onStartWebcam}
          className="text-black font-semibold shadow-lg hover:scale-105 transition-transform px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg w-full sm:w-auto"
          style={{ background: 'white', borderRadius: '9999px' }}
        >
          Start Webcam
        </button>
        <input
          type="file"
          accept="video/*"
          onChange={onVideoFileChange}
          className="hidden"
          id="video-upload"
        />
        <label
          htmlFor="video-upload"
          className="cursor-pointer text-white/70 hover:text-white text-sm underline transition-colors"
        >
          or choose video
        </label>
      </div>
    </div>
  );
}

