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
      eisenhower_items: {
        Row: {
          event_id: string
          importance: number | null
          quadrant: Database["public"]["Enums"]["eisenhower_quadrant"]
          urgency: number | null
        }
        Insert: {
          event_id: string
          importance?: number | null
          quadrant: Database["public"]["Enums"]["eisenhower_quadrant"]
          urgency?: number | null
        }
        Update: {
          event_id?: string
          importance?: number | null
          quadrant?: Database["public"]["Enums"]["eisenhower_quadrant"]
          urgency?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "eisenhower_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
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
      pomodoro_sessions: {
        Row: {
          break_duration: number
          completed_at: string | null
          current_interval: number | null
          event_id: string | null
          id: string
          long_break_duration: number
          long_break_interval: number
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
          order_position: number
          title: string
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          order_position: number
          title: string
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          order_position?: number
          title?: string
          updated_at?: string | null
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
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
