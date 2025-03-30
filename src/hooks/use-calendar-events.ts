
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarEventType } from '@/lib/stores/types';
import { nanoid } from 'nanoid';
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
        return;
      }
      
      console.log('Fetching calendar events for user:', user.id);
      
      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          id, 
          title, 
          date, 
          description, 
          color,
          is_locked,
          is_todo,
          has_alarm,
          has_reminder,
          todo_id,
          event_participants(participant_code)
        `)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error details:', error);
        throw error;
      }
      
      console.log('Fetched calendar events:', data);
      
      // Transform the data to match CalendarEventType
      const transformedEvents = data?.map(event => {
        const participants = event.event_participants?.map(p => p.participant_code) || [];
        
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
          todoId: event.todo_id,
          participants: participants.length > 0 ? participants : undefined
        } as CalendarEventType;
      }) || [];
      
      setEvents(transformedEvents);
    } catch (err: any) {
      console.error('Error fetching calendar events:', err);
      setError(err.message || err.error_description || String(err));
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add a new calendar event to Supabase
  const addEvent = async (event: CalendarEventType) => {
    try {
      if (!user) {
        const response = {
          success: false,
          message: 'User not authenticated',
        };
        setLastResponse(response);
        return response;
      }
      
      console.log('Adding new calendar event:', event);
      
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
        user_id: user.id
      };
      
      const { data, error } = await supabase
        .from('calendar_events')
        .insert(newEvent)
        .select();
      
      if (error) {
        console.error('Error details:', error);
        const response = {
          success: false,
          message: `Failed to add event: ${error.message}`,
          error
        };
        setLastResponse(response);
        return response;
      }
      
      console.log('Event successfully added with response:', data);
      
      if (data && data.length > 0) {
        const newEventId = data[0].id;
        
        // If there are participants, add them
        if (event.participants && event.participants.length > 0) {
          const participantPromises = event.participants.map(code => 
            supabase
              .from('event_participants')
              .insert({
                event_id: newEventId,
                participant_code: code
              })
          );
          
          await Promise.all(participantPromises);
        }
        
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
          todoId: event.todoId,
          participants: event.participants
        };
        
        // Update local state optimistically
        setEvents(prevEvents => [transformedEvent, ...prevEvents]);
        
        const response = {
          success: true,
          message: 'Event added successfully',
          eventId: newEventId,
        };
        setLastResponse(response);
        return response;
      }
      
      const response = {
        success: true,
        message: 'Event added but ID not returned',
      };
      setLastResponse(response);
      return response;
    } catch (err: any) {
      console.error('Error adding calendar event:', err);
      const response = {
        success: false,
        message: `Error adding event: ${err.message || String(err)}`,
        error: err
      };
      setLastResponse(response);
      return response;
    }
  };

  // Remove a calendar event
  const removeEvent = async (id: string) => {
    try {
      if (!user) return;
      
      // Optimistically update the UI
      setEvents(prevEvents => prevEvents.filter(event => event.id !== id));
      
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error details:', error);
        throw error;
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
      if (!user) return;
      
      // Optimistically update the UI
      setEvents(prevEvents => prevEvents.map(e => 
        e.id === event.id ? event : e
      ));
      
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
        todo_id: event.todoId
      };
      
      const { error } = await supabase
        .from('calendar_events')
        .update(updatedEvent)
        .eq('id', event.id)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error details:', error);
        throw error;
      }
      
      // Handle participants if they exist
      if (event.participants) {
        // First delete existing participants
        await supabase
          .from('event_participants')
          .delete()
          .eq('event_id', event.id);
        
        // Then add new participants
        const participantPromises = event.participants.map(code => 
          supabase
            .from('event_participants')
            .insert({
              event_id: event.id,
              participant_code: code
            })
        );
        
        await Promise.all(participantPromises);
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
      if (!user) return;
      
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
        console.error('Error details:', error);
        throw error;
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
    const eventsSubscription = supabase
      .channel('calendar-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'calendar_events', filter: `user_id=eq.${user?.id}` }, 
        (payload) => {
          console.log('Realtime update received for calendar events:', payload);
          // Only refetch when the user is authenticated
          if (user) {
            fetchEvents();
          }
        }
      )
      .subscribe();
    
    // Set up real-time subscription for event participants
    const participantsSubscription = supabase
      .channel('participants-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'event_participants' }, 
        (payload) => {
          console.log('Realtime update received for event participants:', payload);
          // Only refetch when the user is authenticated
          if (user) {
            fetchEvents();
          }
        }
      )
      .subscribe();
      
    return () => {
      console.log('Cleaning up subscriptions');
      supabase.removeChannel(eventsSubscription);
      supabase.removeChannel(participantsSubscription);
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
