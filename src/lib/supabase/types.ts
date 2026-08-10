// Auto-generated types — run `supabase gen types typescript` to regenerate

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      org_invite_keys: {
        Row: {
          id: string
          org_id: string
          created_by: string
          key_value: string
          expires_at: string
          use_count: number
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          created_by: string
          key_value: string
          expires_at?: string
          use_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          created_by?: string
          key_value?: string
          expires_at?: string
          use_count?: number
          created_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          id: string
          org_id: string
          name: string
          address_street: string
          address_city: string
          address_state: string
          address_zip: string
          phone: string | null
          notes: string | null
          opens_at: string
          closes_at: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          address_street: string
          address_city: string
          address_state: string
          address_zip: string
          phone?: string | null
          notes?: string | null
          opens_at: string
          closes_at: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          address_street?: string
          address_city?: string
          address_state?: string
          address_zip?: string
          phone?: string | null
          notes?: string | null
          opens_at?: string
          closes_at?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          org_id: string
          role: 'owner' | 'staff'
          full_name: string
          email: string
          username: string | null
          created_at: string
        }
        Insert: {
          id: string
          org_id: string
          role: 'owner' | 'staff'
          full_name: string
          email: string
          username?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          role?: 'owner' | 'staff'
          full_name?: string
          email?: string
          username?: string | null
          created_at?: string
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          id: string
          org_id: string
          profile_id: string | null
          first_name: string
          last_name: string
          dob: string | null
          phone: string | null
          email: string | null
          role_title: string | null
          location_id: string
          location_ids: string[] | null
          subjects: 'math' | 'reading' | 'both'
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          profile_id?: string | null
          first_name: string
          last_name: string
          dob?: string | null
          phone?: string | null
          email?: string | null
          role_title?: string | null
          location_id: string
          location_ids?: string[] | null
          subjects: 'math' | 'reading' | 'both'
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          profile_id?: string | null
          first_name?: string
          last_name?: string
          dob?: string | null
          phone?: string | null
          email?: string | null
          role_title?: string | null
          location_id?: string
          location_ids?: string[] | null
          subjects?: 'math' | 'reading' | 'both'
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          id: string
          org_id: string
          first_name: string
          last_name: string
          dob: string | null
          subjects: 'math' | 'reading' | 'both'
          location_id: string
          notes: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          first_name: string
          last_name: string
          dob?: string | null
          subjects: 'math' | 'reading' | 'both'
          location_id: string
          notes?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          first_name?: string
          last_name?: string
          dob?: string | null
          subjects?: 'math' | 'reading' | 'both'
          location_id?: string
          notes?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      parent_contacts: {
        Row: {
          id: string
          student_id: string
          org_id: string
          full_name: string | null
          relationship: 'Mother' | 'Father' | 'Guardian' | 'Other'
          phone: string | null
          email: string | null
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          org_id: string
          full_name?: string | null
          relationship: 'Mother' | 'Father' | 'Guardian' | 'Other'
          phone?: string | null
          email?: string | null
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          org_id?: string
          full_name?: string | null
          relationship?: 'Mother' | 'Father' | 'Guardian' | 'Other'
          phone?: string | null
          email?: string | null
          is_primary?: boolean
          created_at?: string
        }
        Relationships: []
      }
      student_checkins: {
        Row: {
          id: string
          org_id: string
          student_id: string
          location_id: string
          checked_in_at: string
          checked_out_at: string | null
          subjects_snapshot: 'math' | 'reading' | 'both'
          time_limit_minutes: number
          checkin_method: 'kiosk' | 'staff'
          assigned_staff_id: string | null
          checked_in_by_staff_id: string | null
          checked_out_by_staff_id: string | null
          sms_sent: boolean
          session_note: string | null
          duration_minutes: number | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          student_id: string
          location_id: string
          checked_in_at?: string
          checked_out_at?: string | null
          subjects_snapshot: 'math' | 'reading' | 'both'
          time_limit_minutes: number
          checkin_method: 'kiosk' | 'staff'
          assigned_staff_id?: string | null
          checked_in_by_staff_id?: string | null
          checked_out_by_staff_id?: string | null
          sms_sent?: boolean
          session_note?: string | null
          duration_minutes?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          student_id?: string
          location_id?: string
          checked_in_at?: string
          checked_out_at?: string | null
          subjects_snapshot?: 'math' | 'reading' | 'both'
          time_limit_minutes?: number
          checkin_method?: 'kiosk' | 'staff'
          assigned_staff_id?: string | null
          checked_in_by_staff_id?: string | null
          checked_out_by_staff_id?: string | null
          sms_sent?: boolean
          session_note?: string | null
          duration_minutes?: number | null
          created_at?: string
        }
        Relationships: []
      }
      staff_checkins: {
        Row: {
          id: string
          org_id: string
          staff_id: string
          location_id: string
          checked_in_at: string
          checked_out_at: string | null
          duration_minutes: number | null
          checked_out_by_owner: boolean
          created_at: string
          edited_at: string | null
          edited_by: string | null
        }
        Insert: {
          id?: string
          org_id: string
          staff_id: string
          location_id: string
          checked_in_at?: string
          checked_out_at?: string | null
          duration_minutes?: number | null
          checked_out_by_owner?: boolean
          created_at?: string
          edited_at?: string | null
          edited_by?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          staff_id?: string
          location_id?: string
          checked_in_at?: string
          checked_out_at?: string | null
          duration_minutes?: number | null
          checked_out_by_owner?: boolean
          created_at?: string
          edited_at?: string | null
          edited_by?: string | null
        }
        Relationships: []
      }
      session_alerts: {
        Row: {
          id: string
          org_id: string
          checkin_id: string
          student_id: string
          assigned_staff_id: string | null
          message: string
          level: 'yellow' | 'red'
          acknowledged_by: string | null
          acknowledged_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          checkin_id: string
          student_id: string
          assigned_staff_id?: string | null
          message: string
          level?: 'yellow' | 'red'
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          checkin_id?: string
          student_id?: string
          assigned_staff_id?: string | null
          message?: string
          level?: 'yellow' | 'red'
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      staff_notifications: {
        Row: {
          id: string
          org_id: string
          staff_id: string
          location_id: string
          type: 'clock_in' | 'clock_out'
          timestamp: string
          dismissed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          staff_id: string
          location_id: string
          type: 'clock_in' | 'clock_out'
          timestamp?: string
          dismissed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          staff_id?: string
          location_id?: string
          type?: 'clock_in' | 'clock_out'
          timestamp?: string
          dismissed?: boolean
          created_at?: string
        }
        Relationships: []
      }
      sms_log: {
        Row: {
          id: string
          org_id: string
          checkin_id: string
          to_phone: string
          message: string
          twilio_sid: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          checkin_id: string
          to_phone: string
          message: string
          twilio_sid?: string | null
          status: string
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          checkin_id?: string
          to_phone?: string
          message?: string
          twilio_sid?: string | null
          status?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_students: {
        Row: {
          id: string
          org_id: string
          student_id: string
          student_first_name: string
          student_last_name: string
          location_id: string
          checked_in_at: string
          subjects_snapshot: 'math' | 'reading' | 'both'
          time_limit_minutes: number
          checkin_method: 'kiosk' | 'staff'
          assigned_staff_id: string | null
          assigned_staff_name: string | null
          elapsed_minutes: number
          timer_status: 'green' | 'yellow' | 'red'
        }
        Relationships: []
      }
      active_staff: {
        Row: {
          id: string
          org_id: string
          staff_id: string
          staff_first_name: string
          staff_last_name: string
          location_id: string
          checked_in_at: string
          elapsed_minutes: number
        }
        Relationships: []
      }
      visit_history: {
        Row: {
          id: string
          org_id: string
          student_id: string
          student_first_name: string
          student_last_name: string
          location_id: string
          checked_in_at: string
          checked_out_at: string
          duration_minutes: number
          subjects_snapshot: 'math' | 'reading' | 'both'
          checkin_method: 'kiosk' | 'staff'
          checked_in_by_name: string | null
          session_note: string | null
          sms_sent: boolean
        }
        Relationships: []
      }
    }
    Functions: {
      checkout_student: {
        Args: {
          checkin_id: string
          session_note?: string
        }
        Returns: {
          send_sms: boolean
          parent_phone: string | null
          student_first_name: string
        }
      }
      checkout_staff: {
        Args: {
          checkin_id: string
          by_owner?: boolean
        }
        Returns: {
          duration_minutes: number
        }
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']
export type Functions<T extends keyof Database['public']['Functions']> = Database['public']['Functions'][T]
