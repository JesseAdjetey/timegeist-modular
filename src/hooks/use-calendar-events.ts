// Updated version of useCalendarEvents hook
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarEventType } from '@/lib/stores/types';
import { toast } from 'sonner';

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch calendar events from Supabase
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        console.log('No authenticated user, clearing events');
        setEvents([]);
        setLoading(false);
        return;
      }
      
      console.log('Fetching calendar events for user:', user.id);
      
      // Make sure we're querying the correct table
      const { data, error: fetchError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id);
      
      if (fetchError) {
        console.error('Error fetching calendar events:', fetchError);
        throw fetchError;
      }
      
      console.log('Fetched calendar events:', data || []);
      
      if (data) {
        // Transform the data to match CalendarEventType
        const transformedEvents = data.map(event => ({
          id: event.id,
          title: event.title,
          date: event.date,
          description: event.description,
          color: event.color || 'bg-blue-400/70',
          isLocked: event.is_locked || false,
          isTodo: event.is_todo || false,
          hasAlarm: event.has_alarm || false,
          hasReminder: event.has_reminder || false,
          todoId: event.todo_id
        }));
        
        setEvents(transformedEvents);
      } else {
        setEvents([]);
      }
    } catch (err: any) {
      console.error('Error in fetchEvents:', err);
      setError(err.message || err.error_description || String(err));
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add a test event function to help debug
  const addTestEvent = async () => {
    if (!user) {
      toast.error('User not authenticated');
      return { success: false };
    }
    
    const testEvent = {
      title: "Test Event",
      date: new Date().toISOString().split('T')[0],
      description: "09:00 - 10:00 | This is a test event",
      user_id: user.id,
      color: 'bg-purple-500/70',
    };
    
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert(testEvent)
        .select();
        
      if (error) {
        console.error('Error adding test event:', error);
        toast.error('Failed to add test event');
        return { success: false, error };
      }
      
      toast.success('Test event added');
      fetchEvents(); // Refresh events
      return { success: true, data };
    } catch (err) {
      console.error('Error in addTestEvent:', err);
      toast.error('An error occurred');
      return { success: false, error: err };
    }
  };

  // Load events when component mounts or user changes
  useEffect(() => {
    if (user) {
      console.log('User authenticated, fetching calendar events');
      fetchEvents();
    } else {
      console.log('No user, clearing calendar events');
      setEvents([]);
      setLoading(false);
    }
    
    // Set up real-time subscription for calendar events
    const channel = supabase
      .channel('calendar-events-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'calendar_events',
          filter: user ? `user_id=eq.${user.id}` : undefined 
        }, 
        (payload) => {
          console.log('Realtime update received for calendar events:', payload);
          fetchEvents();
        }
      )
      .subscribe();
      
    return () => {
      console.log('Cleaning up subscriptions');
      supabase.removeChannel(channel);
    };
  }, [user, fetchEvents]);

  // Other functions like addEvent, updateEvent, etc...
  // (keeping your original implementations)

  return {
    events,
    loading,
    error,
    fetchEvents,
    addTestEvent,
    // Include your other functions
    // addEvent, removeEvent, updateEvent, toggleEventLock
  };
}
