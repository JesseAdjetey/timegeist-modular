
-- Set replica identity on tables for realtime functionality
ALTER TABLE public.todo_items REPLICA IDENTITY FULL;
ALTER TABLE public.events REPLICA IDENTITY FULL;
ALTER TABLE public.eisenhower_items REPLICA IDENTITY FULL;
ALTER TABLE public.calendar_events REPLICA IDENTITY FULL;

-- Add tables to the realtime publication
BEGIN;
  -- Drop from the publication if it already exists
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.todo_items;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.events;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.eisenhower_items;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.calendar_events;
  
  -- Add to the publication
  ALTER PUBLICATION supabase_realtime ADD TABLE public.todo_items;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.eisenhower_items;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;
COMMIT;
