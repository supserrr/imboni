-- Migration: Update default confidence threshold from 0.7 to 0.55

-- Update default confidence threshold in profiles table
ALTER TABLE profiles
ALTER COLUMN confidence_threshold SET DEFAULT 0.55;

-- Update existing profiles with default 0.7 to 0.55 (optional - only if we want to change existing values)
-- UPDATE profiles SET confidence_threshold = 0.55 WHERE confidence_threshold = 0.7;

-- Enable Realtime on ai_sessions table for session sync
ALTER PUBLICATION supabase_realtime ADD TABLE ai_sessions;

