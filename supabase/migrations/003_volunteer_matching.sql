-- Migration: Add volunteer matching with location and load balancing

-- Add location and volunteer-specific columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS active_calls_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_concurrent_calls INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

-- Add location columns to call_requests table for proximity matching
ALTER TABLE call_requests
ADD COLUMN IF NOT EXISTS user_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS user_longitude DECIMAL(11, 8);

-- Create index for location-based queries on volunteers
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(latitude, longitude) WHERE role = 'volunteer';

-- Create index for active calls count filtering
CREATE INDEX IF NOT EXISTS idx_profiles_active_calls ON profiles(active_calls_count) WHERE role = 'volunteer' AND is_available = true;

-- Function to calculate Haversine distance between two points (in kilometers)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  earth_radius DECIMAL := 6371; -- Earth radius in kilometers
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  -- Convert degrees to radians
  dlat := RADIANS(lat2 - lat1);
  dlon := RADIANS(lon2 - lon1);
  
  -- Haversine formula
  a := SIN(dlat / 2) * SIN(dlat / 2) +
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
       SIN(dlon / 2) * SIN(dlon / 2);
  c := 2 * ATAN2(SQRT(a), SQRT(1 - a));
  
  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find best volunteer based on availability, proximity, and load
CREATE OR REPLACE FUNCTION find_best_volunteer(
  user_lat DECIMAL,
  user_lng DECIMAL
) RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  active_calls_count INTEGER,
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.latitude,
    p.longitude,
    p.active_calls_count,
    calculate_distance(user_lat, user_lng, p.latitude, p.longitude) AS distance_km
  FROM profiles p
  WHERE 
    p.role = 'volunteer'
    AND p.is_available = true
    AND p.active_calls_count < p.max_concurrent_calls
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND p.last_seen_at > TIMEZONE('utc', NOW()) - INTERVAL '1 hour' -- Active within last hour
  ORDER BY 
    calculate_distance(user_lat, user_lng, p.latitude, p.longitude) ASC, -- Proximity first
    p.active_calls_count ASC, -- Then by load (fewer active calls)
    p.last_seen_at DESC -- Then by recency
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Update trigger to update last_seen_at when profile is updated
CREATE OR REPLACE FUNCTION update_volunteer_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update last_seen_at for volunteers when availability changes
  IF NEW.role = 'volunteer' AND (OLD.is_available IS DISTINCT FROM NEW.is_available) THEN
    NEW.last_seen_at = TIMEZONE('utc', NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_update_volunteer_last_seen ON profiles;
CREATE TRIGGER trigger_update_volunteer_last_seen
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_volunteer_last_seen();

-- Function to increment active calls count when call is accepted
CREATE OR REPLACE FUNCTION increment_volunteer_call_count()
RETURNS TRIGGER AS $$
BEGIN
  -- When call status changes to 'active', increment volunteer's active_calls_count
  IF NEW.status = 'active' AND OLD.status != 'active' AND NEW.volunteer_id IS NOT NULL THEN
    UPDATE profiles
    SET active_calls_count = active_calls_count + 1,
        last_seen_at = TIMEZONE('utc', NOW())
    WHERE id = NEW.volunteer_id;
  END IF;
  
  -- When call status changes from 'active' to 'completed' or 'cancelled', decrement
  IF OLD.status = 'active' AND NEW.status IN ('completed', 'cancelled') AND OLD.volunteer_id IS NOT NULL THEN
    UPDATE profiles
    SET active_calls_count = GREATEST(active_calls_count - 1, 0),
        last_seen_at = TIMEZONE('utc', NOW())
    WHERE id = OLD.volunteer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_increment_volunteer_call_count ON call_requests;
CREATE TRIGGER trigger_increment_volunteer_call_count
  AFTER UPDATE ON call_requests
  FOR EACH ROW
  EXECUTE FUNCTION increment_volunteer_call_count();

