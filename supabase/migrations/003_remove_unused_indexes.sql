-- Remove unused indexes to improve database performance
-- These indexes have never been used according to Supabase advisor
-- Removing them reduces storage overhead and write costs

-- Remove unused index on users.availability
-- No queries filter by availability in the codebase
DROP INDEX IF EXISTS idx_users_availability;

-- Remove unused index on users.preferred_language
-- No queries filter by preferred_language in the codebase
DROP INDEX IF EXISTS idx_users_preferred_language;

-- Remove unused index on analysis_history.created_at
-- No queries order by created_at in the codebase
-- History is managed in-memory, not queried from database
DROP INDEX IF EXISTS idx_analysis_history_created_at;

