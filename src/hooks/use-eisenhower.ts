
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface EisenhowerItem {
  id: string;
  text: string;
  quadrant: 'urgent_important' | 'not_urgent_important' | 'urgent_not_important' | 'not_urgent_not_important';
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  event_id?: string;
  module_instance_id?: string; // Add module instance ID
}

interface EisenhowerResponse {
  success: boolean;
  message: string;
  itemId?: string;
  error?: any;
}

interface UseEisenhowerProps {
  instanceId: string; // Add instanceId as a required prop
}

export function useEisenhower({ instanceId }: UseEisenhowerProps) {
  const [items, setItems] = useState<EisenhowerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<EisenhowerResponse | null>(null);
  const { user } = useAuth();

  // Fetch Eisenhower items from Supabase
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setItems([]);
        return;
      }
      
      console.log('Fetching Eisenhower items for user:', user.id, 'and instance:', instanceId);
      
      const { data, error } = await supabase
        .from('eisenhower_items')
        .select('id, text, quadrant, created_at, event_id, module_instance_id')
        .eq('user_id', user.id)
        .eq('module_instance_id', instanceId) // Filter by the module instance ID
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error details:', error);
        throw error;
      }
      
      console.log('Fetched Eisenhower items:', data);
      setItems(data || []);
    } catch (err: any) {
      console.error('Error fetching Eisenhower items:', err);
      setError(err.message || err.error_description || String(err));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user, instanceId]); // Make instanceId a dependency

  // Add a new Eisenhower item to Supabase
  const addItem = async (text: string, quadrant: EisenhowerItem['quadrant']) => {
    try {
      if (!user || !text.trim()) {
        const response = {
          success: false,
          message: !user ? 'User not authenticated' : 'Text cannot be empty',
        };
        setLastResponse(response);
        return response;
      }
      
      console.log('Adding new Eisenhower item:', text, 'to quadrant:', quadrant, 'for instance:', instanceId);
      
      const newItem = {
        text: text.trim(),
        quadrant,
        user_id: user.id,
        module_instance_id: instanceId // Include the module instance ID
      };
      
      const { data, error } = await supabase
        .from('eisenhower_items')
        .insert(newItem)
        .select();
      
      if (error) {
        console.error('Error details:', error);
        const response = {
          success: false,
          message: `Failed to add item: ${error.message}`,
          error
        };
        setLastResponse(response);
        return response;
      }
      
      console.log('Item successfully added with response:', data);
      
      if (data && data.length > 0) {
        setItems(prevItems => [data[0] as EisenhowerItem, ...prevItems]);
        
        const response = {
          success: true,
          message: 'Item added successfully',
          itemId: data[0].id,
        };
        setLastResponse(response);
        return response;
      }
      
      const response = {
        success: true,
        message: 'Item added but ID not returned',
      };
      setLastResponse(response);
      return response;
    } catch (err: any) {
      console.error('Error adding Eisenhower item:', err);
      const response = {
        success: false,
        message: `Error adding item: ${err.message || String(err)}`,
        error: err
      };
      setLastResponse(response);
      return response;
    }
  };

  // Remove an Eisenhower item
  const removeItem = async (id: string) => {
    try {
      if (!user) return;
      
      // Optimistically update the UI
      setItems(prevItems => prevItems.filter(item => item.id !== id));
      
      const { error } = await supabase
        .from('eisenhower_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('module_instance_id', instanceId); // Only delete items matching this instance
      
      if (error) {
        console.error('Error details:', error);
        throw error;
      }
    } catch (err: any) {
      console.error('Error removing Eisenhower item:', err);
      toast.error('Failed to remove item');
      
      // Refetch items to restore the correct state
      fetchItems();
    }
  };

  // Update an item's quadrant
  const updateQuadrant = async (id: string, quadrant: EisenhowerItem['quadrant']) => {
    try {
      if (!user) return;
      
      // Optimistically update the UI
      setItems(prevItems => prevItems.map(item => 
        item.id === id ? { ...item, quadrant } : item
      ));
      
      const { error } = await supabase
        .from('eisenhower_items')
        .update({ quadrant })
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('module_instance_id', instanceId); // Only update items matching this instance
      
      if (error) {
        console.error('Error details:', error);
        throw error;
      }
    } catch (err: any) {
      console.error('Error updating Eisenhower item quadrant:', err);
      toast.error('Failed to update item');
      
      // Refetch items to restore the correct state
      fetchItems();
    }
  };

  // Load items when component mounts or user/instanceId changes
  useEffect(() => {
    if (user && instanceId) {
      console.log('User is authenticated and instanceId provided, fetching Eisenhower items');
      fetchItems();
    } else {
      console.log('No user or instanceId, clearing Eisenhower items');
      setItems([]);
      setLoading(false);
    }
    
    // Set up real-time subscription for Eisenhower items
    const eisenhowerSubscription = supabase
      .channel('eisenhower-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'eisenhower_items', 
          filter: `user_id=eq.${user?.id} AND module_instance_id=eq.${instanceId}` 
        }, 
        (payload) => {
          console.log('Realtime update received:', payload);
          // Only refetch when the user is authenticated
          if (user && instanceId) {
            fetchItems();
          }
        }
      )
      .subscribe();
      
    return () => {
      console.log('Cleaning up subscription');
      supabase.removeChannel(eisenhowerSubscription);
    };
  }, [user, instanceId, fetchItems]); // Add instanceId as a dependency

  return {
    items,
    loading,
    error,
    addItem,
    removeItem,
    updateQuadrant,
    refetchItems: fetchItems,
    lastResponse
  };
}
