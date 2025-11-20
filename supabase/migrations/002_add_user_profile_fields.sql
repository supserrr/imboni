-- Add additional user profile fields
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS notification_token TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS device_info JSONB;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Update the handle_new_user function to extract and store additional metadata
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    type, 
    full_name, 
    preferred_language
  )
  VALUES (
    new.id, 
    (new.raw_user_meta_data->>'type')::user_type,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'preferred_language', 'en')
  );
  
  -- Create volunteer_behavior record if user is a volunteer
  IF (new.raw_user_meta_data->>'type') = 'volunteer' THEN
    INSERT INTO public.volunteer_behavior (volunteer_id)
    VALUES (new.id);
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_type ON public.users(type);
CREATE INDEX IF NOT EXISTS idx_users_availability ON public.users(availability);
CREATE INDEX IF NOT EXISTS idx_users_preferred_language ON public.users(preferred_language);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON public.help_requests(status);
CREATE INDEX IF NOT EXISTS idx_help_requests_assigned_volunteer ON public.help_requests(assigned_volunteer);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_volunteer_id ON public.sessions(volunteer_id);

-- Add comment for documentation
COMMENT ON COLUMN public.users.full_name IS 'User full name';
COMMENT ON COLUMN public.users.phone_number IS 'User phone number for contact';
COMMENT ON COLUMN public.users.preferred_language IS 'User preferred language code (e.g., en, es, fr)';
COMMENT ON COLUMN public.users.notification_token IS 'Device notification token for push notifications';
COMMENT ON COLUMN public.users.device_info IS 'Device information (OS, model, etc.) stored as JSON';
COMMENT ON COLUMN public.users.profile_picture_url IS 'URL to user profile picture';
COMMENT ON COLUMN public.users.bio IS 'User bio/description';

