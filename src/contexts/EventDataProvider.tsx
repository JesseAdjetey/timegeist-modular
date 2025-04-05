
import React, { useEffect } from 'react';
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import { useEventStore } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface EventDataProviderProps {
  children: React.ReactNode;
}

const EventDataProvider: React.FC<EventDataProviderProps> = ({ children }) => {
  const { events, loading, error, addEvent, removeEvent, updateEvent, toggleEventLock } = useCalendarEvents();
  const { setEvents, setIsInitialized, isInitialized } = useEventStore();
  const { user } = useAuth();

  // Update the store when events change
  useEffect(() => {
    if (!loading && !error) {
      setEvents(events);
      if (!isInitialized) {
        setIsInitialized(true);
      }
    }
  }, [events, loading, error, setEvents, setIsInitialized, isInitialized]);

  // When user logs out, clear events
  useEffect(() => {
    if (!user && isInitialized) {
      setEvents([]);
    }
  }, [user, isInitialized, setEvents]);

  // Handle any errors from the calendar events hook
  useEffect(() => {
    if (error) {
      console.error('Calendar events error:', error);
      toast.error(`Error loading calendar events: ${error}`);
    }
  }, [error]);

  return <>{children}</>;
};

export default EventDataProvider;
