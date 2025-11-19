-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('user', 'volunteer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Volunteers table
CREATE TABLE IF NOT EXISTS volunteers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  rating NUMERIC(3, 2) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  current_load INTEGER DEFAULT 0,
  last_response_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended')),
  ai_confidence NUMERIC(3, 2),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Help requests table
CREATE TABLE IF NOT EXISTS help_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI logs table
CREATE TABLE IF NOT EXISTS ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  confidence NUMERIC(3, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Volunteer activity table
CREATE TABLE IF NOT EXISTS volunteer_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- WebRTC signals table (for WebRTC connection signaling)
CREATE TABLE IF NOT EXISTS webrtc_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  from_initiator BOOLEAN NOT NULL,
  offer JSONB,
  answer JSONB,
  candidate JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_volunteers_online ON volunteers(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_volunteers_rating ON volunteers(rating DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_volunteer ON sessions(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_help_requests_volunteer ON help_requests(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON help_requests(status);
CREATE INDEX IF NOT EXISTS idx_volunteer_activity_volunteer ON volunteer_activity(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_activity_timestamp ON volunteer_activity(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_webrtc_signals_session ON webrtc_signals(session_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_volunteers_updated_at BEFORE UPDATE ON volunteers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE webrtc_signals ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Volunteers can read their own data
CREATE POLICY "Volunteers can read own data" ON volunteers
  FOR SELECT USING (auth.uid() = id);

-- Volunteers can update their own data
CREATE POLICY "Volunteers can update own data" ON volunteers
  FOR UPDATE USING (auth.uid() = id);

-- Users can read their own sessions
CREATE POLICY "Users can read own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Volunteers can read their own sessions
CREATE POLICY "Volunteers can read own sessions" ON sessions
  FOR SELECT USING (auth.uid() = volunteer_id);

-- Users can create their own sessions
CREATE POLICY "Users can create own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Volunteers can read help requests assigned to them
CREATE POLICY "Volunteers can read own help requests" ON help_requests
  FOR SELECT USING (auth.uid() = volunteer_id);

-- Volunteers can update help requests assigned to them
CREATE POLICY "Volunteers can update own help requests" ON help_requests
  FOR UPDATE USING (auth.uid() = volunteer_id);

-- Users can read their own AI logs
CREATE POLICY "Users can read own AI logs" ON ai_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own AI logs
CREATE POLICY "Users can insert own AI logs" ON ai_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Volunteers can read their own activity
CREATE POLICY "Volunteers can read own activity" ON volunteer_activity
  FOR SELECT USING (auth.uid() = volunteer_id);

-- Volunteers can insert their own activity
CREATE POLICY "Volunteers can insert own activity" ON volunteer_activity
  FOR INSERT WITH CHECK (auth.uid() = volunteer_id);

-- Users and volunteers can read webrtc signals for their sessions
CREATE POLICY "Users can read webrtc signals for own sessions" ON webrtc_signals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = webrtc_signals.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Volunteers can read webrtc signals for own sessions" ON webrtc_signals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = webrtc_signals.session_id
      AND sessions.volunteer_id = auth.uid()
    )
  );

-- Users and volunteers can insert webrtc signals for their sessions
CREATE POLICY "Users can insert webrtc signals for own sessions" ON webrtc_signals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = webrtc_signals.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Volunteers can insert webrtc signals for own sessions" ON webrtc_signals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = webrtc_signals.session_id
      AND sessions.volunteer_id = auth.uid()
    )
  );

