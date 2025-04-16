
import { useState, useEffect } from 'react';
import { useLocalStorage } from './use-local-storage';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ModuleInstanceData {
  title: string;
  minimized: boolean;
  lastUpdated: string;
}

interface ModuleInstanceSettings {
  data: ModuleInstanceData;
  loading: boolean;
  updateTitle: (title: string) => void;
  toggleMinimized: () => void;
}

export function useModuleInstance(instanceId: string, defaultTitle: string): ModuleInstanceSettings {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Use localStorage as a fallback when user is not authenticated
  // or for temporary storage before saving to database
  const [localData, setLocalData] = useLocalStorage<ModuleInstanceData>(
    `module-instance-${instanceId}`, 
    { 
      title: defaultTitle, 
      minimized: false,
      lastUpdated: new Date().toISOString() 
    }
  );
  
  // Fetch module instance data from database when user is authenticated
  useEffect(() => {
    const fetchModuleData = async () => {
      if (!user || !instanceId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // Check if this is a custom table not in the generated types
        const { data, error } = await supabase
          .from('module_instances')
          .select('title, settings')
          .eq('instance_id', instanceId)
          .eq('user_id', user.id)
          .single();
          
        if (error) {
          if (error.code === 'PGRST116') {
            // No data found, initialize with local data
            console.log('No module instance found, initializing with local data');
            const moduleType = instanceId.split('-')[0];
            
            const { error: insertError } = await supabase
              .from('module_instances')
              .insert({
                instance_id: instanceId,
                user_id: user.id,
                title: localData.title,
                module_type: moduleType as any,
                settings: { minimized: localData.minimized }
              });
              
            if (insertError) {
              console.error('Error initializing module instance:', insertError);
            }
          } else {
            console.error('Error fetching module instance data:', error);
          }
        } else if (data) {
          // Update local data with database data
          console.log('Module instance found, updating with database data:', data);
          setLocalData({
            title: data.title,
            minimized: data.settings?.minimized || false,
            lastUpdated: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Error in module instance data fetch:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchModuleData();
  }, [user, instanceId]);
  
  // Update title in both localStorage and database
  const updateTitle = async (title: string) => {
    // Update local state first for immediate feedback
    setLocalData((prev) => ({ 
      ...prev, 
      title, 
      lastUpdated: new Date().toISOString() 
    }));
    
    // Then update in database if user is authenticated
    if (user && instanceId) {
      try {
        const moduleType = instanceId.split('-')[0];
        
        const { error } = await supabase
          .from('module_instances')
          .upsert({
            instance_id: instanceId,
            user_id: user.id,
            title,
            module_type: moduleType as any,
            settings: { minimized: localData.minimized }
          });
          
        if (error) {
          console.error('Error updating module instance title:', error);
        }
      } catch (err) {
        console.error('Error updating module instance:', err);
      }
    }
  };
  
  // Toggle minimized state
  const toggleMinimized = async () => {
    const newMinimized = !localData.minimized;
    
    // Update local state first for immediate feedback
    setLocalData((prev) => ({ 
      ...prev, 
      minimized: newMinimized,
      lastUpdated: new Date().toISOString() 
    }));
    
    // Then update in database if user is authenticated
    if (user && instanceId) {
      try {
        const moduleType = instanceId.split('-')[0];
        
        const { error } = await supabase
          .from('module_instances')
          .upsert({
            instance_id: instanceId,
            user_id: user.id,
            title: localData.title,
            module_type: moduleType as any,
            settings: { minimized: newMinimized }
          });
          
        if (error) {
          console.error('Error updating module instance minimized state:', error);
        }
      } catch (err) {
        console.error('Error updating module instance:', err);
      }
    }
  };
  
  return {
    data: localData,
    loading,
    updateTitle,
    toggleMinimized
  };
}
