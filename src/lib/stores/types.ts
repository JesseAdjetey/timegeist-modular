
export type ModuleType = 'todo' | 'pomodoro' | 'alarms' | 'eisenhower' | 'invites';

export interface ModuleInstance {
  type: ModuleType;
  title: string;
  minimized?: boolean; // New property to track minimized state
}

export interface SidebarPage {
  id: string;
  title: string;
  modules: ModuleInstance[];
}

export type CalendarEventType = {
  id: string;
  title: string;
  description: string;
  isLocked?: boolean;
  isTodo?: boolean;
  hasAlarm?: boolean;
  hasReminder?: boolean;
  participants?: string[];
  color?: string;
  todoId?: string; // Reference to the original todo item
  
  // Updated fields to match the database schema
  startsAt: string; // ISO string format
  endsAt: string; // ISO string format
  
  // Optional date field for backward compatibility
  date?: string; // Derived from startsAt for backward compatibility
  
  // Additional fields for UI display
  timeStart?: string; // Derived from startsAt
  timeEnd?: string; // Derived from endsAt
};
