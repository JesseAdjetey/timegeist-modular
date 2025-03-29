
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import dayjs, { Dayjs } from "dayjs";
import { getMonth } from "@/lib/getTime";

interface ViewStoreType {
  selectedView: string;
  setView: (value: string) => void;
}

interface DateStoreType {
  userSelectedDate: Dayjs;
  setDate: (value: Dayjs) => void;
  twoDMonthArray: dayjs.Dayjs[][];
  selectedMonthIndex: number;
  setMonth: (index: number) => void;
}

export type ModuleType = 'todo' | 'pomodoro' | 'alarms' | 'eisenhower' | 'invites';

interface SidebarPage {
  id: string;
  title: string;
  modules: ModuleType[];
}

interface SidebarStoreType {
  pages: SidebarPage[];
  currentPageIndex: number;
  addPage: (title: string) => void;
  setCurrentPage: (index: number) => void;
  addModule: (pageIndex: number, moduleType: ModuleType) => void;
  removeModule: (pageIndex: number, moduleIndex: number) => void;
  updatePageTitle: (pageIndex: number, title: string) => void;
}

export type CalendarEventType = {
  id: string;
  title: string;
  date: string;
  description: string;
  isLocked?: boolean;
  isTodo?: boolean;
  hasAlarm?: boolean;
  hasReminder?: boolean;
  participants?: string[];
  color?: string;
};

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
}

export const useViewStore = create<ViewStoreType>()(
  devtools(
    persist(
      (set) => ({
        selectedView: "Week",
        setView: (value: string) => {
          set({ selectedView: value });
        },
      }),
      { name: "calendar_view", skipHydration: true }
    )
  )
);

export const useDateStore = create<DateStoreType>()(
  devtools(
    persist(
      (set) => ({
        userSelectedDate: dayjs(),
        setDate: (value: Dayjs) => {
          set({ userSelectedDate: value });
        },
        twoDMonthArray: getMonth(),
        selectedMonthIndex: dayjs().month(),
        setMonth: (index: number) => {
          set({twoDMonthArray: getMonth(index), selectedMonthIndex: index });
        },
      }),
      { name: "date_data", skipHydration: true }
    )
  )
);

export const useSidebarStore = create<SidebarStoreType>()(
  devtools(
    persist(
      (set, get) => ({
        pages: [
          {
            id: '1',
            title: 'Tasks',
            modules: ['todo', 'eisenhower']
          },
          {
            id: '2',
            title: 'Tools',
            modules: ['pomodoro', 'alarms', 'invites']
          }
        ],
        currentPageIndex: 0,
        addPage: (title) => {
          set(state => ({
            pages: [...state.pages, {
              id: Date.now().toString(),
              title,
              modules: []
            }]
          }));
        },
        setCurrentPage: (index) => {
          set({ currentPageIndex: index });
        },
        addModule: (pageIndex, moduleType) => {
          set(state => {
            const newPages = [...state.pages];
            if (newPages[pageIndex]) {
              newPages[pageIndex].modules = [...newPages[pageIndex].modules, moduleType];
            }
            return { pages: newPages };
          });
        },
        removeModule: (pageIndex, moduleIndex) => {
          set(state => {
            const newPages = [...state.pages];
            if (newPages[pageIndex] && newPages[pageIndex].modules) {
              newPages[pageIndex].modules = newPages[pageIndex].modules.filter((_, i) => i !== moduleIndex);
            }
            return { pages: newPages };
          });
        },
        updatePageTitle: (pageIndex, title) => {
          set(state => {
            const newPages = [...state.pages];
            if (newPages[pageIndex]) {
              newPages[pageIndex].title = title;
            }
            return { pages: newPages };
          });
        }
      }),
      { name: "sidebar_data", skipHydration: true }
    )
  )
);

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
            events: state.events.filter(e => e.id !== id)
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
