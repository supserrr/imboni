# Quick Fix for OAuth "Error 1" Issue

## Problem
Getting `ASWebAuthenticationSession error 1` and OAuth redirects to localhost instead of back to the app.

## Root Cause
The OAuth redirect isn't properly configured in Supabase to work with your mobile app.

## ✅ Solution: Configure Supabase Redirect URLs

### Step 1: Add Redirect URL in Supabase

1. Go to: https://app.supabase.com/project/pwggbckrgrlmmwyjfanm/auth/url-configuration
2. Scroll to **"Redirect URLs"** section
3. Click **"Add URL"**
4. Add: `imboni://auth/callback`
5. Click **"Save"**

### Step 2: Verify Google Provider Settings

1. Go to: https://app.supabase.com/project/pwggbckrgrlmmwyjfanm/auth/providers
2. Find **Google** provider
3. Make sure it's **Enabled** (toggle ON)
4. Verify you have:
   - ✅ Client ID (from Google Cloud Console)
   - ✅ Client Secret (from Google Cloud Console)

If missing, follow the Google OAuth setup in `OAUTH_SETUP.md`.

### Step 3: Rebuild App

The app configuration has been updated with Associated Domains. You need to rebuild:

```bash
cd /Users/password/imboni/mobile
rm -rf ios android
npx expo prebuild --clean
npx expo run:ios
```

## What Changed in the Code

### 1. Added Associated Domains to `app.json`:
```json
"ios": {
  "associatedDomains": ["applinks:pwggbckrgrlmmwyjfanm.supabase.co"]
}
```

This tells iOS that your app is allowed to handle redirects from your Supabase project.

### 2. Reverted OAuth Browser Config:
Removed `preferEphemeralSession: true` because it was causing the OAuth flow to fail. Now using the standard browser session that works reliably with Supabase.

## Testing After Fix

1. **Rebuild the app** (see Step 3 above)
2. **Navigate to signup/login**
3. **Tap "Continue with Google"**
4. **You should see**:
   - Google sign-in page opens
   - Sign in with your Google account
   - Grant permissions
   - **Automatically redirects back to the app** ✅
   - You're logged in!

## What You'll See in Logs

**Before fix:**
```
[AuthService] Browser result: {"error": "...", "type": "cancel"}
```

**After fix:**
```
[AuthService] Browser result: {"type": "success", "url": "imboni://auth/callback?access_token=..."}
[AuthService] OAuth success, extracting tokens...
[AuthService] Session set successfully
```

## Why This Happens

The error occurred because:
1. ❌ Supabase didn't have `imboni://` as an allowed redirect URL
2. ❌ iOS app didn't have Associated Domains configured
3. ❌ OAuth flow couldn't complete the redirect loop

Now fixed:
1. ✅ Associated Domains configured in `app.json`
2. ✅ Need to add redirect URL in Supabase dashboard
3. ✅ Rebuild app to apply changes
4. ✅ OAuth will work end-to-end

## Expected Behavior

**Normal iOS OAuth Flow:**
1. User taps "Continue with Google"
2. Safari browser/web view opens with Google sign-in
3. User signs in and grants permissions
4. Google redirects to Supabase: `https://pwggbckrgrlmmwyjfanm.supabase.co/auth/v1/callback`
5. Supabase processes the OAuth tokens
6. Supabase redirects to your app: `imboni://auth/callback?access_token=...`
7. Your app receives the tokens and creates a session
8. User is logged in! 🎉

That bottom toolbar you saw is normal Safari behavior - it will work correctly once the redirect is properly configured.

