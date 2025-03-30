
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import dayjs from "dayjs";
import { CalendarEventType } from "./types";

type EventStore = {
  events: CalendarEventType[];
  isPopoverOpen: boolean;
  isEventSummaryOpen: boolean;
  selectedEvent: CalendarEventType | null;
  setEvents: (events: CalendarEventType[]) => void;
  addEvent: (event: CalendarEventType) => void;
  updateEvent: (event: CalendarEventType) => void;
  deleteEvent: (id: string) => void;
  openPopover: () => void;
  closePopover: () => void;
  openEventSummary: (event: CalendarEventType) => void;
  closeEventSummary: () => void;
  toggleEventLock: (id: string, isLocked: boolean) => void;
};

export const useEventStore = create<EventStore>()(
  devtools(
    persist(
      (set, get) => ({
        events: [
          {
            id: '1',
            title: 'Gym',
            date: dayjs().format('YYYY-MM-DD'),
            description: '6:00 - 7:30 | Workout session',
            color: 'bg-green-500/70',
            isLocked: false
          },
          {
            id: '2',
            title: 'Design Meeting',
            date: dayjs().format('YYYY-MM-DD'),
            description: '9:00 - 10:30 | Product team sync',
            color: 'bg-blue-400/70',
            participants: ['JD', 'MK', 'AR'],
            isLocked: true
          },
          {
            id: '3',
            title: 'Lunch with Team',
            date: dayjs().format('YYYY-MM-DD'),
            description: '12:30 - 13:30 | Restaurant downtown',
            color: 'bg-purple-500/70'
          },
          {
            id: '4',
            title: 'Presentation',
            date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
            description: '14:00 - 15:00 | Client pitch',
            color: 'bg-red-500/70',
            isLocked: true
          }
        ],
        isPopoverOpen: false,
        isEventSummaryOpen: false,
        selectedEvent: null,
        setEvents: (events) => {
          set({ events });
        },
        addEvent: (event) => {
          set(state => ({ 
            events: [...state.events, event] 
          }));
        },
        updateEvent: (event) => {
          set(state => ({
            events: state.events.map(e => 
              e.id === event.id ? { ...e, ...event } : e
            )
          }));
        },
        deleteEvent: (id) => {
          set(state => ({
            events: state.events.filter(e => e.id !== id),
            isEventSummaryOpen: false,
            selectedEvent: null
          }));
        },
        openPopover: () => {
          set({ isPopoverOpen: true });
        },
        closePopover: () => {
          set({ isPopoverOpen: false });
        },
        openEventSummary: (event) => {
          set({ isEventSummaryOpen: true, selectedEvent: event });
        },
        closeEventSummary: () => {
          set({ isEventSummaryOpen: false, selectedEvent: null });
        },
        toggleEventLock: (id, isLocked) => {
          set(state => ({
            events: state.events.map(event => 
              event.id === id ? { ...event, isLocked } : event
            )
          }));
        }
      }),
      { name: "event_data", skipHydration: true }
    )
  )
);
