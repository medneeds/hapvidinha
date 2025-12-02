export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      dhd_patients: {
        Row: {
          created_at: string
          created_by: string | null
          department: string
          dhd_report: string | null
          diagnosis: string | null
          end_date: string | null
          hospital_unit_id: string
          id: string
          medication_days: Json | null
          medication_schedule: string | null
          patient_age: string | null
          patient_name: string
          start_date: string
          state_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department?: string
          dhd_report?: string | null
          diagnosis?: string | null
          end_date?: string | null
          hospital_unit_id: string
          id?: string
          medication_days?: Json | null
          medication_schedule?: string | null
          patient_age?: string | null
          patient_name: string
          start_date: string
          state_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string
          dhd_report?: string | null
          diagnosis?: string | null
          end_date?: string | null
          hospital_unit_id?: string
          id?: string
          medication_days?: Json | null
          medication_schedule?: string | null
          patient_age?: string | null
          patient_name?: string
          start_date?: string
          state_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dhd_patients_hospital_unit_id_fkey"
            columns: ["hospital_unit_id"]
            isOneToOne: false
            referencedRelation: "hospital_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dhd_patients_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_units: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          state_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          state_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          state_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospital_units_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      internment_requests: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          department: string
          destination: string
          hospital_unit_id: string
          id: string
          patient_age: number | null
          patient_name: string
          patient_record: string | null
          patient_sex: string | null
          state_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          department?: string
          destination: string
          hospital_unit_id: string
          id?: string
          patient_age?: number | null
          patient_name: string
          patient_record?: string | null
          patient_sex?: string | null
          state_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          department?: string
          destination?: string
          hospital_unit_id?: string
          id?: string
          patient_age?: number | null
          patient_name?: string
          patient_record?: string | null
          patient_sex?: string | null
          state_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internment_requests_hospital_unit_id_fkey"
            columns: ["hospital_unit_id"]
            isOneToOne: false
            referencedRelation: "hospital_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internment_requests_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_codes: {
        Row: {
          category: string
          code: string
          created_at: string
          id: string
          name: string
          system_description: string
          updated_at: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          id?: string
          name: string
          system_description: string
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          id?: string
          name?: string
          system_description?: string
          updated_at?: string
        }
        Relationships: []
      }
      notes_reminders: {
        Row: {
          completed: boolean | null
          content: string
          created_at: string
          created_by: string | null
          department: string
          hospital_unit_id: string
          id: string
          is_active: boolean | null
          read: boolean | null
          scheduled_popup_time: string | null
          state_id: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          content: string
          created_at?: string
          created_by?: string | null
          department?: string
          hospital_unit_id: string
          id?: string
          is_active?: boolean | null
          read?: boolean | null
          scheduled_popup_time?: string | null
          state_id: string
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          content?: string
          created_at?: string
          created_by?: string | null
          department?: string
          hospital_unit_id?: string
          id?: string
          is_active?: boolean | null
          read?: boolean | null
          scheduled_popup_time?: string | null
          state_id?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_reminders_hospital_unit_id_fkey"
            columns: ["hospital_unit_id"]
            isOneToOne: false
            referencedRelation: "hospital_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_reminders_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_movements: {
        Row: {
          created_at: string
          created_by: string | null
          department: string
          destination: string | null
          hospital_unit_id: string
          id: string
          movement_type: string
          notes: string | null
          patient_bed: string | null
          patient_id: string | null
          patient_name: string
          patient_sector: string | null
          patient_snapshot: Json | null
          responsible_doctor: string | null
          state_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department?: string
          destination?: string | null
          hospital_unit_id: string
          id?: string
          movement_type: string
          notes?: string | null
          patient_bed?: string | null
          patient_id?: string | null
          patient_name: string
          patient_sector?: string | null
          patient_snapshot?: Json | null
          responsible_doctor?: string | null
          state_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string
          destination?: string | null
          hospital_unit_id?: string
          id?: string
          movement_type?: string
          notes?: string | null
          patient_bed?: string | null
          patient_id?: string | null
          patient_name?: string
          patient_sector?: string | null
          patient_snapshot?: Json | null
          responsible_doctor?: string | null
          state_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_movements_hospital_unit_id_fkey"
            columns: ["hospital_unit_id"]
            isOneToOne: false
            referencedRelation: "hospital_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_movements_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_versions: {
        Row: {
          created_at: string
          created_by: string | null
          department: string
          description: string
          hospital_unit_id: string
          id: string
          snapshot_data: Json
          state_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department?: string
          description: string
          hospital_unit_id: string
          id?: string
          snapshot_data: Json
          state_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string
          description?: string
          hospital_unit_id?: string
          id?: string
          snapshot_data?: Json
          state_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_versions_hospital_unit_id_fkey"
            columns: ["hospital_unit_id"]
            isOneToOne: false
            referencedRelation: "hospital_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_versions_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          admission_date: string | null
          admission_history: string | null
          age: string | null
          bed_number: string
          created_at: string
          created_by: string | null
          department: string
          diagnoses: string | null
          display_order: number | null
          highlighted_pendencies: number[] | null
          hospital_unit_id: string
          id: string
          internment_notes: string | null
          internment_status: string | null
          medical_history: string | null
          medical_responsibility: Json | null
          name: string
          pendencies: string | null
          relevant_exams: string | null
          schedule: string | null
          sector: string
          state_id: string
          updated_at: string
          uti_admission_date: string | null
          uti_admission_reason: string | null
          uti_allergies: string | null
          uti_cultures_antibiotics: string | null
          uti_current_status: string | null
          uti_devices: string | null
          uti_discharge_prediction: string | null
          uti_origin_sector: string | null
          uti_specialties: string | null
        }
        Insert: {
          admission_date?: string | null
          admission_history?: string | null
          age?: string | null
          bed_number: string
          created_at?: string
          created_by?: string | null
          department?: string
          diagnoses?: string | null
          display_order?: number | null
          highlighted_pendencies?: number[] | null
          hospital_unit_id: string
          id?: string
          internment_notes?: string | null
          internment_status?: string | null
          medical_history?: string | null
          medical_responsibility?: Json | null
          name?: string
          pendencies?: string | null
          relevant_exams?: string | null
          schedule?: string | null
          sector: string
          state_id: string
          updated_at?: string
          uti_admission_date?: string | null
          uti_admission_reason?: string | null
          uti_allergies?: string | null
          uti_cultures_antibiotics?: string | null
          uti_current_status?: string | null
          uti_devices?: string | null
          uti_discharge_prediction?: string | null
          uti_origin_sector?: string | null
          uti_specialties?: string | null
        }
        Update: {
          admission_date?: string | null
          admission_history?: string | null
          age?: string | null
          bed_number?: string
          created_at?: string
          created_by?: string | null
          department?: string
          diagnoses?: string | null
          display_order?: number | null
          highlighted_pendencies?: number[] | null
          hospital_unit_id?: string
          id?: string
          internment_notes?: string | null
          internment_status?: string | null
          medical_history?: string | null
          medical_responsibility?: Json | null
          name?: string
          pendencies?: string | null
          relevant_exams?: string | null
          schedule?: string | null
          sector?: string
          state_id?: string
          updated_at?: string
          uti_admission_date?: string | null
          uti_admission_reason?: string | null
          uti_allergies?: string | null
          uti_cultures_antibiotics?: string | null
          uti_current_status?: string | null
          uti_devices?: string | null
          uti_discharge_prediction?: string | null
          uti_origin_sector?: string | null
          uti_specialties?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_hospital_unit_id_fkey"
            columns: ["hospital_unit_id"]
            isOneToOne: false
            referencedRelation: "hospital_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sepsis_protocols: {
        Row: {
          antibiotic_prescription_date: string | null
          antibiotic_prescription_time: string | null
          attendance_number: string | null
          birth_date: string | null
          blood_culture_date: string | null
          blood_culture_time: string | null
          created_at: string
          created_by: string | null
          destination: string | null
          destination_date: string | null
          destination_time: string | null
          dysfunction_acidosis: boolean | null
          dysfunction_bilirubin: boolean | null
          dysfunction_consciousness: boolean | null
          dysfunction_excluded_date: string | null
          dysfunction_hypotension: boolean | null
          dysfunction_oliguria: boolean | null
          dysfunction_pao2: boolean | null
          dysfunction_platelets: boolean | null
          focus_abdominal: boolean | null
          focus_neurological: boolean | null
          focus_other: string | null
          focus_pulmonary: boolean | null
          focus_skin: boolean | null
          focus_urinary: boolean | null
          has_infection: boolean | null
          has_organic_dysfunction: boolean | null
          hospital: string | null
          hospital_unit_id: string
          id: string
          infection_excluded_date: string | null
          lactate_date: string | null
          lactate_time: string | null
          notes: string | null
          opening_date: string | null
          opening_time: string | null
          outcome: string | null
          outcome_date: string | null
          outcome_time: string | null
          patient_id: string | null
          patient_name: string
          patient_weight: number | null
          responsible_name: string | null
          sirs_heart_rate: boolean | null
          sirs_leukocytosis: boolean | null
          sirs_leukopenia: boolean | null
          sirs_respiratory_rate: boolean | null
          sirs_temp_high: boolean | null
          sirs_temp_low: boolean | null
          sirs_young_cells: boolean | null
          state_id: string
          updated_at: string
          volume_administered: number | null
        }
        Insert: {
          antibiotic_prescription_date?: string | null
          antibiotic_prescription_time?: string | null
          attendance_number?: string | null
          birth_date?: string | null
          blood_culture_date?: string | null
          blood_culture_time?: string | null
          created_at?: string
          created_by?: string | null
          destination?: string | null
          destination_date?: string | null
          destination_time?: string | null
          dysfunction_acidosis?: boolean | null
          dysfunction_bilirubin?: boolean | null
          dysfunction_consciousness?: boolean | null
          dysfunction_excluded_date?: string | null
          dysfunction_hypotension?: boolean | null
          dysfunction_oliguria?: boolean | null
          dysfunction_pao2?: boolean | null
          dysfunction_platelets?: boolean | null
          focus_abdominal?: boolean | null
          focus_neurological?: boolean | null
          focus_other?: string | null
          focus_pulmonary?: boolean | null
          focus_skin?: boolean | null
          focus_urinary?: boolean | null
          has_infection?: boolean | null
          has_organic_dysfunction?: boolean | null
          hospital?: string | null
          hospital_unit_id: string
          id?: string
          infection_excluded_date?: string | null
          lactate_date?: string | null
          lactate_time?: string | null
          notes?: string | null
          opening_date?: string | null
          opening_time?: string | null
          outcome?: string | null
          outcome_date?: string | null
          outcome_time?: string | null
          patient_id?: string | null
          patient_name: string
          patient_weight?: number | null
          responsible_name?: string | null
          sirs_heart_rate?: boolean | null
          sirs_leukocytosis?: boolean | null
          sirs_leukopenia?: boolean | null
          sirs_respiratory_rate?: boolean | null
          sirs_temp_high?: boolean | null
          sirs_temp_low?: boolean | null
          sirs_young_cells?: boolean | null
          state_id: string
          updated_at?: string
          volume_administered?: number | null
        }
        Update: {
          antibiotic_prescription_date?: string | null
          antibiotic_prescription_time?: string | null
          attendance_number?: string | null
          birth_date?: string | null
          blood_culture_date?: string | null
          blood_culture_time?: string | null
          created_at?: string
          created_by?: string | null
          destination?: string | null
          destination_date?: string | null
          destination_time?: string | null
          dysfunction_acidosis?: boolean | null
          dysfunction_bilirubin?: boolean | null
          dysfunction_consciousness?: boolean | null
          dysfunction_excluded_date?: string | null
          dysfunction_hypotension?: boolean | null
          dysfunction_oliguria?: boolean | null
          dysfunction_pao2?: boolean | null
          dysfunction_platelets?: boolean | null
          focus_abdominal?: boolean | null
          focus_neurological?: boolean | null
          focus_other?: string | null
          focus_pulmonary?: boolean | null
          focus_skin?: boolean | null
          focus_urinary?: boolean | null
          has_infection?: boolean | null
          has_organic_dysfunction?: boolean | null
          hospital?: string | null
          hospital_unit_id?: string
          id?: string
          infection_excluded_date?: string | null
          lactate_date?: string | null
          lactate_time?: string | null
          notes?: string | null
          opening_date?: string | null
          opening_time?: string | null
          outcome?: string | null
          outcome_date?: string | null
          outcome_time?: string | null
          patient_id?: string | null
          patient_name?: string
          patient_weight?: number | null
          responsible_name?: string | null
          sirs_heart_rate?: boolean | null
          sirs_leukocytosis?: boolean | null
          sirs_leukopenia?: boolean | null
          sirs_respiratory_rate?: boolean | null
          sirs_temp_high?: boolean | null
          sirs_temp_low?: boolean | null
          sirs_young_cells?: boolean | null
          state_id?: string
          updated_at?: string
          volume_administered?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sepsis_protocols_hospital_unit_id_fkey"
            columns: ["hospital_unit_id"]
            isOneToOne: false
            referencedRelation: "hospital_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sepsis_protocols_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sepsis_protocols_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_handovers: {
        Row: {
          created_at: string
          created_by: string | null
          department: string
          handover_datetime: string
          handover_from: string | null
          handover_to: string | null
          hospital_unit_id: string
          id: string
          notes: string | null
          occupied_beds: number
          shift_type: string | null
          snapshot_data: Json
          state_id: string
          total_patients: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department?: string
          handover_datetime?: string
          handover_from?: string | null
          handover_to?: string | null
          hospital_unit_id: string
          id?: string
          notes?: string | null
          occupied_beds?: number
          shift_type?: string | null
          snapshot_data: Json
          state_id: string
          total_patients?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string
          handover_datetime?: string
          handover_from?: string | null
          handover_to?: string | null
          hospital_unit_id?: string
          id?: string
          notes?: string | null
          occupied_beds?: number
          shift_type?: string | null
          snapshot_data?: Json
          state_id?: string
          total_patients?: number
        }
        Relationships: [
          {
            foreignKeyName: "shift_handovers_hospital_unit_id_fkey"
            columns: ["hospital_unit_id"]
            isOneToOne: false
            referencedRelation: "hospital_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_handovers_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      states: {
        Row: {
          abbreviation: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          abbreviation: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          abbreviation?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_departments: {
        Row: {
          created_at: string
          department: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_hospital_assignments: {
        Row: {
          created_at: string
          hospital_unit_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hospital_unit_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hospital_unit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_hospital_assignments_hospital_unit_id_fkey"
            columns: ["hospital_unit_id"]
            isOneToOne: false
            referencedRelation: "hospital_units"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "medico"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "medico"],
    },
  },
} as const
