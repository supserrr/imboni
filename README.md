# Imboni Visual Assistance Platform

This repository contains the backend services and mobile app for the Imboni visual assistance platform, which connects blind and low-vision users with sighted volunteers via video calls.

## Services Overview

### Supabase

PostgreSQL database with real-time capabilities for:

- **Authentication**: User management via Supabase Auth
- **Database Tables**:
  - `users` - User profiles (blind/volunteer types)
  - `help_requests` - Help request matching system
  - `sessions` - Video call session tracking
  - `volunteer_behavior` - Volunteer metrics and ratings
- **Real-time Subscriptions**: Live updates for help requests and sessions
- **Row Level Security**: Database-level security policies
- **Edge Functions**: Serverless functions for Agora token generation

See `supabase/migrations/001_initial_schema.sql` for the complete schema.

### Mobile App

React Native mobile application built with Expo:

- **Blind User Interface**: Request help from volunteers with a simple "Call a volunteer" button
- **Volunteer Interface**: Accept/decline help requests and provide assistance via video calls
- **Real-time Matching**: Automatic volunteer assignment and retry logic
- **Video Calls**: Integrated Agora video calling for real-time assistance
- **Push Notifications**: Notify volunteers when help requests are created

## Quick Start

### Prerequisites

- Node.js 18+ (for mobile app)
- Supabase account
- Agora account (for video calls)
- Expo account (for push notifications)

### Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Agora Configuration (for video calls)
EXPO_PUBLIC_AGORA_APP_ID=your_agora_app_id
EXPO_PUBLIC_AGORA_ENCRYPTION_KEY=your_agora_encryption_key
EXPO_PUBLIC_AGORA_ENCRYPTION_SALT=your_agora_encryption_salt
```

### Supabase Setup

1. **Database Schema**: Apply the database schema:

```bash
# Via Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Run the contents of supabase/migrations/001_initial_schema.sql

# Or via Supabase CLI:
supabase db push
```

2. **Edge Functions**: Deploy the Agora token generation function:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy generate-agora-token
```

3. **Environment Variables for Edge Function**: Set the following secrets in Supabase Dashboard:
   - `AGORA_APP_ID`: Your Agora App ID
   - `AGORA_APP_CERTIFICATE`: Your Agora App Certificate

### Mobile App Setup

```bash
cd mobile

# Install dependencies
npm install

# Start the development server
npx expo start
```

## Project Structure

```
imboni/
├── mobile/                    # React Native mobile app
│   ├── app/                   # Expo Router app structure
│   │   ├── (blind-tabs)/      # Blind user interface
│   │   ├── (volunteer-tabs)/  # Volunteer interface
│   │   └── (auth)/            # Authentication screens
│   ├── components/            # Reusable components
│   ├── services/              # API services
│   └── types/                 # TypeScript types
├── supabase/                  # Supabase configuration
│   ├── migrations/            # Database migrations
│   └── functions/             # Edge Functions
│       └── generate-agora-token/  # Agora token generation
├── env.example               # Environment variables template
└── README.md                 # This file
```

## How It Works

### Help Request Flow

1. **Blind User**: Taps "Call a volunteer" button
2. **System**: Creates a help request and automatically finds the best available volunteer
3. **Volunteer**: Receives push notification with accept/decline options
4. **Connection**: If volunteer accepts, video call is initiated via Agora
5. **Assistance**: Volunteer sees the blind user's camera view and provides verbal assistance
6. **Completion**: After call ends, blind user can rate the experience

### Volunteer Matching

The system uses a scoring algorithm to match volunteers:
- **Reliability Score**: Based on volunteer's history
- **Response Time**: Average time to accept requests
- **Rating**: User ratings from previous calls

### Retry Logic

- If a volunteer declines, the system automatically finds the next best volunteer
- 30-second timeout for volunteer acceptance
- Unlimited retries until a volunteer accepts or user cancels
- Requests are queued if no volunteers are available

## API Documentation

### Supabase Edge Functions

#### generate-agora-token

Generates Agora RTC tokens for video calls.

**Request**:
```json
{
  "userId": "user-uuid",
  "volunteerId": "volunteer-uuid",
  "requestId": "request-uuid"
}
```

**Response**:
```json
{
  "token": "agora-rtc-token",
  "channelName": "help_request_xxx",
  "uid": 12345678
}
```

### Database Tables

See `supabase/migrations/001_initial_schema.sql` for complete schema documentation.

## Development

### Local Development

1. **Start Supabase locally** (optional):
```bash
supabase start
```

2. **Run mobile app**:
```bash
cd mobile
npx expo start
```

3. **Test on device**: Use Expo Go app or build for iOS/Android

### Testing

- Test help request creation
- Test volunteer matching and auto-assignment
- Test volunteer accept/decline flow
- Test retry logic when volunteer declines
- Test timeout handling (30 seconds)
- Test queue when no volunteers available
- Test real-time status updates
- Test video call initiation with Agora tokens
- Test push notifications for volunteers
- Test rating flow after call ends

## Deployment

### Supabase

Supabase is a cloud-hosted service. Your database runs on Supabase's infrastructure. Migrations can be applied via:
- Supabase Dashboard SQL Editor
- Supabase CLI (`supabase db push`)

Edge Functions can be deployed via:
- Supabase Dashboard Functions page
- Supabase CLI (`supabase functions deploy`)

### Mobile App

Deploy to app stores:
- **iOS**: Build with EAS Build and submit to App Store
- **Android**: Build with EAS Build and submit to Google Play Store

See Expo documentation for detailed deployment instructions.

## License

Private project
