-- Create analysis_history table for storing user analysis queries and responses
CREATE TABLE IF NOT EXISTS analysis_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_data TEXT,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_analysis_history_user_id ON analysis_history(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_analysis_history_created_at ON analysis_history(created_at DESC);

-- Enable RLS
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own history
CREATE POLICY "Users can view their own analysis history"
  ON analysis_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own history
CREATE POLICY "Users can insert their own analysis history"
  ON analysis_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

