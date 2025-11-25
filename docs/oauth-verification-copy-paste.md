# Google OAuth Verification - Ready to Copy & Paste

Copy the text below directly into the "Additional info" section of your Google OAuth verification form.

---

## Copy-Paste Version (Basic Scopes Only)

```
Imboni is an AI-powered vision assistant web application designed specifically to help blind and low vision users understand their surroundings through real-time visual analysis and audio descriptions. The application uses live camera feeds to analyze scenes and delivers contextual information through text-to-speech, making visual information accessible to users with visual impairments.

WHY OAUTH IS REQUIRED:
Google OAuth authentication is used to provide users with a secure and convenient way to create accounts and access their saved analysis history. We use OAuth as an alternative authentication method alongside email/password authentication.

CURRENT SCOPES REQUESTED:
- email: Used to identify users and associate their account with their Google email address
- profile: Used to retrieve the user's display name and basic profile information for personalized experience  
- openid: Required for OpenID Connect authentication protocol

SCOPE USAGE:
- Email: Stored securely in our database to uniquely identify users and enable account recovery
- Profile: Used to personalize the user experience (e.g., displaying user's name in the dashboard)
- OpenID: Used for secure authentication and session management

These scopes are essential for basic user account functionality and do not provide access to sensitive user data beyond what's needed for authentication.

ACCESSIBILITY FOCUS:
This application is built with accessibility as a core principle. We support full keyboard navigation, screen reader compatibility (ARIA labels and announcements), high contrast mode support, reduced motion preferences, and large touch targets for mobile accessibility. Our use of OAuth aligns with accessibility best practices by providing users with familiar authentication methods they may already be comfortable using.

TECHNICAL IMPLEMENTATION:
- Authentication Provider: Supabase Auth (using Google OAuth provider)
- OAuth Flow: Authorization code flow with PKCE
- Redirect URI: Configured in Supabase dashboard and matches Google Cloud Console settings
- Token Storage: Handled securely by Supabase Auth service

PRODUCTION URLS:
Production: https://[YOUR_DOMAIN] (replace with your actual domain)
Development: http://localhost:3000 (local testing only)

SUPABASE PROJECT ID:
[YOUR_SUPABASE_PROJECT_ID] (replace with your actual Supabase project ID)

RELATED PROJECTS:
This is the first and only project using OAuth.

PRIVACY AND DATA HANDLING:
User email addresses are stored securely in our Supabase database. Profile information (name) is stored only for display purposes within the application. We do not share user data with third parties. Users can delete their accounts at any time, which removes all associated data.

SECURITY MEASURES:
All authentication is handled through Supabase's secure OAuth implementation. Tokens are managed by Supabase and not stored in our application code. HTTPS is enforced in production environments.

COMPLIANCE:
We comply with Google's API Services User Data Policy. We follow best practices for OAuth implementation. User data is handled in accordance with privacy regulations.

PROJECT REPOSITORY:
https://github.com/supserrr/imboni
```

---

## Instructions

1. **Copy the text above** (from "Imboni is an AI-powered..." to the end)
2. **Replace placeholders**:
   - `[YOUR_DOMAIN]` → Your production domain (e.g., `imboni.com`)
   - `[YOUR_SUPABASE_PROJECT_ID]` → Your Supabase project ID
3. **Add test credentials** (if requested):
   ```
   TEST CREDENTIALS:
   Email: [test-email@gmail.com]
   Password: [test-password]
   Note: This is a test account created specifically for verification purposes.
   ```
4. **Paste into the form** field

---

## If You're Adding Sensitive/Restricted Scopes

If you're requesting sensitive or restricted scopes, add this section before the closing:

```
ADDITIONAL SCOPE JUSTIFICATIONS:

[SCOPE_NAME] (e.g., https://www.googleapis.com/auth/gmail.readonly)

Why this scope is needed: [Clear explanation]
How it's used: [Detailed description]
User benefit: [How this improves UX for blind/low vision users]
Data handling: [How data is stored, processed, and protected]

Example:
Gmail Read-only Access (https://www.googleapis.com/auth/gmail.readonly)
- Why: To enable users to receive audio descriptions of important emails
- How: The app reads email subject lines and senders, then converts them to audio descriptions
- User benefit: Makes email management accessible to users with visual impairments
- Data handling: Email data is only accessed when explicitly requested, processed in real-time, and never stored permanently
```

---

## Quick Reference Checklist

Before submitting, ensure you've replaced:
- [ ] `[YOUR_DOMAIN]` with your production URL
- [ ] `[YOUR_SUPABASE_PROJECT_ID]` with your Supabase project ID
- [ ] Added test credentials if required
- [ ] Added scope justifications if requesting sensitive scopes
- [ ] Verified all URLs are correct and accessible

