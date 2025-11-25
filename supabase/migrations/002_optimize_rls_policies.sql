-- Optimize RLS policies by using subquery pattern for auth.uid()
-- This prevents re-evaluation of auth.uid() for each row, improving query performance at scale
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- Drop and recreate analysis_history policies with optimized pattern
DROP POLICY IF EXISTS "Users can view their own analysis history" ON analysis_history;
DROP POLICY IF EXISTS "Users can insert their own analysis history" ON analysis_history;

CREATE POLICY "Users can view their own analysis history"
  ON analysis_history
  FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own analysis history"
  ON analysis_history
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- Drop and recreate users table policies with optimized pattern
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert their own profile"
  ON users
  FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

