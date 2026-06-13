// Auto-generated types — run `supabase gen types typescript` to regenerate

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['locations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['locations']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          org_id: string
          role: 'owner' | 'staff'
          full_name: string
          email: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
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
          subjects: 'math' | 'reading' | 'both'
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['staff_members']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['staff_members']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['students']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['students']['Insert']>
      }
      parent_contacts: {
        Row: {
          id: string
          student_id: string
          org_id: string
          full_name: string
          relationship: 'Mother' | 'Father' | 'Guardian' | 'Other'
          phone: string | null
          email: string | null
          is_primary: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['parent_contacts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['parent_contacts']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['student_checkins']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['student_checkins']['Insert']>
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
        }
        Insert: Omit<Database['public']['Tables']['staff_checkins']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['staff_checkins']['Insert']>
      }
      session_alerts: {
        Row: {
          id: string
          org_id: string
          checkin_id: string
          student_id: string
          assigned_staff_id: string | null
          message: string
          acknowledged_by: string | null
          acknowledged_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['session_alerts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['session_alerts']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['staff_notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['staff_notifications']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['sms_log']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['sms_log']['Insert']>
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
      }
    }
    Functions: {
      checkout_student: {
        Args: { checkin_id: string; session_note?: string }
        Returns: { send_sms: boolean; parent_phone: string | null; student_first_name: string }
      }
      checkout_staff: {
        Args: { checkin_id: string; by_owner?: boolean }
        Returns: { duration_minutes: number }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']
export type Functions<T extends keyof Database['public']['Functions']> = Database['public']['Functions'][T]
