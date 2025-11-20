# Google OAuth Setup for Imboni Mobile App

This document explains how to configure Google OAuth authentication for the Imboni app using Supabase.

## Overview

The app uses [Supabase Auth](https://supabase.com/docs/guides/auth) with Google OAuth provider for authentication. Following [Expo documentation](https://docs.expo.dev/), we use `expo-web-browser` and `expo-auth-session` for a native OAuth flow.

## Prerequisites

1. ✅ Supabase project created
2. ✅ Google Cloud Console project
3. ✅ Expo project configured with proper URL scheme (`imboni://`)

## Step 1: Configure Google Cloud Console

### 1.1 Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth client ID**

### 1.2 Configure OAuth Consent Screen

Before creating credentials, configure the consent screen:
- User Type: External (for public apps) or Internal (for organization)
- App name: **Imboni**
- User support email: Your email
- App domain: `imboni.app`
- Authorized domains: `imboni.app`, your Supabase project URL
- Developer contact: Your email

### 1.3 Create iOS OAuth Client

1. Application type: **iOS**
2. Name: `Imboni iOS`
3. Bundle ID: `com.imboni.app` (from `app.json`)
4. Save the **Client ID** - you'll need this

### 1.4 Create Android OAuth Client

1. Application type: **Android**
2. Name: `Imboni Android`
3. Package name: `com.imboni.app` (from `app.json`)
4. SHA-1 certificate fingerprint:
   - For development: Get from `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`
   - For production: Get from your release keystore
5. Save the **Client ID**

### 1.5 Create Web OAuth Client (for Supabase)

1. Application type: **Web application**
2. Name: `Imboni Supabase`
3. Authorized redirect URIs:
   ```
   https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback
   ```
4. Save the **Client ID** and **Client Secret**

## Step 2: Configure Supabase

### 2.1 Enable Google Provider

1. Go to your Supabase project dashboard
2. Navigate to **Authentication > Providers**
3. Find **Google** and click to configure
4. Enable the Google provider
5. Enter:
   - **Client ID**: Web client ID from Step 1.5
   - **Client Secret**: Web client secret from Step 1.5
6. Authorized redirect URLs should auto-populate
7. Click **Save**

### 2.2 Configure Additional Redirect URLs

In **Authentication > URL Configuration**, add:
```
imboni://auth/callback
```

This allows Supabase to redirect back to your app after OAuth.

## Step 3: Configure Mobile App Environment Variables

Add to your `.env.local` file:

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://<YOUR_PROJECT_REF>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<YOUR_ANON_KEY>

# Google OAuth Client IDs
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<WEB_CLIENT_ID_FROM_STEP_1.5>
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<IOS_CLIENT_ID_FROM_STEP_1.3>
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=<ANDROID_CLIENT_ID_FROM_STEP_1.4>
```

## Step 4: App Configuration

The app is already configured with the following:

### URL Scheme (`app.json`)
```json
{
  "expo": {
    "scheme": "imboni"
  }
}
```

### Deep Linking Handler (`app/_layout.tsx`)
- Listens for OAuth callback URLs
- Extracts tokens and sets session
- Redirects to appropriate screen

### OAuth Service (`services/auth.ts`)
- `signInWithGoogle()`: Initiates OAuth flow
- `handleOAuthCallback()`: Processes OAuth redirect
- `updateUserMetadataAfterOAuth()`: Stores user type and device info

## How OAuth Flow Works

### For New Users (Signup)

1. User selects "I need visual assistance" or "I'd like to volunteer" on welcome screen
2. User taps "Continue with Google" on signup screen
3. App stores user type temporarily in AsyncStorage
4. App opens Google OAuth consent screen in browser
5. User grants permissions
6. Google redirects to `imboni://auth/callback` with tokens
7. App extracts tokens and creates Supabase session
8. App retrieves stored user type and updates user metadata
9. Supabase trigger creates user profile in database
10. User is logged in and redirected to home screen

### For Returning Users (Login)

1. User taps "Continue with Google" on login screen
2. App opens Google OAuth (may skip consent if already granted)
3. Google redirects to `imboni://auth/callback` with tokens
4. App extracts tokens and sets Supabase session
5. User is logged in and redirected to home screen

## Testing OAuth

### Development Testing

1. **iOS Simulator:**
   ```bash
   cd mobile
   npx expo run:ios
   ```

2. **Android Emulator:**
   ```bash
   cd mobile
   npx expo run:android
   ```

3. **Physical Device:**
   ```bash
   npx expo start
   # Scan QR code with Expo Go app
   ```

### Testing Checklist

- [ ] Welcome screen displays correctly
- [ ] "Continue with Google" button opens browser
- [ ] Google consent screen shows app name and permissions
- [ ] After granting permissions, redirects back to app
- [ ] User is logged in and sees home screen
- [ ] User profile is created in Supabase database
- [ ] User type (blind/volunteer) is correctly stored
- [ ] Device language is auto-detected and stored
- [ ] Sign out works correctly
- [ ] Sign in again with same Google account works

## Troubleshooting

### OAuth Not Working

1. **Check redirect URLs:**
   - Supabase dashboard: Ensure `imboni://auth/callback` is in allowed URLs
   - Google Console: Ensure Supabase callback URL is in authorized redirect URIs

2. **Check client IDs:**
   - Verify you're using the correct client ID for each platform
   - Web client ID in Supabase settings
   - iOS/Android client IDs in environment variables

3. **Check URL scheme:**
   - Ensure `scheme: "imboni"` is in `app.json`
   - Rebuild app after changing scheme

4. **Check deep linking:**
   - Test deep link: `npx uri-scheme open imboni://auth/callback --ios`
   - Should open app if configured correctly

### Common Errors

**"Invalid redirect_uri"**
- Supabase callback URL not added to Google Console
- Solution: Add `https://<PROJECT_REF>.supabase.co/auth/v1/callback` to Google OAuth settings

**"Application not found"**
- URL scheme not configured
- Solution: Ensure `scheme` in `app.json`, rebuild app

**"Failed to get OAuth URL"**
- Supabase Google provider not enabled
- Solution: Enable Google provider in Supabase dashboard

**User metadata not saving**
- Supabase trigger not running
- Solution: Check `handle_new_user()` trigger exists in database

## Security Considerations

✅ **OAuth tokens never exposed to client code**
- Supabase handles token exchange securely
- Only access/refresh tokens are received by app

✅ **User type stored securely**
- Temporarily in AsyncStorage during OAuth flow
- Cleared after metadata update
- Final storage in Supabase database with RLS

✅ **Deep links validated**
- Only `imboni://` scheme accepted
- Callback handler validates token presence
- Errors redirect to login screen

## Production Deployment

Before deploying to production:

1. **Update OAuth consent screen:**
   - Change to production mode in Google Console
   - Update privacy policy and terms URLs

2. **Use production keystores:**
   - Generate production Android keystore
   - Update SHA-1 fingerprint in Google Console

3. **Configure production redirect URLs:**
   - Update Supabase allowed URLs if using custom domain

4. **Test end-to-end flow:**
   - Test on physical iOS device
   - Test on physical Android device
   - Verify all user data is correctly stored

## References

- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Expo Web Browser](https://docs.expo.dev/versions/latest/sdk/webbrowser/)
- [Expo Auth Session](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Expo Deep Linking](https://docs.expo.dev/guides/linking/)

