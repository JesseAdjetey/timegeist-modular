
import React, { useEffect } from 'react';
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import { useEventStore } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';

interface EventDataProviderProps {
  children: React.ReactNode;
}

const EventDataProvider: React.FC<EventDataProviderProps> = ({ children }) => {
  const { events, loadingEvents } = useCalendarEvents();
  const { setEvents, setIsInitialized, isInitialized } = useEventStore();
  const { user } = useAuth();

  // Update the store when events change
  useEffect(() => {
    if (!loadingEvents) {
      setEvents(events);
      if (!isInitialized) {
        setIsInitialized(true);
      }
    }
  }, [events, loadingEvents, setEvents, setIsInitialized, isInitialized]);

  // When user logs out, clear events
  useEffect(() => {
    if (!user && isInitialized) {
      setEvents([]);
    }
  }, [user, isInitialized, setEvents]);

  return <>{children}</>;
};

export default EventDataProvider;
