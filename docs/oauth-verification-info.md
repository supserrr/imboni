# Google OAuth Verification - Additional Information Template

Use this template when filling out the "Additional info" section for Google OAuth app verification.

## 📝 Template for "Additional info" Section

Copy and customize the following based on your specific situation:

---

### App Description and Purpose

**Imboni** is an AI-powered vision assistant web application designed specifically to help blind and low vision users understand their surroundings through real-time visual analysis and audio descriptions. The application uses live camera feeds to analyze scenes and delivers contextual information through text-to-speech, making visual information accessible to users with visual impairments.

**Key Functionality:**
- Real-time visual analysis using live camera feeds
- Object detection and scene understanding
- Interactive queries about the environment
- Audio narration via customizable text-to-speech
- Analysis history storage (requires user authentication)

### OAuth Usage and Scope Justification

**Why OAuth is Required:**

Google OAuth authentication is used to provide users with a secure and convenient way to create accounts and access their saved analysis history. We use OAuth as an alternative authentication method alongside email/password authentication.

**Current Scopes Requested:**

- `email` - Used to identify users and associate their account with their Google email address
- `profile` - Used to retrieve the user's display name and basic profile information for personalized experience
- `openid` - Required for OpenID Connect authentication protocol

**Scope Usage:**

- **Email**: Stored securely in our database to uniquely identify users and enable account recovery
- **Profile**: Used to personalize the user experience (e.g., displaying user's name in the dashboard)
- **OpenID**: Used for secure authentication and session management

These scopes are essential for basic user account functionality and do not provide access to sensitive user data beyond what's needed for authentication.

### Accessibility Focus

This application is built with accessibility as a core principle. We support:
- Full keyboard navigation
- Screen reader compatibility (ARIA labels and announcements)
- High contrast mode support
- Reduced motion preferences
- Large touch targets for mobile accessibility

Our use of OAuth aligns with accessibility best practices by providing users with familiar authentication methods they may already be comfortable using.

### Technical Implementation

- **Authentication Provider**: Supabase Auth (using Google OAuth provider)
- **OAuth Flow**: Authorization code flow with PKCE
- **Redirect URI**: Configured in Supabase dashboard and matches Google Cloud Console settings
- **Token Storage**: Handled securely by Supabase Auth service

### Test Credentials (if applicable)

If you need to test the application, you can use the following test accounts:

**Test User Account:**
- Email: `[YOUR_TEST_EMAIL@gmail.com]`
- Password: `[YOUR_TEST_PASSWORD]`
- Note: This is a test account created specifically for verification purposes

**Test Instructions:**
1. Visit the application at: `[YOUR_PRODUCTION_URL]` or `http://localhost:3000` (development)
2. Click "Sign in with Google"
3. Select the test user account
4. Grant the requested permissions
5. Complete the authentication flow
6. Access the dashboard to verify functionality

### Related Projects

**Supabase Project ID**: `[YOUR_SUPABASE_PROJECT_ID]`

**Other OAuth Projects**: 
- List any other Google Cloud Console project IDs that use OAuth with similar scopes, if applicable
- Example: `[PROJECT_ID_1]`, `[PROJECT_ID_2]`

**Note**: If this is your first project using OAuth, you can omit this section or state "This is the first and only project using OAuth."

### Production URLs

- **Production**: `https://[your-domain.com]`
- **Development**: `http://localhost:3000` (local testing only)

### Additional Context

**Privacy and Data Handling:**
- User email addresses are stored securely in our Supabase database
- Profile information (name) is stored only for display purposes within the application
- We do not share user data with third parties
- Users can delete their accounts at any time, which removes all associated data

**Security Measures:**
- All authentication is handled through Supabase's secure OAuth implementation
- Tokens are managed by Supabase and not stored in our application code
- HTTPS is enforced in production environments

**Compliance:**
- We comply with Google's API Services User Data Policy
- We follow best practices for OAuth implementation
- User data is handled in accordance with privacy regulations

### Contact Information

- **Developer Contact Email**: `[YOUR_EMAIL]`
- **Support Email**: `[SUPPORT_EMAIL]`
- **Project Repository**: `[GITHUB_REPO_URL]` (if public)

---

## 🔧 Customization Instructions

1. **Replace placeholders** in brackets `[ ]` with your actual information
2. **Remove sections** that don't apply to your situation
3. **Add sections** if you're requesting sensitive/restricted scopes (see below)
4. **Test credentials**: Only include if you've created test accounts specifically for verification

## ⚠️ If Adding Sensitive/Restricted Scopes

If you're requesting sensitive or restricted scopes (e.g., Gmail, Contacts, Calendar), you'll need to add a justification section:

### Additional Scope Justifications

**[Scope Name]** (e.g., `https://www.googleapis.com/auth/gmail.readonly`)
- **Why this scope is needed**: [Clear explanation of why your app needs this access]
- **How it's used**: [Detailed description of how the app uses this data]
- **User benefit**: [How this improves the user experience]
- **Data handling**: [How the data is stored, processed, and protected]

**Example:**

**Gmail Read-only Access** (`https://www.googleapis.com/auth/gmail.readonly`)
- **Why this scope is needed**: To enable users to receive audio descriptions of important emails
- **How it's used**: The app reads email subject lines and sends, then converts them to audio descriptions for blind users
- **User benefit**: Makes email management accessible to users with visual impairments
- **Data handling**: Email data is only accessed when explicitly requested by the user, processed in real-time, and never stored permanently

---

## 📋 Checklist Before Submitting

- [ ] All placeholders replaced with actual information
- [ ] Test credentials provided (if requested)
- [ ] Production URL is correct and accessible
- [ ] Supabase project ID is included
- [ ] Contact information is up-to-date
- [ ] If adding sensitive scopes, justification is clear and detailed
- [ ] Demo video link included (if required for sensitive scopes)
- [ ] Privacy policy URL is included (if applicable)
- [ ] Terms of service URL is included (if applicable)

---

## 📚 Additional Resources

- [Google OAuth Scope Verification Guide](https://developers.google.com/identity/protocols/oauth2/policies)
- [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy)
- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)


