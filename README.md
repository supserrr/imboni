# Imboni – Visual Assistance App

Imboni is a mobile app built with React Native + Expo that connects visually impaired users with AI-powered vision analysis and live volunteer assistance through video calls.

## Purpose

The app provides two primary services:
- **AI-Powered Vision Analysis**: Real-time object recognition using Moondream via BentoML
- **Live Volunteer Assistance**: On-demand video call support when AI confidence is low

## User Types

### Blind Users

Blind users use the Live screen to:
- Capture camera frames continuously
- Receive spoken descriptions via MeloTTS
- Request volunteer assistance when AI confidence is low (< 0.7)

### Volunteers

Volunteers can:
- Toggle online/offline availability
- Receive real-time notifications for incoming help requests
- Accept/decline help requests
- Join video calls to assist blind users with controls for snapshot, flashlight, and ending the call

## Core Features

### Blind User (Live Mode)

#### Camera Interface
- Full-screen camera feed
- Continuous frame capture for AI analysis
- Manual capture button with haptic feedback

#### AI Image Analysis
- Frames sent to BentoML Moondream API (`/vision/analyze`)
- Real-time object recognition and scene description

#### Text-to-Speech
- Spoken feedback via MeloTTS (`/audio/tts`)
- Natural voice descriptions of the environment

#### Confidence Check
- **High confidence (≥ 0.7)**: AI speaks description automatically
- **Low confidence (< 0.7)**: Prompts user to request volunteer help

#### Help Request System
- Connects users to the best available volunteer automatically
- Real-time status updates via Supabase subscriptions

#### Live Video Call
- Uses WebRTC for real-time assistance
- Full-duplex audio and video communication

### Volunteer

#### Dashboard
- Displays online/offline status
- Toggle availability
- View incoming requests

#### Incoming Requests
- Real-time notifications of blind users needing help
- Automatic routing based on volunteer metrics

#### Accept/Decline
- Volunteers choose whether to join
- Decline triggers automatic re-routing to next best volunteer

#### Video Call Interface
- Controls for:
  - **Snapshot**: Capture current frame
  - **End Call**: Terminate session
  - **Flashlight**: Toggle device flashlight
- View blind user's camera feed

#### Volunteer Metrics Tracking
- Logs behavior to improve future matching:
  - Accept/decline rates
  - Response time
  - Successful session count

## Technical Architecture

### Frontend

- **Framework**: React Native + Expo Router
- **Language**: TypeScript
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Camera & Audio**: Expo Camera + Expo AV
- **Video Calls**: WebRTC (react-native-webrtc)

### Backend

#### Supabase
- Authentication
- Real-time database (PostgreSQL)
- Subscriptions for help requests
- Row Level Security (RLS) policies

#### BentoML APIs
- `/vision/analyze` → Moondream for object recognition
- `/audio/tts` → MeloTTS for text-to-speech

### Database Tables

#### `users`
- User type (blind/volunteer)
- Availability status
- Rating and reliability score
- Last active timestamp
- History count

#### `help_requests`
- Track status (pending, accepted, declined, in_progress, completed, cancelled)
- Assigned volunteer
- Timestamps

#### `sessions`
- Logs completed video calls
- Duration tracking
- Ratings

#### `volunteer_behavior`
- Tracks accept/decline counts
- Average response speed
- Successful session count
- Decline penalty tracking

### Volunteer Selection Algorithm

Scores volunteers based on:
1. **Availability** (weight: 100)
2. **Rating** (weight: 20)
3. **Average response speed** (weight: 10)
4. **Successful session count** (weight: 5)
5. **Decline penalty** (weight: -15)

Selects best volunteer automatically. If declined or unresponsive, next best volunteer is chosen.

## User Flow

### Blind User

1. Open Live screen
2. AI continuously analyzes camera feed
3. AI speaks description if confident (≥ 0.7)
4. If low confidence (< 0.7):
   - Prompt to request volunteer
   - Upon acceptance, sends help request
5. Volunteer accepts → video call starts
6. After call, behavior metrics updated

### Volunteer

1. Online status displayed on dashboard
2. Receive real-time notification for help requests
3. Accept/Decline request
4. On accept, join video call and provide assistance
5. Use controls: Snapshot, End Call, Flashlight
6. Metrics updated after call

## Key Components

### CameraView
- Live camera feed
- Manual capture button
- Camera flip control

### CallInterface
- WebRTC video call management
- Separate implementations for blind users and volunteers
- Stream handling and signaling

### HelpRequestModal
- Blind user prompts for volunteer assistance
- Yes/No confirmation

### VolunteerModal
- Incoming request notifications
- Accept/Decline actions

### AIButton
- Triggers AI analysis with haptics and sound cues
- Visual feedback for user interaction

### StateIndicator
- AI state feedback:
  - Listening
  - Processing
  - Speaking
  - Low confidence

### AudioLevelBar
- Visual audio input feedback
- For haptic/audio guidance

## Real-Time & Accessibility

- Supabase subscriptions synchronize user and volunteer states
- Accessible UI:
  - Large buttons
  - Haptic feedback
  - Dark theme support
  - Voice feedback
- Eliminates Photo Mode — all AI processing occurs in Live Mode

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- Python 3.9+ (for BentoML service)
- Supabase account
- Git (for installing MeloTTS)

### Installation

#### 1. Install Mobile App Dependencies

   ```bash
   npm install
   ```

#### 2. Set Up BentoML Service

The BentoML service provides AI vision analysis and text-to-speech. Set it up first:

   ```bash
cd bentoml-service

# Linux/macOS:
./setup.sh

# Windows:
setup.bat

# Or manually:
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
pip install git+https://github.com/myshell-ai/MeloTTS.git
python -m unidic download
```

See `bentoml-service/README.md` for detailed setup instructions.

#### 3. Set Up Environment Variables

```bash
cp env.example .env
```

Add your credentials:
- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `EXPO_PUBLIC_BENTOML_API_URL` - BentoML service URL (default: `http://localhost:3000`)

#### 4. Run Database Migrations

Apply the database schema:

```bash
# Via Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Run the contents of supabase/migrations/001_initial_schema.sql

# Or via Supabase CLI:
supabase db push
```

#### 5. Start Services

**Terminal 1 - BentoML Service:**
```bash
cd bentoml-service
source venv/bin/activate  # On Windows: venv\Scripts\activate
bentoml serve service.py:svc
```

**Terminal 2 - Mobile App:**
```bash
npm start
```

### Development

- **iOS**: `npm run ios`
- **Android**: `npm run android`
- **Web**: `npm run web`

## Project Structure

```
imboni/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   ├── (blind)/           # Blind user screens
│   ├── (volunteer)/       # Volunteer screens
│   └── (tabs)/            # Tab navigation
├── components/            # Reusable components
│   ├── blind/            # Blind user components
│   ├── volunteer/         # Volunteer components
│   └── common/           # Shared components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and services
├── store/                 # Zustand state management
├── api/                   # API helper functions
└── supabase/             # Database migrations
```

## License

Private project
