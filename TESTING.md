# Testing Checklist

## Prerequisites
- ✅ Expo development server running (`npm start`)
- ⚠️ Environment variables configured (`.env` file)
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_MOONDREAM_API_KEY`
  - `EXPO_PUBLIC_ELEVENLABS_API_KEY`
- ⚠️ Supabase database setup complete
  - Migration run: `supabase/migrations/001_initial_schema.sql`
  - Edge function deployed: `select-best-volunteer`

## User Flow Testing

### 1. Authentication & Navigation
- [ ] App launches without errors
- [ ] Sign up/Sign in screen displays
- [ ] User can create account
- [ ] User can log in
- [ ] Role selection screen appears after auth
- [ ] User can select "user" role
- [ ] Navigation to Live Mode screen works

### 2. Live Mode - AI State Machine
- [ ] Live Mode screen displays camera feed
- [ ] Camera permissions requested correctly
- [ ] "Ask AI" button is visible and enabled in idle state
- [ ] Pressing "Ask AI" button:
  - [ ] Transitions to "Listening" state
  - [ ] Plays listening sound effect
  - [ ] Haptic feedback (light pulse) triggers
  - [ ] Camera starts auto-capturing frames

### 3. AI Processing
- [ ] Frame captured during listening:
  - [ ] Transitions to "Processing" state
  - [ ] Plays processing sound effect
  - [ ] Haptic feedback (medium impact) triggers
  - [ ] Shows "Processing image..." with spinner
- [ ] Moondream API call executes:
  - [ ] Image sent to API successfully
  - [ ] Response received with description and confidence
  - [ ] Confidence score normalized (0-1 range)

### 4. High Confidence Path (≥ 0.7)
- [ ] If confidence ≥ threshold:
  - [ ] Transitions to "Speaking" state
  - [ ] Plays speaking sound effect
  - [ ] Haptic feedback (light pulse) triggers
  - [ ] TTS plays AI description via ElevenLabs
  - [ ] AI interaction logged to Supabase
  - [ ] Returns to Idle state after 3 seconds
  - [ ] Confidence percentage displays correctly

### 5. Low Confidence Path (< 0.7)
- [ ] If confidence < threshold:
  - [ ] Transitions to "LowConfidence" state
  - [ ] Plays low confidence alert sound
  - [ ] Haptic feedback (warning notification) triggers
  - [ ] Shows "Request Human Help?" dialog
  - [ ] User can cancel (returns to Idle)
  - [ ] User can accept (proceeds to volunteer selection)

### 6. Volunteer Selection & Retry Logic
- [ ] On "Request Help" confirmation:
  - [ ] Shows "Finding volunteer..." status
  - [ ] Calls `selectBestVolunteer` edge function
  - [ ] Receives ranked list of top 5 volunteers
- [ ] Volunteer notification:
  - [ ] Creates help request in Supabase
  - [ ] Shows "Waiting for volunteer..." with ID
  - [ ] Sets 30-second timeout
- [ ] Retry scenarios:
  - [ ] If volunteer declines → tries next volunteer
  - [ ] If timeout → tries next volunteer
  - [ ] Tracks declined volunteers (no duplicate retries)
  - [ ] Max 3 volunteers tried
  - [ ] Shows appropriate error if all decline

### 7. Volunteer Acceptance & WebRTC
- [ ] When volunteer accepts:
  - [ ] Timeout cancelled
  - [ ] Shows "Connecting to volunteer..." status
  - [ ] WebRTC connection initialized
  - [ ] Local stream from user camera
  - [ ] Remote stream from volunteer
  - [ ] Connection status updates correctly
- [ ] During call:
  - [ ] Video streams visible
  - [ ] Audio working (bidirectional)
  - [ ] Connection stable

### 8. Session End
- [ ] User can end session:
  - [ ] "End Call" button works
  - [ ] WebRTC connection closes
  - [ ] Returns to Idle state
  - [ ] All state cleared

## Volunteer Flow Testing

### 9. Volunteer Authentication
- [ ] Volunteer can sign up/log in
- [ ] Select "volunteer" role
- [ ] Navigates to volunteer home screen

### 10. Volunteer Availability
- [ ] "Go Online" button available
- [ ] Pressing "Go Online":
  - [ ] Updates `is_online` in Supabase
  - [ ] Logs `went_online` activity
  - [ ] Subscribes to help requests
- [ ] "Go Offline" button works:
  - [ ] Updates status
  - [ ] Logs `went_offline` activity
  - [ ] Unsubscribes from requests

### 11. Help Request Notification
- [ ] When help request received:
  - [ ] Real-time notification appears
  - [ ] Request shows in help requests list
  - [ ] `request_received` logged with timestamp
- [ ] Volunteer can:
  - [ ] Accept request
  - [ ] Decline request
  - [ ] Both log response time

### 12. Accept Request Flow
- [ ] On accept:
  - [ ] Updates help_request status to "accepted"
  - [ ] Updates session status to "active"
  - [ ] Logs `request_accepted` with response time
  - [ ] Increments volunteer load (+1)
  - [ ] Navigates to VideoCall screen
  - [ ] Sets `currentCall` in context

### 13. Video Call - Volunteer Side
- [ ] VideoCall screen displays:
  - [ ] Remote stream (user's video) visible
  - [ ] Connection status indicator
  - [ ] Audio level bar
  - [ ] Control buttons (Snap, End Call, Flash)
- [ ] WebRTC connection:
  - [ ] Initializes as receiver (not initiator)
  - [ ] Handles SDP offer/answer
  - [ ] Handles ICE candidates
  - [ ] Connection status updates correctly

### 14. Volunteer Actions Tracking
- [ ] Snap button:
  - [ ] Takes photo when pressed
  - [ ] Logs `snap` action with sessionId and timestamp
  - [ ] Action count increments
- [ ] Flash toggle:
  - [ ] Toggles flash state
  - [ ] Logs `flash_toggle` with enabled state
  - [ ] Action count increments
- [ ] End Call:
  - [ ] Logs `call_ended_by_volunteer`
  - [ ] Includes duration, snap count, flash count
  - [ ] Decrements volunteer load (-1)
  - [ ] Updates session status to "ended"
  - [ ] Navigates back to home

### 15. Decline Request Flow
- [ ] On decline:
  - [ ] Updates help_request status to "declined"
  - [ ] Logs `request_declined` with response time
  - [ ] Removes from help requests list
  - [ ] User notified to try next volunteer

## Edge Cases & Error Handling

### 16. API Failures
- [ ] Moondream API failure:
  - [ ] Retry logic works (3 attempts with exponential backoff)
  - [ ] Error message displayed
  - [ ] Returns to Idle state gracefully
- [ ] ElevenLabs API failure:
  - [ ] Fallback to cached sound if available
  - [ ] Error logged without crashing
- [ ] Supabase connection failure:
  - [ ] Error messages displayed
  - [ ] Retry options shown

### 17. Network Issues
- [ ] No internet connection:
  - [ ] Error message displayed
  - [ ] Retry option available
- [ ] Connection timeout:
  - [ ] Volunteer selection timeout works (30s)
  - [ ] WebRTC connection timeout handled

### 18. No Volunteers Available
- [ ] When no volunteers online:
  - [ ] Shows "No volunteers available" message
  - [ ] Returns to Idle state
- [ ] When all volunteers decline:
  - [ ] Shows appropriate message
  - [ ] User can try again

### 19. State Management
- [ ] State transitions are atomic:
  - [ ] No invalid state combinations
  - [ ] State changes trigger appropriate effects
- [ ] Context providers:
  - [ ] AIStateContext provides state correctly
  - [ ] VolunteerContext provides state correctly
  - [ ] AuthContext provides user info correctly

### 20. Data Persistence
- [ ] AI interactions logged:
  - [ ] Saved to `ai_logs` table
  - [ ] Includes user_id, query, response, confidence
- [ ] Volunteer activity logged:
  - [ ] All actions saved to `volunteer_activity` table
  - [ ] Metadata preserved correctly
- [ ] Sessions created:
  - [ ] Saved to `sessions` table
  - [ ] Status updated correctly

## Performance & UX

### 21. Loading States
- [ ] All async operations show loading indicators
- [ ] Status messages are clear and informative
- [ ] No UI freezing during API calls

### 22. Haptic Feedback
- [ ] All state transitions trigger appropriate haptics
- [ ] Haptics don't interfere with audio
- [ ] Feedback is responsive (no lag)

### 23. Sound Effects
- [ ] All state sounds play correctly
- [ ] Sounds are cached (no repeat API calls)
- [ ] Audio doesn't overlap or conflict
- [ ] Volume levels appropriate

### 24. Accessibility
- [ ] Large buttons for easy tapping
- [ ] High contrast text
- [ ] Clear visual indicators
- [ ] Audio feedback for all actions

## Scoring Algorithm Testing

### 25. Volunteer Scoring
- [ ] Edge function calculates scores correctly:
  - [ ] Rating weight: 35%
  - [ ] Load weight: 25%
  - [ ] Response time weight: 25%
  - [ ] Tag matching weight: 15%
- [ ] Returns top 5 volunteers ranked by score
- [ ] Scores updated after each interaction

### 26. Metrics Collection
- [ ] Response times logged correctly
- [ ] Session durations calculated correctly
- [ ] Button usage counts accurate
- [ ] Volunteer load updates correctly

## Notes
- Test on both iOS and Android if possible
- Test with real API keys in development
- Monitor Supabase logs for errors
- Check console logs for any warnings

