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
      internment_requests: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          patient_age: number | null
          patient_name: string
          patient_record: string | null
          patient_sex: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          patient_age?: number | null
          patient_name: string
          patient_record?: string | null
          patient_sex?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          patient_age?: number | null
          patient_name?: string
          patient_record?: string | null
          patient_sex?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      patient_movements: {
        Row: {
          created_at: string
          created_by: string | null
          destination: string | null
          id: string
          movement_type: string
          notes: string | null
          patient_bed: string | null
          patient_id: string | null
          patient_name: string
          patient_sector: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          destination?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          patient_bed?: string | null
          patient_id?: string | null
          patient_name: string
          patient_sector?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          destination?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          patient_bed?: string | null
          patient_id?: string | null
          patient_name?: string
          patient_sector?: string | null
        }
        Relationships: []
      }
      patient_versions: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          snapshot_data: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          snapshot_data: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          snapshot_data?: Json
        }
        Relationships: []
      }
      patients: {
        Row: {
          admission_date: string | null
          admission_history: string | null
          age: number | null
          bed_number: string
          created_at: string
          created_by: string | null
          diagnoses: string | null
          id: string
          medical_history: string | null
          name: string
          pendencies: string | null
          relevant_exams: string | null
          schedule: string | null
          sector: string
          updated_at: string
        }
        Insert: {
          admission_date?: string | null
          admission_history?: string | null
          age?: number | null
          bed_number: string
          created_at?: string
          created_by?: string | null
          diagnoses?: string | null
          id?: string
          medical_history?: string | null
          name?: string
          pendencies?: string | null
          relevant_exams?: string | null
          schedule?: string | null
          sector: string
          updated_at?: string
        }
        Update: {
          admission_date?: string | null
          admission_history?: string | null
          age?: number | null
          bed_number?: string
          created_at?: string
          created_by?: string | null
          diagnoses?: string | null
          id?: string
          medical_history?: string | null
          name?: string
          pendencies?: string | null
          relevant_exams?: string | null
          schedule?: string | null
          sector?: string
          updated_at?: string
        }
        Relationships: []
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
          updated_at?: string
          volume_administered?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sepsis_protocols_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_handovers: {
        Row: {
          created_at: string
          created_by: string | null
          handover_datetime: string
          handover_from: string | null
          handover_to: string | null
          id: string
          notes: string | null
          occupied_beds: number
          shift_type: string | null
          snapshot_data: Json
          total_patients: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          handover_datetime?: string
          handover_from?: string | null
          handover_to?: string | null
          id?: string
          notes?: string | null
          occupied_beds?: number
          shift_type?: string | null
          snapshot_data: Json
          total_patients?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          handover_datetime?: string
          handover_from?: string | null
          handover_to?: string | null
          id?: string
          notes?: string | null
          occupied_beds?: number
          shift_type?: string | null
          snapshot_data?: Json
          total_patients?: number
        }
        Relationships: []
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
