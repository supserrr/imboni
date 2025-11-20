# Debugging Google OAuth Issues

If clicking "Continue with Google" does nothing, follow these steps to diagnose the issue:

## Step 1: Check Console Logs

The app now has extensive logging. Open the terminal where you're running the app and look for logs starting with `[AuthService]`.

**Expected log flow:**
```
[AuthService] Starting Google OAuth with user type: blind
[AuthService] Stored user type in AsyncStorage
[AuthService] Calling Supabase signInWithOAuth...
[AuthService] Supabase OAuth response: { data: {...}, error: null }
[AuthService] Opening OAuth URL in browser: https://...
```

**Common issues:**

### Issue 1: Supabase OAuth returns an error
```
[AuthService] Supabase OAuth error: {...}
```
**Solution:** Check that Google provider is enabled in Supabase dashboard.

### Issue 2: No OAuth URL received
```
[AuthService] No OAuth URL received from Supabase
```
**Solution:** Google provider not configured correctly in Supabase.

### Issue 3: Browser doesn't open
The logs stop after "Opening OAuth URL in browser" but no browser appears.

**Solution:** Check app permissions and URL scheme configuration.

## Step 2: Verify Supabase Configuration

1. Go to Supabase Dashboard → Authentication → Providers
2. Click on Google
3. Verify:
   - ✅ Enabled toggle is ON
   - ✅ Client ID is filled in (Web OAuth client ID from Google Console)
   - ✅ Client Secret is filled in
   - ✅ Authorized redirect URLs shows your Supabase callback URL

If any of these are missing, follow the setup in `OAUTH_SETUP.md`.

## Step 3: Check Environment Variables

Make sure your `.env.local` file has:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Test it:**
```bash
cd mobile
cat .env.local | grep SUPABASE
```

If these are missing, the app can't connect to Supabase.

## Step 4: Verify URL Scheme

The app uses `imboni://` as the URL scheme for OAuth callbacks.

**Check app.json:**
```json
{
  "expo": {
    "scheme": "imboni"
  }
}
```

**Test deep linking:**
```bash
# iOS
npx uri-scheme open imboni://test --ios

# Android
npx uri-scheme open imboni://test --android
```

If the app doesn't open, the URL scheme isn't configured properly. You may need to rebuild the app:

```bash
# iOS
cd ios
pod install
cd ..
npx expo run:ios

# Android
npx expo run:android
```

## Step 5: Check Supabase Project Settings

1. Go to Supabase Dashboard → Project Settings → API
2. Copy your Project URL and anon key
3. Make sure they match your `.env.local` file

## Step 6: Test with Simple Alert

Add this temporary test to verify the button works:

```typescript
// In signup.tsx, temporarily change handleOAuthSignIn to:
const handleOAuthSignIn = async () => {
  Alert.alert('Button Works!', 'The button is responding to clicks');
  // Rest of your code...
};
```

If you don't see the alert, there's a UI/touch handling issue.

## Step 7: Check for Error Alerts

When you tap "Continue", watch for any error alerts that pop up. The error message will tell you exactly what's wrong:

- **"Failed to get OAuth URL from Supabase"** → Supabase Google provider not configured
- **"Authentication cancelled"** → User closed the browser
- **"No access token received"** → OAuth flow completed but tokens missing (check Supabase callback URL)

## Step 8: Test OAuth Flow Manually

You can test if the OAuth URL generation works:

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/auth/v1/oauth' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "options": {
      "redirectTo": "imboni://auth/callback"
    }
  }'
```

You should get back a JSON response with a `url` field. If not, check your Supabase Google provider configuration.

## Common Solutions

### Solution 1: Google Provider Not Configured

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Create OAuth 2.0 Web Application credentials
4. Add authorized redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
5. Copy Client ID and Secret
6. Paste into Supabase Dashboard → Authentication → Google Provider
7. Click Save

### Solution 2: Rebuild App After Config Changes

If you changed `app.json` (scheme, permissions, etc.):

```bash
cd mobile

# Delete existing builds
rm -rf ios android

# Prebuild with new config
npx expo prebuild

# Run on device
npx expo run:ios
# or
npx expo run:android
```

### Solution 3: Clear Metro Bundler Cache

```bash
cd mobile
npx expo start --clear
```

### Solution 4: Check Network Connection

OAuth requires internet. Make sure:
- Your device/simulator has internet access
- You can reach `https://accounts.google.com` from your device
- Your Supabase project URL is accessible

## Still Not Working?

Share your console logs (starting from when you tap the button) along with:
1. Are you on iOS or Android?
2. Simulator/emulator or physical device?
3. Any error alerts that appear?
4. What do the logs show?

This will help diagnose the specific issue.

