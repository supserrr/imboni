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
- Expo CLI
- Supabase account

## Setup Instructions

### 1. Install Dependencies

   ```bash
   npm install
   ```

### 2. Set Up Supabase

1. Create a new project at [database.new](https://database.new)
2. Go to [API Settings](https://supabase.com/dashboard/project/_/settings/api) and copy your Project URL
3. Go to [API Keys](https://supabase.com/dashboard/project/_/settings/api-keys) and copy your Publishable key
4. Run the migration file located at `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_key
```

### 4. Run the App

```bash
# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

## Project Structure

```
imboni/
├── app/                    # Expo Router app directory
│   ├── (auth)/            # Authentication screens
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/            # Main app tabs
│   │   ├── index.tsx      # Home screen
│   │   └── profile.tsx    # Profile screen
│   ├── call.tsx           # Video call screen
│   └── _layout.tsx        # Root layout
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context
├── lib/                   # Utility libraries
│   ├── supabase.ts       # Supabase client
│   └── types.ts          # TypeScript types
└── supabase/
    └── migrations/        # Database migrations
        └── 001_initial_schema.sql
```

## Database Schema

The app uses the following main tables:

- `profiles`: User profiles with role (user/volunteer) and availability status
- `call_requests`: Call requests with status tracking (pending/active/completed/cancelled)

## Features in Detail

### Authentication

- Email/password authentication
- Role selection during signup (User or Volunteer)
- Automatic profile creation on signup

### Call Matching

- Users can request help by creating a call request
- Volunteers receive real-time notifications when requests are made
- Volunteers can accept or decline requests
- Both parties are connected when a volunteer accepts

### Video Calling

The current implementation includes a basic video call interface. For production use, integrate a WebRTC solution such as:

- `react-native-webrtc` for peer-to-peer video
- A signaling server (can be built with Supabase Realtime)
- STUN/TURN servers for NAT traversal

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
