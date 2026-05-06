
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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      custom_exercises: {
        Row: {
          created_at: string
          exercise_type_id: string
          id: string
          name: string
          other_muscles: string[] | null
          primary_muscle: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_type_id: string
          id?: string
          name: string
          other_muscles?: string[] | null
          primary_muscle?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_type_id?: string
          id?: string
          name?: string
          other_muscles?: string[] | null
          primary_muscle?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_exercises_exercise_type_id_fkey"
            columns: ["exercise_type_id"]
            isOneToOne: false
            referencedRelation: "exercise_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_exercises_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_sets: {
        Row: {
          created_at: string
          distance: number | null
          duration: string | null
          id: number
          notes: string | null
          reps: number | null
          set_number: number
          user_id: string | null
          weight: number | null
          workout_exercise_id: number | null
        }
        Insert: {
          created_at?: string
          distance?: number | null
          duration?: string | null
          id?: number
          notes?: string | null
          reps?: number | null
          set_number: number
          user_id?: string | null
          weight?: number | null
          workout_exercise_id?: number | null
        }
        Update: {
          created_at?: string
          distance?: number | null
          duration?: string | null
          id?: number
          notes?: string | null
          reps?: number | null
          set_number?: number
          user_id?: string | null
          weight?: number | null
          workout_exercise_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_sets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_sets_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_types: {
        Row: {
          created_at: string
          has_distance: boolean
          has_duration: boolean
          has_reps: boolean
          has_weight: boolean
          id: string
          is_assisted: boolean
          is_bodyweight: boolean
          key: string
          label: string
        }
        Insert: {
          created_at?: string
          has_distance?: boolean
          has_duration?: boolean
          has_reps?: boolean
          has_weight?: boolean
          id?: string
          is_assisted?: boolean
          is_bodyweight?: boolean
          key: string
          label: string
        }
        Update: {
          created_at?: string
          has_distance?: boolean
          has_duration?: boolean
          has_reps?: boolean
          has_weight?: boolean
          id?: string
          is_assisted?: boolean
          is_bodyweight?: boolean
          key?: string
          label?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      public_exercises: {
        Row: {
          created_at: string
          exercise_type_id: string
          id: string
          name: string
          other_muscles: string[] | null
          primary_muscle: string | null
        }
        Insert: {
          created_at?: string
          exercise_type_id: string
          id?: string
          name: string
          other_muscles?: string[] | null
          primary_muscle?: string | null
        }
        Update: {
          created_at?: string
          exercise_type_id?: string
          id?: string
          name?: string
          other_muscles?: string[] | null
          primary_muscle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_exercises_exercise_type_id_fkey"
            columns: ["exercise_type_id"]
            isOneToOne: false
            referencedRelation: "exercise_types"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_exercises: {
        Row: {
          created_at: string
          custom_exercise_id: string | null
          equipment_brand: string | null
          id: number
          notes: string | null
          order_index: number
          public_exercise_id: string | null
          routine_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          custom_exercise_id?: string | null
          equipment_brand?: string | null
          id?: number
          notes?: string | null
          order_index?: number
          public_exercise_id?: string | null
          routine_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          custom_exercise_id?: string | null
          equipment_brand?: string | null
          id?: number
          notes?: string | null
          order_index?: number
          public_exercise_id?: string | null
          routine_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_exercises_custom_exercise_id_fkey"
            columns: ["custom_exercise_id"]
            isOneToOne: false
            referencedRelation: "custom_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_exercises_public_exercise_id_fkey"
            columns: ["public_exercise_id"]
            isOneToOne: false
            referencedRelation: "public_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_exercises_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_exercises_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_sets: {
        Row: {
          created_at: string
          distance: number | null
          duration: string | null
          id: number
          notes: string | null
          reps: number | null
          routine_exercise_id: number | null
          set_number: number
          user_id: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string
          distance?: number | null
          duration?: string | null
          id?: number
          notes?: string | null
          reps?: number | null
          routine_exercise_id?: number | null
          set_number: number
          user_id?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string
          distance?: number | null
          duration?: string | null
          id?: number
          notes?: string | null
          reps?: number | null
          routine_exercise_id?: number | null
          set_number?: number
          user_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_sets_routine_exercise_id_fkey"
            columns: ["routine_exercise_id"]
            isOneToOne: false
            referencedRelation: "routine_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_sets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          created_at: string
          date: string
          ended_at: string | null
          id: string
          name: string | null
          notes: string | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          ended_at?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          ended_at?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          created_at: string
          custom_exercise_id: string | null
          equipment_brand: string | null
          id: number
          notes: string | null
          order_index: number
          public_exercise_id: string | null
          user_id: string | null
          workout_id: string | null
        }
        Insert: {
          created_at?: string
          custom_exercise_id?: string | null
          equipment_brand?: string | null
          id?: number
          notes?: string | null
          order_index?: number
          public_exercise_id?: string | null
          user_id?: string | null
          workout_id?: string | null
        }
        Update: {
          created_at?: string
          custom_exercise_id?: string | null
          equipment_brand?: string | null
          id?: number
          notes?: string | null
          order_index?: number
          public_exercise_id?: string | null
          user_id?: string | null
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_custom_exercise_id_fkey"
            columns: ["custom_exercise_id"]
            isOneToOne: false
            referencedRelation: "custom_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_public_exercise_id_fkey"
            columns: ["public_exercise_id"]
            isOneToOne: false
            referencedRelation: "public_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          date: string
          id: string
          name: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          name?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          name?: string | null
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      available_exercises: {
        Row: {
          created_at: string | null
          exercise_type_id: string | null
          exercise_type_key: string | null
          exercise_type_label: string | null
          has_distance: boolean | null
          has_duration: boolean | null
          has_reps: boolean | null
          has_weight: boolean | null
          id: string | null
          is_assisted: boolean | null
          is_bodyweight: boolean | null
          name: string | null
          other_muscles: string[] | null
          primary_muscle: string | null
          source: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
