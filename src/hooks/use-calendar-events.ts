
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarEventType } from '@/lib/stores/types';
import { toast } from 'sonner';

interface CalendarEventResponse {
  success: boolean;
  message: string;
  eventId?: string;
  error?: any;
}

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<CalendarEventResponse | null>(null);
  const { user } = useAuth();

  // Fetch calendar events from Supabase
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setEvents([]);
        setLoading(false);
        return;
      }
      
      console.log('Fetching calendar events for user:', user.id);
      
      // Fetch the calendar events
      const { data: eventsData, error: eventsError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id);
      
      if (eventsError) {
        console.error('Error fetching calendar events:', eventsError);
        throw eventsError;
      }
      
      console.log('Fetched calendar events:', eventsData || []);
      
      // Transform the data to match CalendarEventType
      const transformedEvents = eventsData ? eventsData.map(event => {
        // Parse time information from the description or use ends_at
        const timeInfo = getTimeInfo(event.description);
        
        return {
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
        };
      }) as CalendarEventType[] : [];
      
      setEvents(transformedEvents);
    } catch (err: any) {
      console.error('Error in fetchEvents:', err);
      setError(err.message || err.error_description || String(err));
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Helper function to extract time information from description
  const getTimeInfo = (description: string) => {
    const defaultResult = { start: '09:00', end: '10:00' };
    
    if (!description) return defaultResult;
    
    const parts = description.split('|');
    if (parts.length < 1) return defaultResult;
    
    const timePart = parts[0].trim();
    const timeMatch = timePart.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    
    if (!timeMatch) return defaultResult;
    
    return {
      start: timeMatch[1],
      end: timeMatch[2]
    };
  };

  // Add a new calendar event to Supabase
  const addEvent = async (event: CalendarEventType) => {
    try {
      if (!user) {
        const response = {
          success: false,
          message: 'User not authenticated',
        };
        setLastResponse(response);
        toast.error('User not authenticated. Please log in to add events.');
        return response;
      }
      
      console.log('Adding new calendar event:', event);
      
      // Validate essential fields
      if (!event.title || !event.date || !event.description) {
        const response = {
          success: false,
          message: 'Missing required fields (title, date, or description)',
        };
        setLastResponse(response);
        toast.error('Missing required fields for event');
        return response;
      }
      
      // Extract time information from the description
      const timeInfo = getTimeInfo(event.description);
      
      // Calculate ends_at based on the event date and end time
      const [year, month, day] = event.date.split('-').map(Number);
      const [endHour, endMinute] = timeInfo.end.split(':').map(Number);
      
      // Create a date object for ends_at
      const endsAt = new Date(year, month - 1, day, endHour, endMinute);
      
      // Transform event to match Supabase table schema
      const newEvent = {
        title: event.title,
        date: event.date,
        description: event.description,
        color: event.color || 'bg-blue-400/70',
        is_locked: event.isLocked || false,
        is_todo: event.isTodo || false,
        has_alarm: event.hasAlarm || false,
        has_reminder: event.hasReminder || false,
        todo_id: event.todoId,
        user_id: user.id,
        ends_at: endsAt.toISOString()
      };
      
      const { data, error } = await supabase
        .from('calendar_events')
        .insert(newEvent)
        .select();
      
      if (error) {
        console.error('Error adding calendar event:', error);
        const response = {
          success: false,
          message: `Failed to add event: ${error.message}`,
          error
        };
        setLastResponse(response);
        toast.error(`Failed to add event: ${error.message}`);
        return response;
      }
      
      console.log('Event successfully added with response:', data);
      
      if (data && data.length > 0) {
        const newEventId = data[0].id;
        
        // Create transformed event with correct structure for state
        const transformedEvent: CalendarEventType = {
          id: newEventId,
          title: event.title,
          date: event.date,
          description: event.description,
          color: event.color || 'bg-blue-400/70',
          isLocked: event.isLocked || false,
          isTodo: event.isTodo || false,
          hasAlarm: event.hasAlarm || false,
          hasReminder: event.hasReminder || false,
          todoId: event.todoId
        };
        
        // Update local state optimistically
        setEvents(prevEvents => [transformedEvent, ...prevEvents]);
        
        const response = {
          success: true,
          message: 'Event added successfully',
          eventId: newEventId,
        };
        setLastResponse(response);
        toast.success('Event added successfully');
        return response;
      }
      
      // Refetch events since we couldn't update the state optimistically
      fetchEvents();
      
      const response = {
        success: true,
        message: 'Event added but ID not returned',
      };
      setLastResponse(response);
      toast.success('Event added successfully');
      return response;
    } catch (err: any) {
      console.error('Error adding calendar event:', err);
      const response = {
        success: false,
        message: `Error adding event: ${err.message || String(err)}`,
        error: err
      };
      setLastResponse(response);
      toast.error(`Error adding event: ${err.message || String(err)}`);
      return response;
    }
  };

  // Remove a calendar event
  const removeEvent = async (id: string) => {
    try {
      if (!user) {
        toast.error('User not authenticated. Please log in to remove events.');
        return;
      }
      
      if (!id) {
        toast.error('Invalid event ID');
        return;
      }
      
      // Optimistically update the UI
      setEvents(prevEvents => prevEvents.filter(event => event.id !== id));
      
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error removing calendar event:', error);
        toast.error('Failed to remove event');
        // Refetch events to restore the correct state
        fetchEvents();
        return;
      }
      
      toast.success('Event removed successfully');
    } catch (err: any) {
      console.error('Error removing calendar event:', err);
      toast.error('Failed to remove event');
      
      // Refetch events to restore the correct state
      fetchEvents();
    }
  };

  // Update a calendar event
  const updateEvent = async (event: CalendarEventType) => {
    try {
      if (!user) {
        toast.error('User not authenticated. Please log in to update events.');
        return;
      }
      
      if (!event.id) {
        toast.error('Invalid event ID');
        return;
      }
      
      // Optimistically update the UI
      setEvents(prevEvents => prevEvents.map(e => 
        e.id === event.id ? event : e
      ));
      
      // Extract time information from the description
      const timeInfo = getTimeInfo(event.description);
      
      // Calculate ends_at based on the event date and end time
      const [year, month, day] = event.date.split('-').map(Number);
      const [endHour, endMinute] = timeInfo.end.split(':').map(Number);
      
      // Create a date object for ends_at
      const endsAt = new Date(year, month - 1, day, endHour, endMinute);
      
      // Transform event to match Supabase table schema
      const updatedEvent = {
        title: event.title,
        date: event.date,
        description: event.description,
        color: event.color,
        is_locked: event.isLocked,
        is_todo: event.isTodo,
        has_alarm: event.hasAlarm,
        has_reminder: event.hasReminder,
        todo_id: event.todoId,
        ends_at: endsAt.toISOString()
      };
      
      const { error } = await supabase
        .from('calendar_events')
        .update(updatedEvent)
        .eq('id', event.id)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error updating calendar event:', error);
        toast.error('Failed to update event');
        // Refetch events to restore the correct state
        fetchEvents();
        return;
      }
      
      toast.success('Event updated successfully');
    } catch (err: any) {
      console.error('Error updating calendar event:', err);
      toast.error('Failed to update event');
      
      // Refetch events to restore the correct state
      fetchEvents();
    }
  };

  // Toggle an event's lock state
  const toggleEventLock = async (id: string, isLocked: boolean) => {
    try {
      if (!user) {
        toast.error('User not authenticated. Please log in to modify events.');
        return;
      }
      
      if (!id) {
        toast.error('Invalid event ID');
        return;
      }
      
      // Optimistically update the UI
      setEvents(prevEvents => prevEvents.map(event => 
        event.id === id ? { ...event, isLocked } : event
      ));
      
      const { error } = await supabase
        .from('calendar_events')
        .update({ is_locked: isLocked })
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error toggling event lock:', error);
        toast.error('Failed to update event');
        
        // Refetch events to restore the correct state
        fetchEvents();
      }
    } catch (err: any) {
      console.error('Error toggling event lock:', err);
      toast.error('Failed to update event');
      
      // Refetch events to restore the correct state
      fetchEvents();
    }
  };

  // Load events when component mounts or user changes
  useEffect(() => {
    if (user) {
      console.log('User is authenticated, fetching calendar events');
      fetchEvents();
    } else {
      console.log('No user, clearing calendar events');
      setEvents([]);
      setLoading(false);
    }
    
    // Set up real-time subscription for calendar events
    const channel = supabase
      .channel('calendar-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'calendar_events', 
          filter: user ? `user_id=eq.${user.id}` : undefined 
        }, 
        (payload) => {
          console.log('Realtime update received for calendar events:', payload);
          // Only refetch when the user is authenticated
          if (user) {
            fetchEvents();
          }
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
    addEvent,
    removeEvent,
    updateEvent,
    toggleEventLock,
    refetchEvents: fetchEvents,
    lastResponse
  };
}
