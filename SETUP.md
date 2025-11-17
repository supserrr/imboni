# Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Create a project at [database.new](https://database.new)
   - Copy your Project URL and Publishable key from the dashboard
   - Run the SQL migration from `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor

3. **Configure environment:**
   - Create a `.env` file in the root directory:
     ```
     EXPO_PUBLIC_SUPABASE_URL=your_project_url_here
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your_publishable_key_here
     ```

4. **Run the app:**
   ```bash
   npm start
   ```

## Supabase Setup Details

### Running the Migration

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
5. Run the query

This will create:
- `profiles` table for user data
- `call_requests` table for call management
- Row Level Security (RLS) policies
- Automatic profile creation trigger

### Getting Your API Keys

1. **Project URL:**
   - Go to [Settings > API](https://supabase.com/dashboard/project/_/settings/api)
   - Copy the "Project URL"

2. **Publishable Key:**
   - Go to [Settings > API Keys](https://supabase.com/dashboard/project/_/settings/api-keys)
   - Copy the "anon public" key (this is safe to expose in your app)

## Testing the App

1. **Sign up as a User:**
   - Create an account with role "Get Help"
   - This simulates a visually impaired user

2. **Sign up as a Volunteer:**
   - Create another account with role "Help Others"
   - Go to profile and toggle "Go Online"

3. **Test the flow:**
   - As a user, tap "Request Help"
   - As a volunteer, you should receive an alert to accept the call
   - Accept the call to start a video session

## Next Steps for Production

1. **Integrate WebRTC:**
   - Install `react-native-webrtc`
   - Set up a signaling server (can use Supabase Realtime)
   - Configure STUN/TURN servers

2. **Add Push Notifications:**
   - Configure Expo Notifications
   - Set up notification handlers for call requests

3. **Enhance Features:**
   - Call history
   - User ratings
   - Language preferences
   - Call recording (with consent)

## Troubleshooting

### "Supabase client not initialized"
- Make sure your `.env` file exists and has the correct values
- Restart the Expo development server after adding environment variables

### "Permission denied" errors
- Check that you've run the SQL migration
- Verify RLS policies are set up correctly
- Ensure the user is authenticated

### Real-time subscriptions not working
- Check that Realtime is enabled in your Supabase project
- Verify the channel names match in your code

