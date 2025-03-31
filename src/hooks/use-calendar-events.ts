
// Updated version of useCalendarEvents hook for the new calendar_events schema
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarEventType } from '@/lib/stores/types';
import { toast } from 'sonner';
import dayjs from 'dayjs';

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Helper function to format timestring from event descriptions
  const extractTimeString = (description: string): string => {
    if (!description) return '';
    const timePart = description.split('|')[0];
    return timePart ? timePart.trim() : '';
  };

  // Helper to create a formatted description for display
  const formatDescription = (timeStart: string, timeEnd: string, description: string): string => {
    const formattedTime = `${dayjs(timeStart).format('HH:mm')} - ${dayjs(timeEnd).format('HH:mm')}`;
    return `${formattedTime} | ${description || ''}`;
  };

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
      
      // Query the new calendar_events table structure
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
        // Transform the data to match CalendarEventType with backward compatibility
        const transformedEvents = data.map(event => {
          // Extract date from the timestamp for backward compatibility
          const eventDate = dayjs(event.starts_at).format('YYYY-MM-DD');
          
          // Create a display-friendly description with time range
          const descriptionWithTime = formatDescription(
            event.starts_at, 
            event.ends_at, 
            event.description || ''
          );
          
          return {
            id: event.id,
            title: event.title,
            description: descriptionWithTime,
            color: event.color || 'bg-blue-400/70',
            isLocked: event.is_locked || false,
            isTodo: event.is_todo || false,
            hasAlarm: event.has_alarm || false,
            hasReminder: event.has_reminder || false,
            todoId: event.todo_id,
            startsAt: event.starts_at,
            endsAt: event.ends_at,
            date: eventDate // For backward compatibility
          };
        });
        
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

  // Add a new event
  const addEvent = async (event: CalendarEventType) => {
    if (!user) {
      toast.error('User not authenticated');
      return { success: false };
    }
    
    try {
      // Parse the time range from description (e.g., "09:00 - 10:00 | Description")
      const timeRange = extractTimeString(event.description);
      const [startTime, endTime] = timeRange.split('-').map(t => t.trim());
      const eventDate = event.date || dayjs().format('YYYY-MM-DD');
      
      // Create timestamps by combining date and time
      const startsAt = dayjs(`${eventDate} ${startTime}`).toISOString();
      const endsAt = dayjs(`${eventDate} ${endTime}`).toISOString();
      
      // Extract the actual description part
      const descriptionParts = event.description.split('|');
      const actualDescription = descriptionParts.length > 1 ? descriptionParts[1].trim() : '';
      
      // Prepare data for insertion
      const newEvent = {
        title: event.title,
        description: actualDescription,
        color: event.color,
        is_locked: event.isLocked || false,
        is_todo: event.isTodo || false,
        has_alarm: event.hasAlarm || false,
        has_reminder: event.hasReminder || false,
        user_id: user.id,
        todo_id: event.todoId,
        starts_at: startsAt,
        ends_at: endsAt
      };
      
      console.log('Adding new calendar event:', newEvent);
      
      const { data, error } = await supabase
        .from('calendar_events')
        .insert(newEvent)
        .select();
        
      if (error) {
        console.error('Error adding event:', error);
        toast.error('Failed to add event');
        return { success: false, error };
      }
      
      toast.success('Event added');
      fetchEvents(); // Refresh events
      return { success: true, data };
    } catch (err) {
      console.error('Error in addEvent:', err);
      toast.error('An error occurred while adding the event');
      return { success: false, error: err };
    }
  };

  // Update an existing event
  const updateEvent = async (event: CalendarEventType) => {
    if (!user || !event.id) {
      toast.error('Invalid event data or user not authenticated');
      return { success: false };
    }
    
    try {
      // Parse the time range from description (e.g., "09:00 - 10:00 | Description")
      const timeRange = extractTimeString(event.description);
      const [startTime, endTime] = timeRange.split('-').map(t => t.trim());
      const eventDate = event.date || dayjs().format('YYYY-MM-DD');
      
      // Create timestamps by combining date and time
      const startsAt = dayjs(`${eventDate} ${startTime}`).toISOString();
      const endsAt = dayjs(`${eventDate} ${endTime}`).toISOString();
      
      // Extract the actual description part
      const descriptionParts = event.description.split('|');
      const actualDescription = descriptionParts.length > 1 ? descriptionParts[1].trim() : '';
      
      // Prepare data for update
      const updatedEvent = {
        title: event.title,
        description: actualDescription,
        color: event.color,
        is_locked: event.isLocked || false,
        is_todo: event.isTodo || false,
        has_alarm: event.hasAlarm || false,
        has_reminder: event.hasReminder || false,
        todo_id: event.todoId,
        starts_at: startsAt,
        ends_at: endsAt
      };
      
      console.log('Updating calendar event:', updatedEvent);
      
      const { data, error } = await supabase
        .from('calendar_events')
        .update(updatedEvent)
        .eq('id', event.id)
        .select();
        
      if (error) {
        console.error('Error updating event:', error);
        toast.error('Failed to update event');
        return { success: false, error };
      }
      
      toast.success('Event updated');
      fetchEvents(); // Refresh events
      return { success: true, data };
    } catch (err) {
      console.error('Error in updateEvent:', err);
      toast.error('An error occurred while updating the event');
      return { success: false, error: err };
    }
  };

  // Remove an event
  const removeEvent = async (eventId: string) => {
    if (!user || !eventId) {
      toast.error('Invalid event ID or user not authenticated');
      return { success: false };
    }
    
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);
        
      if (error) {
        console.error('Error removing event:', error);
        toast.error('Failed to remove event');
        return { success: false, error };
      }
      
      toast.success('Event removed');
      fetchEvents(); // Refresh events
      return { success: true };
    } catch (err) {
      console.error('Error in removeEvent:', err);
      toast.error('An error occurred while removing the event');
      return { success: false, error: err };
    }
  };

  // Toggle event lock status
  const toggleEventLock = async (eventId: string, isLocked: boolean) => {
    if (!user || !eventId) {
      toast.error('Invalid event ID or user not authenticated');
      return { success: false };
    }
    
    try {
      const { error } = await supabase
        .from('calendar_events')
        .update({ is_locked: isLocked })
        .eq('id', eventId);
        
      if (error) {
        console.error('Error toggling event lock:', error);
        toast.error('Failed to update event');
        return { success: false, error };
      }
      
      toast.success(isLocked ? 'Event locked' : 'Event unlocked');
      fetchEvents(); // Refresh events
      return { success: true };
    } catch (err) {
      console.error('Error in toggleEventLock:', err);
      toast.error('An error occurred');
      return { success: false, error: err };
    }
  };

  // Add a test event function to help debug
  const addTestEvent = async () => {
    if (!user) {
      toast.error('User not authenticated');
      return { success: false };
    }
    
    // Current date and time
    const now = dayjs();
    const startsAt = now.add(1, 'hour').toISOString();
    const endsAt = now.add(2, 'hour').toISOString();
    
    const testEvent = {
      title: "Test Event",
      description: "This is a test event",
      user_id: user.id,
      color: 'bg-purple-500/70',
      starts_at: startsAt,
      ends_at: endsAt
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

  return {
    events,
    loading,
    error,
    fetchEvents,
    addEvent,
    updateEvent,
    removeEvent,
    toggleEventLock,
    addTestEvent,
  };
}
