
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const SupabaseRealTimeSetup = () => {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  const configureRealtime = async () => {
    try {
      setIsConfiguring(true);
      
      // First, run the SQL migration
      const { error: migrationError } = await supabase.rpc('run_realtime_migration', {});
      
      if (migrationError) {
        console.error('Error running migration:', migrationError);
        toast.error('Failed to configure real-time functionality');
        return;
      }
      
      // Then, invoke the edge function to enable realtime
      const { error: functionError } = await supabase.functions.invoke('enable-realtime', {});
      
      if (functionError) {
        console.error('Error enabling realtime:', functionError);
        toast.error('Failed to enable real-time functionality');
        return;
      }
      
      setIsConfigured(true);
      toast.success('Real-time functionality configured successfully');
    } catch (error) {
      console.error('Error configuring realtime:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsConfiguring(false);
    }
  };

  useEffect(() => {
    // Run once when the component mounts
    configureRealtime();
  }, []);

  return null; // This component doesn't render anything
};
