# Imboni - AI-Powered Visual Assistance App

An Expo React Native application that provides AI-powered visual assistance for users with visual impairments, with volunteer support integration.

## Features

### User Features
- **Live Mode**: AI-powered camera feed analysis using Moondream API
- **State Machine**: Idle → Listening → Processing → Speaking → Low Confidence → Request Human Help
- **TTS Integration**: ElevenLabs Realtime TTS for AI responses
- **Sound Effects**: Audio feedback for each AI state
- **Volunteer Request**: Automatic volunteer assignment when confidence is low

### Volunteer Features
- **Availability Toggle**: Online/offline status management
- **Help Request Notifications**: Real-time notifications for incoming requests
- **Video Call Interface**: WebRTC-based video calls with user
- **Activity Tracking**: Comprehensive logging for scoring algorithm
- **Response Time Tracking**: Automatic measurement of response times

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **State Management**: React Context API
- **Backend**: Supabase (PostgreSQL + Realtime + Edge Functions)
- **AI Vision**: Moondream API
- **TTS**: ElevenLabs Realtime API
- **Video/Audio**: WebRTC via Supabase Realtime

## Setup

### Prerequisites

- Node.js 20.19.4+ (required)
- Expo CLI
- Supabase account
- Moondream API key
- ElevenLabs API key

### Node.js Version Setup

This project requires Node.js 20.19.4 or higher. If you're using `fnm` (Fast Node Manager):

```bash
# Install and use the correct version
eval "$(fnm env)"
fnm install 20.19.4
fnm use 20.19.4
fnm default 20.19.4

# Or run the setup script
npm run setup:node

# Verify version
node --version  # Should output v20.19.4
```

The npm scripts automatically switch to Node.js 20.19.4 if `fnm` is available. To ensure `fnm` loads in your shell, add this to your `~/.zshrc`:

```bash
eval "$(fnm env --use-on-cd)"
```

### Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_MOONDREAM_API_URL=https://api.moondream.com/v1
EXPO_PUBLIC_MOONDREAM_API_KEY=your_moondream_api_key
EXPO_PUBLIC_ELEVENLABS_API_URL=https://api.elevenlabs.io/v1
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key
EXPO_PUBLIC_ELEVENLABS_VOICE_ID=your_voice_id
```

### Installation

```bash
npm install
```

### Database Setup

1. Create a new Supabase project
2. Run the migration file: `supabase/migrations/001_initial_schema.sql`
3. Deploy the edge function: `supabase/functions/select-best-volunteer/`

### Running the App

```bash
npm start
```

## Project Structure

```
/app
  /components          # Reusable UI components
  /context             # React Context providers
  /screens             # Screen components
    /auth              # Login/SignUp
    /user              # User screens (LiveMode, Settings)
    /volunteer         # Volunteer screens (Home, VideoCall)
  /utils               # Utility functions
    SupabaseClient.ts  # Supabase integration
    MoondreamAPI.ts    # Vision API integration
    ElevenLabsAudio.ts # TTS and sound effects
    WebRTCClient.ts    # WebRTC connection handling
```

## Key Flows

### User Live Mode Flow

1. **Idle**: Camera active, AI button ready
2. **Listening**: User presses AI button → captures audio + camera frame
3. **Processing**: Sends frame to Moondream API → receives description + confidence
4. **Speaking**: If confidence >= threshold → plays TTS response
5. **Low Confidence**: If confidence < threshold → requests human help
6. **Request Human Help**: Selects best volunteer → creates session → waits for acceptance

### Volunteer Assignment Algorithm

The `select-best-volunteer` edge function scores volunteers based on:
- **Rating** (35%): Historical performance rating
- **Current Load** (25%): Number of active sessions
- **Response Time** (25%): Time since last response
- **Tag Matching** (15%): Matching skills/tags

### Volunteer Activity Tracking

All volunteer actions are logged:
- `request_received`: When help request arrives
- `request_accepted`: When volunteer accepts (with response time)
- `request_declined`: When volunteer declines
- `call_started`: When video call begins
- `call_ended`: When call ends (with duration)
- `snap`: When volunteer takes snapshot
- `flash_toggle`: When flash is toggled

This data feeds into the scoring algorithm for future assignments.

## Testing

### Navigation Flows

- Auth → Role Tabs → Live/Settings/Home/VideoCall
- Verify state transitions work correctly
- Test volunteer notifications and retries

### AI States

- Confirm state machine transitions
- Test TTS and sound effects on device
- Verify confidence threshold triggers

### Volunteer Flow

- Test online/offline toggle
- Verify help request notifications
- Test video call connection
- Confirm activity logging

## License

ISC

