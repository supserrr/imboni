-- Add AI-related columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS confidence_threshold NUMERIC DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS preferred_voice TEXT,
ADD COLUMN IF NOT EXISTS speech_rate NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS verbosity_level TEXT CHECK (verbosity_level IN ('detailed', 'concise')) DEFAULT 'detailed';

-- Create ai_sessions table (optional, for analytics)
CREATE TABLE IF NOT EXISTS ai_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  frames_analyzed INTEGER DEFAULT 0,
  average_confidence NUMERIC DEFAULT 0
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user_id ON ai_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_started_at ON ai_sessions(started_at);

-- Enable Row Level Security
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_sessions
CREATE POLICY "Users can view their own AI sessions"
  ON ai_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI sessions"
  ON ai_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI sessions"
  ON ai_sessions FOR UPDATE
  USING (auth.uid() = user_id);

