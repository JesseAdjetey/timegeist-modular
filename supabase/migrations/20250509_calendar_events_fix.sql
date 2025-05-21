-- Create calendar_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    color TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    has_reminder BOOLEAN DEFAULT FALSE,
    has_alarm BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    is_todo BOOLEAN DEFAULT FALSE,
    todo_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add to the realtime publication if it's not already there
BEGIN;
  -- Drop from the publication if it already exists
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.calendar_events;
  
  -- Add to the publication
  ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;
COMMIT;

-- Set RLS on the table
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can insert their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can update their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can delete their own calendar events" ON public.calendar_events;

-- Create appropriate RLS policies
CREATE POLICY "Users can view their own calendar events" 
  ON public.calendar_events 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar events" 
  ON public.calendar_events 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar events" 
  ON public.calendar_events 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar events" 
  ON public.calendar_events 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Set replica identity for realtime functionality
ALTER TABLE public.calendar_events REPLICA IDENTITY FULL;
