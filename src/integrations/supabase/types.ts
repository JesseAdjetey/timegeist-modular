export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_suggestions: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          reason: string | null
          responded_at: string | null
          status: string | null
          suggested_date: string | null
          suggested_time_end: string | null
          suggested_time_start: string | null
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          reason?: string | null
          responded_at?: string | null
          status?: string | null
          suggested_date?: string | null
          suggested_time_end?: string | null
          suggested_time_start?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          reason?: string | null
          responded_at?: string | null
          status?: string | null
          suggested_date?: string | null
          suggested_time_end?: string | null
          suggested_time_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      alarms: {
        Row: {
          alarm_time: string
          alarm_type: string | null
          event_id: string | null
          id: string
          is_snoozed: boolean | null
          repeat_interval: string | null
          snooze_until: string | null
        }
        Insert: {
          alarm_time: string
          alarm_type?: string | null
          event_id?: string | null
          id?: string
          is_snoozed?: boolean | null
          repeat_interval?: string | null
          snooze_until?: string | null
        }
        Update: {
          alarm_time?: string
          alarm_type?: string | null
          event_id?: string | null
          id?: string
          is_snoozed?: boolean | null
          repeat_interval?: string | null
          snooze_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alarms_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          ends_at: string
          has_alarm: boolean | null
          has_reminder: boolean | null
          id: string
          is_locked: boolean | null
          is_todo: boolean | null
          starts_at: string
          title: string
          todo_id: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          ends_at: string
          has_alarm?: boolean | null
          has_reminder?: boolean | null
          id?: string
          is_locked?: boolean | null
          is_todo?: boolean | null
          starts_at: string
          title: string
          todo_id?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          ends_at?: string
          has_alarm?: boolean | null
          has_reminder?: boolean | null
          id?: string
          is_locked?: boolean | null
          is_todo?: boolean | null
          starts_at?: string
          title?: string
          todo_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      calendar_events_old: {
        Row: {
          color: string | null
          created_at: string
          date: string
          description: string
          ends_at: string | null
          has_alarm: boolean | null
          has_reminder: boolean | null
          id: string
          is_locked: boolean | null
          is_todo: boolean | null
          title: string
          todo_id: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          date: string
          description: string
          ends_at?: string | null
          has_alarm?: boolean | null
          has_reminder?: boolean | null
          id?: string
          is_locked?: boolean | null
          is_todo?: boolean | null
          title: string
          todo_id?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          date?: string
          description?: string
          ends_at?: string | null
          has_alarm?: boolean | null
          has_reminder?: boolean | null
          id?: string
          is_locked?: boolean | null
          is_todo?: boolean | null
          title?: string
          todo_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      eisenhower_items: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          module_instance_id: string | null
          quadrant: Database["public"]["Enums"]["eisenhower_quadrant"]
          text: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          module_instance_id?: string | null
          quadrant: Database["public"]["Enums"]["eisenhower_quadrant"]
          text: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          module_instance_id?: string | null
          quadrant?: Database["public"]["Enums"]["eisenhower_quadrant"]
          text?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eisenhower_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          event_id: string | null
          id: string
          role: string | null
          user_id: string | null
        }
        Insert: {
          event_id?: string | null
          id?: string
          role?: string | null
          user_id?: string | null
        }
        Update: {
          event_id?: string | null
          id?: string
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_properties: {
        Row: {
          completed: boolean | null
          estimated_duration: number | null
          event_id: string
          has_alarm: boolean | null
          has_reminder: boolean | null
          is_locked: boolean | null
          is_recurring: boolean | null
          is_todo: boolean | null
          priority: number | null
        }
        Insert: {
          completed?: boolean | null
          estimated_duration?: number | null
          event_id: string
          has_alarm?: boolean | null
          has_reminder?: boolean | null
          is_locked?: boolean | null
          is_recurring?: boolean | null
          is_todo?: boolean | null
          priority?: number | null
        }
        Update: {
          completed?: boolean | null
          estimated_duration?: number | null
          event_id?: string
          has_alarm?: boolean | null
          has_reminder?: boolean | null
          is_locked?: boolean | null
          is_recurring?: boolean | null
          is_todo?: boolean | null
          priority?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_properties_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tags: {
        Row: {
          event_id: string
          tag_id: string
        }
        Insert: {
          event_id: string
          tag_id: string
        }
        Update: {
          event_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tags_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          id: string
          time_end: string | null
          time_start: string | null
          title: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          description?: string | null
          id?: string
          time_end?: string | null
          time_start?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          time_end?: string | null
          time_start?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          invitation_message: string | null
          invitee_email: string | null
          invitee_id: string | null
          inviter_id: string | null
          responded_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          invitation_message?: string | null
          invitee_email?: string | null
          invitee_id?: string | null
          inviter_id?: string | null
          responded_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          invitation_message?: string | null
          invitee_email?: string | null
          invitee_id?: string | null
          inviter_id?: string | null
          responded_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      module_instances: {
        Row: {
          created_at: string
          id: string
          instance_id: string
          module_type: Database["public"]["Enums"]["module_type"]
          settings: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instance_id: string
          module_type: Database["public"]["Enums"]["module_type"]
          settings?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instance_id?: string
          module_type?: Database["public"]["Enums"]["module_type"]
          settings?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pomodoro_sessions: {
        Row: {
          break_duration: number
          completed_at: string | null
          current_interval: number | null
          event_id: string | null
          id: string
          long_break_duration: number
          long_break_interval: number
          module_instance_id: string | null
          paused_at: string | null
          started_at: string | null
          user_id: string | null
          work_duration: number
        }
        Insert: {
          break_duration?: number
          completed_at?: string | null
          current_interval?: number | null
          event_id?: string | null
          id?: string
          long_break_duration?: number
          long_break_interval?: number
          module_instance_id?: string | null
          paused_at?: string | null
          started_at?: string | null
          user_id?: string | null
          work_duration?: number
        }
        Update: {
          break_duration?: number
          completed_at?: string | null
          current_interval?: number | null
          event_id?: string | null
          id?: string
          long_break_duration?: number
          long_break_interval?: number
          module_instance_id?: string | null
          paused_at?: string | null
          started_at?: string | null
          user_id?: string | null
          work_duration?: number
        }
        Relationships: [
          {
            foreignKeyName: "pomodoro_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_patterns: {
        Row: {
          count: number | null
          day_of_month: number | null
          days_of_week: number[] | null
          end_date: string | null
          event_id: string
          frequency: string
          interval: number
          month_of_year: number | null
        }
        Insert: {
          count?: number | null
          day_of_month?: number | null
          days_of_week?: number[] | null
          end_date?: string | null
          event_id: string
          frequency: string
          interval?: number
          month_of_year?: number | null
        }
        Update: {
          count?: number | null
          day_of_month?: number | null
          days_of_week?: number[] | null
          end_date?: string | null
          event_id?: string
          frequency?: string
          interval?: number
          month_of_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_patterns_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          created_at: string
          description: string | null
          event_id: string | null
          id: string
          is_active: boolean | null
          module_instance_id: string | null
          reminder_time: string
          sound_id: string | null
          time_after_event_minutes: number | null
          time_before_event_minutes: number | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id?: string | null
          id?: string
          is_active?: boolean | null
          module_instance_id?: string | null
          reminder_time: string
          sound_id?: string | null
          time_after_event_minutes?: number | null
          time_before_event_minutes?: number | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string | null
          id?: string
          is_active?: boolean | null
          module_instance_id?: string | null
          reminder_time?: string
          sound_id?: string | null
          time_after_event_minutes?: number | null
          time_before_event_minutes?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      todo_items: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          event_id: string | null
          id: string
          module_instance_id: string | null
          order_position: number
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          module_instance_id?: string | null
          order_position: number
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          module_instance_id?: string | null
          order_position?: number
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "todo_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      eisenhower_quadrant:
        | "urgent_important"
        | "not_urgent_important"
        | "urgent_not_important"
        | "not_urgent_not_important"
      event_color:
        | "bg-red-500/70"
        | "bg-green-500/70"
        | "bg-blue-400/70"
        | "bg-purple-500/70"
        | "bg-yellow-500/70"
        | "bg-teal-500/70"
        | "bg-orange-500/70"
        | "bg-pink-500/70"
      module_type: "todo" | "pomodoro" | "alarms" | "eisenhower" | "invites"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      eisenhower_quadrant: [
        "urgent_important",
        "not_urgent_important",
        "urgent_not_important",
        "not_urgent_not_important",
      ],
      event_color: [
        "bg-red-500/70",
        "bg-green-500/70",
        "bg-blue-400/70",
        "bg-purple-500/70",
        "bg-yellow-500/70",
        "bg-teal-500/70",
        "bg-orange-500/70",
        "bg-pink-500/70",
      ],
      module_type: ["todo", "pomodoro", "alarms", "eisenhower", "invites"],
    },
  },
} as const
