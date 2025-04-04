
import { useState, useEffect } from 'react';
import { useEventStore } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarEventType } from '@/lib/stores/types';
import { nanoid } from '@/lib/utils';

// Define the expected return type of addEvent to avoid infinite type recursion
type AddEventResponse = {
  success: boolean;
  data?: any;
  message?: string;
};

// Define the expected return type for updateEvent
type UpdateEventResponse = {
  success: boolean;
  message?: string;
};

// Define the expected return type for deleteEvent
type DeleteEventResponse = {
  success: boolean;
  message?: string;
};

// Define the expected return type for getEventById
type GetEventResponse = {
  success: boolean;
  event?: CalendarEventType;
  message?: string;
};

export const useCalendarEvents = () => {
  const { events, setEvents, addEvent: addEventToStore, updateEvent: updateEventInStore, deleteEvent: deleteEventFromStore, isInitialized, setIsInitialized } = useEventStore();
  const { user } = useAuth();
  const [loadingEvents, setLoadingEvents] = useState(false);
  
  const transformEvent = (data: any): CalendarEventType => ({
    id: data.id,
    title: data.title || '',
    description: data.description || '',
    date: data.date,
    color: data.color || 'bg-primary/70',
    isLocked: !!data.is_locked,
    isTodo: !!data.is_todo,
    hasAlarm: !!data.has_alarm,
    hasReminder: !!data.has_reminder,
    todoId: data.todo_id,
    participants: data.participants || [],
    startsAt: data.starts_at || data.time_start || '',
    endsAt: data.ends_at || data.time_end || ''
  });

  const fetchEvents = async () => {
    if (!user) return;

    setLoadingEvents(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('starts_at', { ascending: true });

      if (error) {
        console.error("Error fetching events:", error);
        return;
      }

      const transformedEvents = data.map(transformEvent);
      setEvents(transformedEvents);
    } catch (error) {
      console.error("Unexpected error fetching events:", error);
    } finally {
      setLoadingEvents(false);
      setIsInitialized(true);
    }
  };

  const addEvent = async (event: CalendarEventType): Promise<AddEventResponse> => {
    if (!user) return { success: false, message: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('events')
        .insert([
          {
            id: nanoid(),
            user_id: user.id,
            title: event.title,
            description: event.description,
            date: event.date,
            color: event.color,
            is_locked: event.isLocked,
            is_todo: event.isTodo,
            has_alarm: event.hasAlarm,
            has_reminder: event.hasReminder,
            todo_id: event.todoId,
            participants: event.participants,
            starts_at: event.startsAt,
            ends_at: event.endsAt
          },
        ])
        .select();

      if (error) {
        console.error("Error adding event:", error);
        return { success: false, message: error.message };
      }

      const transformedEvent = transformEvent(data[0]);
      addEventToStore(transformedEvent);
      return { success: true, data };
    } catch (error: any) {
      console.error("Unexpected error adding event:", error);
      return { success: false, message: error.message || 'Unknown error' };
    }
  };

  const updateEvent = async (event: CalendarEventType): Promise<UpdateEventResponse> => {
    if (!user) return { success: false, message: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('events')
        .update({
          title: event.title,
          description: event.description,
          date: event.date,
          color: event.color,
          is_locked: event.isLocked,
          is_todo: event.isTodo,
          has_alarm: event.hasAlarm,
          has_reminder: event.hasReminder,
          todo_id: event.todoId,
          participants: event.participants,
          starts_at: event.startsAt,
          ends_at: event.endsAt
        })
        .eq('id', event.id)
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error("Error updating event:", error);
        return { success: false, message: error.message };
      }

      const transformedEvent = transformEvent(data[0]);
      updateEventInStore(transformedEvent);
      return { success: true };
    } catch (error: any) {
      console.error("Unexpected error updating event:", error);
      return { success: false, message: error.message || 'Unknown error' };
    }
  };

  const deleteEvent = async (id: string): Promise<DeleteEventResponse> => {
    if (!user) return { success: false, message: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error("Error deleting event:", error);
        return { success: false, message: error.message };
      }

      deleteEventFromStore(id);
      return { success: true };
    } catch (error: any) {
      console.error("Unexpected error deleting event:", error);
      return { success: false, message: error.message || 'Unknown error' };
    }
  };
  
  const getEventById = async (id: string): Promise<GetEventResponse> => {
    try {
      // First try to find it in the local store
      const localEvent = events.find(e => e.id === id);
      if (localEvent) {
        return { success: true, event: localEvent };
      }
      
      // If not found locally, try to fetch from the database
      if (!user) return { success: false, message: 'User not authenticated' };
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching event by ID:', error);
        return { success: false, message: error.message };
      }
      
      if (!data) {
        return { success: false, message: 'Event not found' };
      }
      
      // Transform the database event to the app format
      const transformedEvent = transformEvent(data);
      
      return { success: true, event: transformedEvent };
    } catch (err: any) {
      console.error('Unexpected error fetching event by ID:', err);
      return { success: false, message: err.message || 'Unknown error' };
    }
  };
  
  return {
    events,
    loadingEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventById
  };
};
