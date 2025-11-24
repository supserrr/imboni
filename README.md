# Imboni - AI Vision Assistant

A real-time camera-based AI assistant for blind and low vision users, powered by Moondream AI. The app analyzes live camera feeds and provides audio descriptions of the user's environment.

## Features

- **Real-time Camera Analysis** - Continuous scene description using Moondream AI
- **Interactive Queries** - Ask specific questions about what the camera sees
- **Text-to-Speech Narration** - Automatic audio descriptions with customizable voice and speed
- **Preset Questions** - Quick access to common queries like "What's in front of me?" and "Read any text"
- **Optional Authentication** - Sign in to save analysis history
- **Accessibility First** - Keyboard shortcuts, screen reader support, high contrast mode
- **Settings** - Customize narration speed, voice, analysis frequency, and camera preview

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Moondream API key ([Get one here](https://moondream.ai))
- Supabase project (optional, for authentication and history)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_MOONDREAM_API_KEY=sk-your-moondream-key
   NEXT_PUBLIC_MOONDREAM_API_URL=https://api.moondream.ai/v1
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Run database migrations (if using Supabase):
   ```bash
   # Apply the migration to create analysis_history table
   # Use Supabase CLI or dashboard
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Start the Camera** - Click "Start" or press Space to begin camera analysis
2. **Ask Questions** - Type questions in the query input or use preset questions
3. **Adjust Settings** - Open settings to customize narration speed, voice, and analysis frequency
4. **View History** - Sign in to view your past analyses

## Keyboard Shortcuts

- **Space** - Start/Resume analysis
- **Escape** - Stop camera
- **P** - Pause analysis
- **Q** - Focus query input

## Technology Stack

- **Next.js 16** - React framework with App Router
- **Moondream AI** - Vision language model for image analysis
- **Supabase** - Authentication and database (optional)
- **shadcn/ui** - UI component library
- **Web Speech API** - Text-to-speech functionality
- **TypeScript** - Type safety

## Database Schema

The app uses an optional `analysis_history` table in Supabase:

```sql
CREATE TABLE analysis_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_data TEXT,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

See `supabase/migrations/001_create_analysis_history.sql` for the complete migration.

## Accessibility

The app is designed with accessibility in mind:

- **Screen Reader Support** - All interactions are announced
- **Keyboard Navigation** - Full functionality via keyboard
- **High Contrast Mode** - Respects system preferences
- **Reduced Motion** - Respects motion preferences
- **Large Touch Targets** - Minimum 44x44px for mobile
- **ARIA Labels** - Comprehensive labeling for assistive technologies

## Project Structure

```
src/
  app/
    page.tsx              # Main camera view
    settings/
      page.tsx            # Settings page
    history/
      page.tsx            # Analysis history
  components/
    CameraView.tsx        # Camera feed display
    AnalysisOverlay.tsx   # Analysis results overlay
    ControlPanel.tsx      # Main controls
    QueryInput.tsx        # Query input with presets
    SettingsDialog.tsx    # Settings panel
    Navigation.tsx        # Navigation header
  hooks/
    useCameraCapture.ts   # Camera management
    useMoondreamAnalysis.ts # Moondream API integration
    useTextToSpeech.ts    # TTS functionality
    useAccessibility.ts    # Accessibility features
  lib/
    services/
      moondream.ts        # Moondream API client
    utils/
      frame-capture.ts    # Frame capture utilities
```

## License

MIT
