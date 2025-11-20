# Imboni Data Storage Documentation

This document outlines all user data collected and stored in the application.

## Database Schema

### 1. Authentication Data (Supabase Auth)
Stored in `auth.users` table (managed by Supabase):
- ✅ **Email** - User's email address
- ✅ **Password** - Encrypted password hash
- ✅ **Email Verified** - Email verification status
- ✅ **OAuth Tokens** - Google OAuth tokens (if using Google sign-in)
- ✅ **Created At** - Account creation timestamp
- ✅ **Last Sign In** - Last login timestamp

### 2. User Profile Data (public.users)
Extended user information stored in custom `users` table:

#### Core Identity
- ✅ **ID** (UUID) - References auth.users.id
- ✅ **Type** (enum) - 'blind' or 'volunteer'
- ✅ **Full Name** (TEXT) - User's full name
- ✅ **Preferred Language** (TEXT) - Language code (e.g., 'en', 'es', 'fr')
  - Auto-detected from device on signup
  - Can be changed in settings

#### Contact Information
- ✅ **Phone Number** (TEXT, optional) - User's phone number
- ✅ **Profile Picture URL** (TEXT, optional) - URL to profile image
- ✅ **Bio** (TEXT, optional) - User description/bio

#### Device & Notifications
- ✅ **Notification Token** (TEXT) - Expo push notification token
  - Automatically registered after login
  - Used for push notifications
- ✅ **Device Info** (JSONB) - Device information stored as JSON:
  ```json
  {
    "os": "ios" | "android",
    "model": "Device model name",
    "version": "OS version"
  }
  ```

#### Availability & Metrics (for Volunteers)
- ✅ **Availability** (BOOLEAN) - Whether volunteer is currently available
- ✅ **Rating** (FLOAT) - Average user rating (default: 5.0)
- ✅ **Reliability Score** (FLOAT) - Algorithm-calculated score (default: 100.0)
- ✅ **History Count** (INTEGER) - Total sessions completed
- ✅ **Last Active** (TIMESTAMP) - Last activity timestamp

#### Timestamps
- ✅ **Created At** (TIMESTAMP) - Profile creation time
- ✅ **Updated At** (TIMESTAMP) - Last profile update (auto-updated via trigger)

### 3. Volunteer Behavior Data (public.volunteer_behavior)
Only for users with type='volunteer':
- ✅ **Volunteer ID** (UUID) - References users.id
- ✅ **Accept Count** (INTEGER) - Number of help requests accepted
- ✅ **Decline Count** (INTEGER) - Number of help requests declined
- ✅ **Response Time Avg** (FLOAT) - Average response time in seconds
- ✅ **Success Sessions** (INTEGER) - Number of successfully completed sessions
- ✅ **Last Active** (TIMESTAMP) - Last activity timestamp
- ✅ **Created At** (TIMESTAMP)
- ✅ **Updated At** (TIMESTAMP)

### 4. Help Requests (public.help_requests)
When a blind user requests help:
- ✅ **ID** (UUID) - Unique request identifier
- ✅ **User ID** (UUID) - Blind user requesting help
- ✅ **Status** (enum) - 'pending', 'accepted', 'declined', 'in_progress', 'completed', 'cancelled'
- ✅ **Assigned Volunteer** (UUID, nullable) - Volunteer assigned to request
- ✅ **Created At** (TIMESTAMP) - Request creation time
- ✅ **Updated At** (TIMESTAMP) - Last update time

### 5. Sessions (public.sessions)
Live video session records:
- ✅ **ID** (UUID) - Unique session identifier
- ✅ **Help Request ID** (UUID) - Associated help request
- ✅ **User ID** (UUID) - Blind user in session
- ✅ **Volunteer ID** (UUID) - Volunteer in session
- ✅ **Started At** (TIMESTAMP) - Session start time
- ✅ **Ended At** (TIMESTAMP, nullable) - Session end time
- ✅ **Duration** (INTEGER) - Session duration in seconds
- ✅ **Rating** (FLOAT, nullable) - User rating for the session
- ✅ **Created At** (TIMESTAMP)

## Data Collection Flow

### During Signup
1. **Email/Password signup:**
   - Email → `auth.users.email`
   - Password (hashed) → `auth.users.encrypted_password`
   - Full Name → `users.full_name`
   - User Type (from welcome screen) → `users.type`
   - Device Language → `users.preferred_language`
   - Device Info → `users.device_info`

2. **Google OAuth signup:**
   - Email → `auth.users.email`
   - Google OAuth token → `auth.users` (managed by Supabase)
   - User Type (from welcome screen) → `users.type`
   - Device Language → `users.preferred_language`
   - Device Info → `users.device_info`

### After Login
1. **Notification Token:**
   - Automatically requests permission
   - Registers Expo push token
   - Saves to `users.notification_token`

### During App Usage
1. **Profile Updates:**
   - Users can update: full_name, phone_number, bio, profile_picture_url
   - Saved to `users` table

2. **Help Requests:**
   - Blind user creates request → `help_requests`
   - Volunteer accepts → Updates `help_requests.assigned_volunteer`
   - Session starts → Creates record in `sessions`
   - Session ends → Updates `sessions.ended_at`, `sessions.duration`
   - User rates session → Updates `sessions.rating`

3. **Volunteer Metrics:**
   - Response to requests → Updates `volunteer_behavior.accept_count` or `decline_count`
   - Session completion → Updates `volunteer_behavior.success_sessions`
   - Activity → Updates `users.last_active`

## Privacy & Security

### Data Protection
- ✅ All passwords are hashed using Supabase Auth's secure encryption
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Users can only access their own data
- ✅ Video streams use end-to-end encryption (Agora.io)
- ✅ API keys and tokens stored in secure storage (expo-secure-store)

### Data Access Policies
- ✅ Users can view/update their own profile
- ✅ Volunteers can view pending help requests
- ✅ Only assigned volunteers can view specific help request details
- ✅ Both participants can view session details
- ✅ Public profiles are viewable by all (for matching)

### Data Retention
- User profiles: Kept until account deletion
- Sessions: Kept indefinitely for history
- Help requests: Kept indefinitely for analytics
- Notification tokens: Updated on each login

## GDPR Compliance

### User Rights
Users can request to:
1. **Access** their data (via profile screen)
2. **Update** their data (via settings)
3. **Delete** their account (will cascade delete all related data)
4. **Export** their data (to be implemented)

### Data Minimization
- Only collect data necessary for app functionality
- Optional fields: phone_number, bio, profile_picture_url
- Device info limited to OS, model, version (no IMEI, MAC addresses, etc.)

## Future Enhancements
- [ ] Profile picture upload to Supabase Storage
- [ ] Call recording metadata (for safety/review)
- [ ] User feedback and reviews system
- [ ] Analytics events (anonymized)

