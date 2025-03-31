
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
  
  // New fields to match the updated database schema
  startsAt: string; // ISO string format
  endsAt: string; // ISO string format
  date?: string; // Derived from startsAt for backward compatibility
};
