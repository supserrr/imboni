-- Create user types enum
CREATE TYPE user_type AS ENUM ('blind', 'volunteer');

-- Create help request status enum
CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'declined', 'in_progress', 'completed', 'cancelled');

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  type user_type NOT NULL,
  availability BOOLEAN DEFAULT false,
  rating FLOAT DEFAULT 5.0,
  reliability_score FLOAT DEFAULT 100.0,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  history_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies for users
CREATE POLICY "Public profiles are viewable by everyone" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Help Requests table
CREATE TABLE public.help_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  status request_status DEFAULT 'pending',
  assigned_volunteer UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for help_requests
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

-- Policies for help_requests
CREATE POLICY "Users can view their own requests" ON public.help_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Volunteers can view pending requests" ON public.help_requests
  FOR SELECT USING (
    (SELECT type FROM public.users WHERE id = auth.uid()) = 'volunteer' 
    AND status = 'pending'
  );

CREATE POLICY "Assigned volunteers can view their requests" ON public.help_requests
  FOR SELECT USING (assigned_volunteer = auth.uid());

CREATE POLICY "Users can create requests" ON public.help_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and assigned volunteers can update requests" ON public.help_requests
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.uid() = assigned_volunteer OR
    (
        (SELECT type FROM public.users WHERE id = auth.uid()) = 'volunteer' 
        AND status = 'pending'
    )
  );

-- Volunteer Behavior table
CREATE TABLE public.volunteer_behavior (
  volunteer_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  accept_count INTEGER DEFAULT 0,
  decline_count INTEGER DEFAULT 0,
  response_time_avg FLOAT DEFAULT 0.0, -- in seconds
  last_active TIMESTAMPTZ DEFAULT NOW(),
  success_sessions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for volunteer_behavior
ALTER TABLE public.volunteer_behavior ENABLE ROW LEVEL SECURITY;

-- Policies for volunteer_behavior
CREATE POLICY "Volunteers can view their own behavior stats" ON public.volunteer_behavior
  FOR SELECT USING (auth.uid() = volunteer_id);

CREATE POLICY "System update behavior stats" ON public.volunteer_behavior
  FOR ALL USING (true); -- In production, this should be more restrictive or handled via functions

-- Sessions table
CREATE TABLE public.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  help_request_id UUID REFERENCES public.help_requests(id),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  volunteer_id UUID REFERENCES public.users(id) NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration INTEGER, -- in seconds
  rating FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for sessions
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Policies for sessions
CREATE POLICY "Participants can view their sessions" ON public.sessions
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = volunteer_id);

CREATE POLICY "Participants can insert sessions" ON public.sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = volunteer_id);

CREATE POLICY "Participants can update sessions" ON public.sessions
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = volunteer_id);

-- Functions to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_help_requests_updated_at BEFORE UPDATE ON public.help_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_volunteer_behavior_updated_at BEFORE UPDATE ON public.volunteer_behavior FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, type)
  VALUES (new.id, (new.raw_user_meta_data->>'type')::user_type);
  
  IF (new.raw_user_meta_data->>'type') = 'volunteer' THEN
    INSERT INTO public.volunteer_behavior (volunteer_id)
    VALUES (new.id);
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Realtime publication setup
ALTER PUBLICATION supabase_realtime ADD TABLE public.help_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;

