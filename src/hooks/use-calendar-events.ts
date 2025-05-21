// Updated version of useCalendarEvents hook for the new calendar_events schema
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarEventType } from '@/lib/stores/types';
import { toast } from 'sonner';
import dayjs from 'dayjs';

// Define explicit types for Supabase responses to prevent deep type instantiation
interface SupabaseEventResponse {
  data: any[] | null;
  error: Error | null;
}

interface SupabaseActionResponse {
  success: boolean;
  data?: any;
  error?: Error | unknown;
  // Additional fields for diagnostics
  diagnosticMessage?: string;
}

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
  const fetchEvents = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('===== FETCH EVENTS DEBUG =====');
      console.log('Authentication Status:', {
        user: user ? 'User authenticated' : 'No user',
        userId: user?.id,
        email: user?.email
      });
      
      if (!user) {
        console.log('No authenticated user, clearing events');
        setEvents([]);
        setLoading(false);
        return;
      }
      
      console.log('Fetching calendar events for user:', user.id);
      
      // Query the new calendar_events table structure
      const { data, error: fetchError }: SupabaseEventResponse = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id);
      
      console.log('Supabase Query Details:', {
        method: 'select',
        table: 'calendar_events',
        userId: user.id
      });
      
      if (fetchError) {
        console.error('Detailed Supabase Fetch Error:', fetchError);
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
      console.error('===== FETCH EVENTS CATCH BLOCK =====');
      console.error('Error Details:', {
        message: err.message,
        name: err.name,
        stack: err.stack,
        fullError: err
      });
      setError(err.message || err.error_description || String(err));
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add a new event
  const addEvent = async (event: CalendarEventType): Promise<SupabaseActionResponse> => {
    console.log('===== FULL EVENT OBJECT BEFORE INSERTION =====');
    console.log(JSON.stringify(event, null, 2));
    console.log('===== ADD EVENT DEBUG =====');
    console.log('Authentication Status:', {
      user: user ? 'User authenticated' : 'No user',
      userId: user?.id,
      email: user?.email
    });
    
    if (!user) {
      console.error('No authenticated user');
      toast.error('User not authenticated');
      return { success: false };
    }
    
    try {
      console.log('Incoming Event Object:', event);
      
      // Parse the time range from description (e.g., "09:00 - 10:00 | Description")
      const timeRange = extractTimeString(event.description);
      console.log('Extracted Time Range:', timeRange);
      
      const [startTime, endTime] = timeRange.split('-').map(t => t.trim());
      console.log('Start Time:', startTime);
      console.log('End Time:', endTime);
      
      const eventDate = event.date || dayjs().format('YYYY-MM-DD');
      console.log('Event Date:', eventDate);
      
      // Create timestamps by combining date and time
      const startsAt = dayjs(`${eventDate} ${startTime}`).toISOString();
      const endsAt = dayjs(`${eventDate} ${endTime}`).toISOString();
      
      console.log('Starts At (ISO):', startsAt);
      console.log('Ends At (ISO):', endsAt);
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
      
      console.log('Prepared Supabase Event Object:', newEvent);
      console.log('Supabase client config:', {
        authHeader: !!supabase.auth,
        userId: user.id
      });
      
      const { data, error } = await supabase
        .from('calendar_events')
        .insert(newEvent)
        .select();
      
      console.log('Supabase Insert Response:', { 
        success: !error, 
        data: data ? `Data returned with ${data.length} items` : 'No data', 
        error: error ? JSON.stringify(error) : 'No error'
      });
      
      if (error) {
        console.error('Detailed Supabase Error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        toast.error(`Failed to add event: ${error.message}`);
        return { success: false, error };
      }
      
      toast.success('Event added');
      await fetchEvents(); // Refresh events
      return { success: true, data };
    } catch (err: any) {
      console.error('===== ADD EVENT CATCH BLOCK =====');
      console.error('Error Details:', {
        message: err.message,
        name: err.name,
        stack: err.stack,
        fullError: err
      });
      
      toast.error('An error occurred while adding the event');
      return { success: false, error: err };
    }
  };

  // Update an existing event
  const updateEvent = async (event: CalendarEventType): Promise<SupabaseActionResponse> => {
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
      await fetchEvents(); // Refresh events
      return { success: true, data };
    } catch (err) {
      console.error('Error in updateEvent:', err);
      toast.error('An error occurred while updating the event');
      return { success: false, error: err };
    }
  };

  // Remove an event
  const removeEvent = async (eventId: string): Promise<SupabaseActionResponse> => {
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
      await fetchEvents(); // Refresh events
      return { success: true };
    } catch (err) {
      console.error('Error in removeEvent:', err);
      toast.error('An error occurred while removing the event');
      return { success: false, error: err };
    }
  };

  // Toggle event lock status
  const toggleEventLock = async (eventId: string, isLocked: boolean): Promise<SupabaseActionResponse> => {
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
      await fetchEvents(); // Refresh events
      return { success: true };
    } catch (err) {
      console.error('Error in toggleEventLock:', err);
      toast.error('An error occurred');
      return { success: false, error: err };
    }
  };

  // Add a test event function to help debug
  const addTestEvent = async (): Promise<SupabaseActionResponse> => {
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
      await fetchEvents(); // Refresh events
      return { success: true, data };
    } catch (err) {
      console.error('Error in addTestEvent:', err);
      toast.error('An error occurred');
      return { success: false, error: err };
    }
  };

  // Diagnostic test function to help troubleshoot calendar event issues
  const testCalendarDatabase = async (): Promise<SupabaseActionResponse> => {
    if (!user) {
      toast.error('User not authenticated');
      return { success: false };
    }
    
    try {
      // First, try to fetch events to test read access
      console.log('CALENDAR DATABASE TEST: Testing read access...');
      const { data: readData, error: readError } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      if (readError) {
        console.error('TEST FAILED: Cannot read from calendar_events table:', readError);
        return { 
          success: false, 
          error: readError 
        };
      }
      
      console.log('READ TEST PASSED. Found events:', readData?.length);
      
      // Next, try to create a test event
      console.log('CALENDAR DATABASE TEST: Testing write access...');
      const testEvent = {
        title: "DATABASE TEST EVENT - Please Delete",
        description: "This is an automated test to verify database permissions",
        color: "bg-red-500/70",
        user_id: user.id,
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
        has_reminder: false,
        has_alarm: false,
        is_locked: false,
        is_todo: false
      };
      
      const { data: writeData, error: writeError } = await supabase
        .from('calendar_events')
        .insert(testEvent)
        .select();
      
      if (writeError) {
        console.error('TEST FAILED: Cannot write to calendar_events table:', writeError);
        return { 
          success: false, 
          error: writeError 
        };
      }
      
      console.log('WRITE TEST PASSED. Created test event:', writeData?.[0]?.id);
      
      // Finally, clean up by deleting the test event
      if (writeData && writeData[0]) {
        const { error: deleteError } = await supabase
          .from('calendar_events')
          .delete()
          .eq('id', writeData[0].id);
        
        if (deleteError) {
          console.warn('TEST CLEANUP FAILED: Cannot delete test event:', deleteError);
        } else {
          console.log('TEST CLEANUP PASSED: Test event deleted successfully');
        }
      }
      
      toast.success('Calendar database test passed!');
      return { 
        success: true,
        data: { readTest: true, writeTest: true }
      };
    } catch (err) {
      console.error('ERROR DURING CALENDAR DATABASE TEST:', err);
      toast.error('Calendar database test failed');
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
    testCalendarDatabase,
  };
}
