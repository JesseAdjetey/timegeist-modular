
// Custom type definitions for database tables

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Alarm {
  id: string;
  event_id?: string;
  alarm_time: string;
  is_snoozed: boolean;
  snooze_until?: string;
  alarm_type?: string;
  title: string;
  description?: string;
  user_id: string;
  is_recurring: boolean;
  recurring_type?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurring_interval?: number;
  recurring_days?: number[];
  recurring_months?: number[];
  recurring_day_of_month?: number;
  recurring_end_date?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time_start?: string;
  time_end?: string;
  color?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}
