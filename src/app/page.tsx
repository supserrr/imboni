"use client"

import Player from '@/components/solutions/analyze-live-video/player';
import { Navigation } from '@/components/Navigation';

const MOONDREAM_API_URL = process.env.NEXT_PUBLIC_MOONDREAM_API_URL || 'https://api.moondream.ai/v1';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 flex flex-col" role="main">
        <div className="flex-1 relative min-h-screen bg-[#050505] text-white">
          <div className="mx-auto max-w-6xl px-4 pb-16 pt-8">
            <Player inferenceUrl={MOONDREAM_API_URL} />
          </div>
        </div>
      </main>
    </div>
  );
}
