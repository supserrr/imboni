# Imboni

A React Native app built with Expo and Supabase that connects visually impaired users with sighted volunteers through live video calls, similar to Be My Eyes.

## Features

- User authentication with Supabase
- Role-based access (Users and Volunteers)
- Real-time call request matching
- Video calling interface (WebRTC integration ready)
- Push notifications for call requests
- User profiles and availability status

## Prerequisites

- Node.js (v20.19.4 or higher recommended)
- npm or yarn
- Expo CLI (included with `npx expo` or install globally: `npm install -g eas-cli`)
- Expo account (required for EAS builds - create one at [expo.dev](https://expo.dev))
- Apple Developer account (required for iOS builds - $99/year, [enroll here](https://developer.apple.com/programs/enroll/))
- Supabase account
- API Keys for:
  - Moondream API (vision analysis) - [Get from moondream.ai](https://moondream.ai/c/docs/quickstart)
  - Groq API (Whisper STT) - [Get from groq.com](https://console.groq.com)
  - ElevenLabs API (TTS) - [Get from elevenlabs.io](https://elevenlabs.io)

## Setup Instructions

### 1. Install Dependencies

   ```bash
   npm install
   ```

### 1a. Configure npm for Global Packages (Recommended)

On macOS and Linux, installing global npm packages like `eas-cli` may fail with permission errors. To resolve this, configure npm to use a user-writable directory.

**Why this is needed:**

By default, npm installs global packages in system directories (e.g., `/usr/local/lib/node_modules`) that require elevated privileges. This setup:
- Requires `sudo` for global installations, which poses security risks
- Can cause permission conflicts and issues during package updates
- May inadvertently grant packages higher system privileges

**Configuration steps:**

1. Create a directory for global npm packages:
   ```bash
   mkdir -p ~/.npm-global
   ```

2. Configure npm to use this directory:
   ```bash
   npm config set prefix '~/.npm-global'
   ```

3. Add the directory to your PATH. For Zsh (default on macOS), add to `~/.zshrc`:
   ```bash
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
   source ~/.zshrc
   ```

   For Bash, add to `~/.bashrc`:
   ```bash
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   ```

4. Verify the configuration:
   ```bash
   npm install -g eas-cli
   eas --version
   ```

This configuration:
- Eliminates the need for `sudo` when installing global packages
- Improves security by keeping installations within your user directory
- Aligns with npm best practices (see [npm documentation on permissions](https://npm.github.io/installation-setup-docs/installing/a-note-on-permissions.html))
- Works with Expo EAS CLI as recommended in [Expo documentation](https://docs.expo.dev/eas-update/getting-started/)

### 1b. Set Up EAS CLI and Login

This project uses Expo Application Services (EAS) for development builds. To build and deploy the app, you need to authenticate with your Expo account.

1. Install EAS CLI globally (if not already installed):
   ```bash
   npm install -g eas-cli
   ```

2. Log in to your Expo account:
   ```bash
   eas login
   ```

   This will prompt you to enter your email or username. If you don't have an Expo account, create one at [expo.dev](https://expo.dev).

3. Verify your authentication:
   ```bash
   eas whoami
   ```

4. Initialize EAS in your project:
   ```bash
   eas init
   ```
   
   This will link your local project to your Expo account. If an existing project is found, you'll be prompted to link it.

5. Configure EAS Build for your target platforms:
   ```bash
   eas build:configure
   ```
   
   This will prompt you to select which platforms (iOS, Android, or both) you want to configure. The command will generate an `eas.json` file in your project root with build configurations.
   
   **Note:** EAS Build configuration only modifies your local project files. You can safely revert these changes at any time.

6. Create a development build:
   
   For iOS:
   ```bash
   eas build --profile development --platform ios
   ```
   
   For Android:
   ```bash
   eas build --profile development --platform android
   ```
   
   **Note:** The first time you run a development build, EAS CLI will automatically install `expo-dev-client` if it's not already installed. This is required for development builds.

7. **Apple Developer Account (iOS only):**
   
   To build for iOS, you need:
   - A paid Apple Developer account ($99/year)
   - Your Apple ID credentials (EAS CLI will prompt you during the build)
   
   During the build process, you'll be prompted to:
   - Log in with your Apple ID
   - Complete two-factor authentication
   - Verify your Apple Developer account
   
   **Note:** Without a paid Apple Developer account and associated development team, iOS builds will fail. You can enroll at [developer.apple.com](https://developer.apple.com/programs/enroll/).

8. After the build completes, you can submit it to app stores using:
   ```bash
   eas submit
   ```

For development builds, EAS Build enables you to create native builds with custom native code and configurations. The development build includes `expo-dev-client`, which allows you to load your app and test development features. See [Expo EAS Build documentation](https://docs.expo.dev/build/introduction/) for more information.

### 2. Set Up Supabase

1. Create a new project at [database.new](https://database.new)
2. Go to [API Settings](https://supabase.com/dashboard/project/_/settings/api) and copy your Project URL
3. Go to [API Keys](https://supabase.com/dashboard/project/_/settings/api-keys) and copy your Publishable key
4. Run the migration file located at `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor

### 3. Configure Environment Variables

Create a `.env` file in the root directory (see `.env.example` for reference):

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_key

# Moondream API Configuration (Vision Analysis)
EXPO_PUBLIC_MOONDREAM_API_KEY=your_moondream_api_key
EXPO_PUBLIC_MOONDREAM_API_URL=https://api.moondream.ai/v1

# Groq Whisper API Configuration (Speech-to-Text)
EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key
EXPO_PUBLIC_GROQ_WHISPER_URL=wss://api.groq.com/v1/audio/transcriptions

# ElevenLabs TTS API Configuration (Text-to-Speech)
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key
EXPO_PUBLIC_ELEVENLABS_API_URL=https://api.elevenlabs.io/v1
```

### 4. Set Up Supabase Edge Functions

The app uses Supabase Edge Functions for secure API proxying. Deploy the Moondream reasoning function:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Deploy Edge Functions
supabase functions deploy moondream-reasoning

# Set secrets for Edge Functions
supabase secrets set MOONDREAM_API_KEY=your_moondream_api_key
supabase secrets set MOONDREAM_API_URL=https://api.moondream.ai/v1
```

### 5. Run Database Migrations

Run all migration files in your Supabase SQL editor (in order):

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_ai_sessions.sql`
3. `supabase/migrations/003_volunteer_matching.sql`
4. `supabase/migrations/004_update_confidence_threshold.sql`

These migrations set up:
- User profiles with role-based access
- AI session tracking with Realtime sync
- Volunteer matching with location and load balancing
- Updated confidence threshold (0.55 default)

### 6. Run the App

After setting up EAS and installing `expo-dev-client`, you can run the app locally on iOS or Android simulators.

#### Local Development Build (Recommended)

For development with custom native code, run locally:

**iOS:**
```bash
npm run ios
```

This command:
- Builds the iOS app with native dependencies (uses Xcode/CocoaPods)
- Installs the development client on the iOS simulator
- Starts Metro bundler
- Opens the app in the simulator

The first build may take several minutes as it compiles all native modules. Subsequent builds are faster.

**Android:**
```bash
npm run android
```

**Web:**
```bash
npm run web
```

#### Development Server Only

To start only the Metro bundler (without building native code):

```bash
npm start
```

Then scan the QR code with:
- **Development build**: Your custom development client app (recommended)
- **Expo Go**: Standard Expo Go app from the App Store (limited - some native modules may not work)

**Note:** After installing `expo-dev-client`, the project uses a development build. Use the development client (installed via `npm run ios` or `npm run android`) rather than Expo Go for full functionality, especially for native modules like camera, WebRTC, and voice recognition.

## Project Structure

```
imboni/
├── app/                           # Expo Router app directory
│   ├── (auth)/                   # Authentication screens
│   ├── (user-tabs)/              # User-specific tabs (blind/low vision)
│   ├── (volunteer-tabs)/         # Volunteer-specific tabs
│   ├── ai-camera.tsx             # Real-time AI vision analysis screen
│   └── call.tsx                  # Video call screen
├── contexts/                      # React contexts
│   ├── AuthContext.tsx           # Authentication context
│   └── AIContext.tsx             # AI session context
├── lib/
│   ├── services/
│   │   ├── vision/               # Vision services
│   │   │   ├── moondreamEncoder.ts      # On-device encoding (Expo ML)
│   │   │   └── moondreamReasoning.ts    # Cloud reasoning via Edge Function
│   │   ├── audio/                # Audio services
│   │   │   ├── whisperGroq.ts           # Groq Whisper STT (WebSocket)
│   │   │   ├── whisperFallback.ts       # STT retry logic
│   │   │   └── elevenLabsTTS.ts         # ElevenLabs TTS (streaming)
│   │   ├── camera/               # Camera services
│   │   │   └── frameCapture.ts          # Continuous frame capture (1-4 FPS)
│   │   └── realtime/             # Realtime services
│   │       ├── interactionLoop.ts       # Main interaction orchestrator
│   │       ├── sessionContext.ts        # Session management
│   │       ├── confidenceHandler.ts     # Volunteer fallback logic
│   │       ├── volunteerMatching.ts     # Volunteer matching service
│   │       └── webrtcStub.ts            # WebRTC placeholder
│   ├── utils/
│   │   ├── errorHandling.ts      # Centralized error handling
│   │   ├── throttling.ts         # API rate limiting
│   │   ├── logger.ts             # Structured logging
│   │   └── aiResponse.ts         # AI response formatting
│   ├── supabase.ts               # Supabase client
│   └── types.ts                  # TypeScript types
└── supabase/
    ├── migrations/               # Database migrations
    │   ├── 001_initial_schema.sql
    │   ├── 002_ai_sessions.sql
    │   ├── 003_volunteer_matching.sql
    │   └── 004_update_confidence_threshold.sql
    └── functions/                # Supabase Edge Functions
        └── moondream-reasoning/  # Moondream API proxy
            └── index.ts
```

## Database Schema

The app uses the following main tables:

- `profiles`: User profiles with role (user/volunteer), availability status, location, and AI preferences
- `call_requests`: Call requests with status tracking (pending/active/completed/cancelled) and location
- `ai_sessions`: AI session tracking with conversation history and confidence metrics (Realtime enabled)

Key features:
- Volunteer matching based on proximity, availability, and load balancing
- Confidence threshold: 0.55 (configurable per user)
- Realtime synchronization for session state

## Features in Detail

### Authentication

- Email/password authentication
- Role selection during signup (User or Volunteer)
- Automatic profile creation on signup
- Role-based UI routing (users and volunteers see different interfaces)

### AI Vision Assistant

- Real-time continuous frame analysis (1-4 FPS, configurable)
- On-device image encoding with Expo ML (Moondream encoder)
- Cloud-based reasoning via Supabase Edge Functions
- Natural language responses using ElevenLabs TTS
- Confidence-based volunteer fallback (threshold: 0.55)
- Automatic interruption handling (user speech stops AI response)
- Session context tracking for better responses

### Voice Recognition

- Groq Whisper streaming STT (WebSocket-based)
- Real-time speech-to-text with confidence scores
- Automatic retry logic for low confidence
- Fallback to volunteer assistance if STT fails

### Call Matching

- Location-based volunteer matching (Haversine distance)
- Load balancing (active calls count)
- Proximity-based selection
- Real-time notifications via Supabase Realtime
- Automatic retry with up to 3 volunteers

### Video Calling

The current implementation includes a basic video call interface. For production use, integrate a WebRTC solution such as:

- `react-native-webrtc` for peer-to-peer video
- A signaling server (can be built with Supabase Realtime)
- STUN/TURN servers for NAT traversal
- E2EE (end-to-end encryption) via WebRTC DTLS-SRTP

## Next Steps

1. **Set up Supabase project** and run the migration
2. **Configure environment variables** with your Supabase credentials
3. **Test authentication** flow
4. **Integrate WebRTC** for actual video streaming
5. **Set up push notifications** using Expo Notifications
6. **Add call history** and rating system
7. **Implement language preferences** and filtering

## Technologies Used

- React Native
- Expo
- Expo Router (file-based routing)
- Supabase (Backend, Auth, Database, Realtime)
- TypeScript
- Expo SQLite (for localStorage polyfill)

## License

MIT
