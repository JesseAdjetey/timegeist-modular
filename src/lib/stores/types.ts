
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
  date: string;
  description: string;
  isLocked?: boolean;
  isTodo?: boolean;
  hasAlarm?: boolean;
  hasReminder?: boolean;
  participants?: string[];
  color?: string;
  todoId?: string; // Added todoId property to reference the original todo item
};
