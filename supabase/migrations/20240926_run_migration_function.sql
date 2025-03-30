
-- Create a function that will run our realtime configuration
CREATE OR REPLACE FUNCTION public.run_realtime_migration()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set replica identity on tables for realtime functionality
  ALTER TABLE public.todo_items REPLICA IDENTITY FULL;
  ALTER TABLE public.events REPLICA IDENTITY FULL;

  -- Add tables to the realtime publication
  BEGIN
    -- Drop from the publication if it already exists
    ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.todo_items;
    ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.events;
    
    -- Add to the publication
    ALTER PUBLICATION supabase_realtime ADD TABLE public.todo_items;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.run_realtime_migration() TO authenticated;
GRANT EXECUTE ON FUNCTION public.run_realtime_migration() TO service_role;
