# Fix: "No Access Token Received from OAuth Provider"

## What This Error Means

Google OAuth is **enabled** in Supabase, but the **Client ID and Client Secret** aren't configured, so Supabase can't complete the OAuth token exchange with Google.

## ✅ Quick Fix: Configure Google OAuth Credentials

### Step 1: Get Google OAuth Credentials

#### Option A: If You Already Have Them
Skip to Step 2 and enter your existing credentials.

#### Option B: Create New Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your project (or create one)
3. Click **"Create Credentials"** → **"OAuth client ID"**
4. If prompted, configure the **OAuth consent screen** first:
   - App name: **Imboni**
   - User support email: your email
   - Developer contact: your email
   - Save and continue

5. **Create Web Application OAuth Client:**
   - Application type: **Web application**
   - Name: **Imboni Supabase**
   - Authorized redirect URIs: Add this URL:
     ```
     https://pwggbckrgrlmmwyjfanm.supabase.co/auth/v1/callback
     ```
   - Click **"Create"**

6. **Copy the credentials:**
   - ✅ Client ID (looks like: `xxxxx.apps.googleusercontent.com`)
   - ✅ Client Secret (looks like: `GOCSPX-xxxxx`)

### Step 2: Configure Credentials in Supabase

1. **Go to Supabase Google Provider Settings:**
   https://app.supabase.com/project/pwggbckrgrlmmwyjfanm/auth/providers

2. **Find Google** in the providers list

3. **Click to expand Google settings**

4. **Make sure "Enable Google provider" is toggled ON** ✅

5. **Enter your credentials:**
   - **Client ID (for OAuth):** Paste your Web Application Client ID
   - **Client Secret (for OAuth):** Paste your Client Secret

6. **Click "Save"** at the bottom

### Step 3: Test OAuth Again

After saving the credentials:

1. **Restart your app** (press `r` in the Metro terminal)
2. **Navigate to signup/login**
3. **Tap "Continue with Google"**
4. **Sign in with your Google account**
5. **You should be redirected back to the app and logged in!** 🎉

## What the Logs Will Show

**With enhanced logging, you'll now see:**

### Before Fix (No Credentials):
```
[AuthService] OAuth success! Full callback URL: imboni://auth/callback
[AuthService] Parsed URL parameters: {
  has_access_token: false,
  has_refresh_token: false
}
[AuthService] No access token found in callback URL
[AuthService] This usually means Google OAuth credentials are not configured
```

### After Fix (With Credentials):
```
[AuthService] OAuth success! Full callback URL: imboni://auth/callback#access_token=...
[AuthService] Parsed URL parameters: {
  has_access_token: true,
  has_refresh_token: true
}
[AuthService] Setting session with tokens...
[AuthService] Session set successfully
[AuthService] Updating user metadata...
```

## Why This Happens

The OAuth flow has these steps:

1. ✅ User taps "Continue with Google"
2. ✅ Browser opens with Supabase OAuth URL
3. ✅ Supabase redirects to Google
4. ✅ User signs in with Google
5. ✅ Google sends authorization code to Supabase
6. ❌ **Supabase tries to exchange code for tokens BUT FAILS** ← You are here
7. ❌ Supabase redirects to app without tokens
8. ❌ App shows "No access token received" error

**Why Step 6 fails:** Supabase needs your Google OAuth Client ID and Client Secret to exchange the authorization code for access tokens. Without these credentials, the token exchange fails silently.

## Verification Checklist

After configuring, verify:

- [ ] Google provider shows "Enabled" in Supabase dashboard
- [ ] Client ID is filled in (ends with `.apps.googleusercontent.com`)
- [ ] Client Secret is filled in (starts with `GOCSPX-`)
- [ ] Authorized redirect URI in Google Console includes your Supabase callback URL
- [ ] You clicked "Save" in Supabase dashboard

## Still Having Issues?

### Check Google Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID
3. Verify **Authorized redirect URIs** includes:
   ```
   https://pwggbckrgrlmmwyjfanm.supabase.co/auth/v1/callback
   ```
4. If missing, add it and click Save

### Check App Logs

After tapping "Continue with Google", check the terminal for:
```
[AuthService] OAuth success! Full callback URL: ...
```

Share the full log output and I can help diagnose further.

## Complete OAuth Flow (After Fix)

```
User taps button
↓
App calls Supabase signInWithOAuth()
↓
Supabase generates OAuth URL
↓
Browser opens with Google sign-in
↓
User signs in with Google
↓
Google returns authorization code to Supabase
↓
✅ Supabase exchanges code for tokens (using your Client ID/Secret)
↓
✅ Supabase redirects to app with access_token
↓
✅ App extracts tokens and creates session
↓
✅ User is logged in! 🎉
```

---

**TL;DR: Add Google OAuth Client ID and Client Secret to Supabase Dashboard → Authentication → Google Provider**

