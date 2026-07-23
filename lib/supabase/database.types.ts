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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      artist_aliases: {
        Row: {
          alias_name: string
          artist_id: number
          created_at: string
          id: number
          normalized_alias: string
        }
        Insert: {
          alias_name: string
          artist_id: number
          created_at?: string
          id?: number
          normalized_alias: string
        }
        Update: {
          alias_name?: string
          artist_id?: number
          created_at?: string
          id?: number
          normalized_alias?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_aliases_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          artist_type: string | null
          created_at: string | null
          genre: string | null
          id: number
          image_url: string | null
          name: string
          normalized_name: string
        }
        Insert: {
          artist_type?: string | null
          created_at?: string | null
          genre?: string | null
          id?: number
          image_url?: string | null
          name: string
          normalized_name: string
        }
        Update: {
          artist_type?: string | null
          created_at?: string | null
          genre?: string | null
          id?: number
          image_url?: string | null
          name?: string
          normalized_name?: string
        }
        Relationships: []
      }
      audit_changes: {
        Row: {
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_label: string
          entity_type: string
          event_id: number
          id: number
          operation: string
        }
        Insert: {
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_label: string
          entity_type: string
          event_id: number
          id?: number
          operation: string
        }
        Update: {
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_label?: string
          entity_type?: string
          event_id?: number
          id?: number
          operation?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_changes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "audit_events"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action_type: string
          actor_id: string | null
          actor_name: string
          announcement_date: string | null
          audit_summary: Json | null
          baseline_key: string | null
          created_at: string
          festival_id: number | null
          festival_name: string | null
          id: number
          lineup_round: string | null
          note: string | null
          reason: string | null
          source_file_name: string | null
          source_type: string | null
          source_url: string | null
          target_id: string | null
          target_label: string | null
          target_type: string | null
          transaction_id: number
          work_type: string | null
        }
        Insert: {
          action_type: string
          actor_id?: string | null
          actor_name: string
          announcement_date?: string | null
          audit_summary?: Json | null
          baseline_key?: string | null
          created_at?: string
          festival_id?: number | null
          festival_name?: string | null
          id?: number
          lineup_round?: string | null
          note?: string | null
          reason?: string | null
          source_file_name?: string | null
          source_type?: string | null
          source_url?: string | null
          target_id?: string | null
          target_label?: string | null
          target_type?: string | null
          transaction_id?: number
          work_type?: string | null
        }
        Update: {
          action_type?: string
          actor_id?: string | null
          actor_name?: string
          announcement_date?: string | null
          audit_summary?: Json | null
          baseline_key?: string | null
          created_at?: string
          festival_id?: number | null
          festival_name?: string | null
          id?: number
          lineup_round?: string | null
          note?: string | null
          reason?: string | null
          source_file_name?: string | null
          source_type?: string | null
          source_url?: string | null
          target_id?: string | null
          target_label?: string | null
          target_type?: string | null
          transaction_id?: number
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_festival_id_fkey"
            columns: ["festival_id"]
            isOneToOne: false
            referencedRelation: "festivals"
            referencedColumns: ["id"]
          },
        ]
      }
      festival_artists: {
        Row: {
          artist_id: number
          created_at: string | null
          festival_id: number
          id: number
          input_name: string | null
          performance_date: string | null
          performance_end_time: string | null
          performance_time: string | null
          source_url: string | null
          stage_name: string | null
          status: string | null
        }
        Insert: {
          artist_id: number
          created_at?: string | null
          festival_id: number
          id?: number
          input_name?: string | null
          performance_date?: string | null
          performance_end_time?: string | null
          performance_time?: string | null
          source_url?: string | null
          stage_name?: string | null
          status?: string | null
        }
        Update: {
          artist_id?: number
          created_at?: string | null
          festival_id?: number
          id?: number
          input_name?: string | null
          performance_date?: string | null
          performance_end_time?: string | null
          performance_time?: string | null
          source_url?: string | null
          stage_name?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "festival_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "festival_artists_festival_id_fkey"
            columns: ["festival_id"]
            isOneToOne: false
            referencedRelation: "festivals"
            referencedColumns: ["id"]
          },
        ]
      }
      festival_candidates: {
        Row: {
          announcement_round: string
          category: string | null
          comparison_json: Json
          created_at: string | null
          created_by: string | null
          draft_json: Json | null
          end_date: string | null
          festival_id: number | null
          festival_name: string | null
          id: number
          location: string | null
          parent_candidate_id: number | null
          raw_text: string | null
          reject_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          score: number | null
          source_assets: Json
          source_type: string | null
          source_url: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string | null
          version_number: number
          work_type: string
        }
        Insert: {
          announcement_round?: string
          category?: string | null
          comparison_json?: Json
          created_at?: string | null
          created_by?: string | null
          draft_json?: Json | null
          end_date?: string | null
          festival_id?: number | null
          festival_name?: string | null
          id?: number
          location?: string | null
          parent_candidate_id?: number | null
          raw_text?: string | null
          reject_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number | null
          source_assets?: Json
          source_type?: string | null
          source_url?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string | null
          version_number?: number
          work_type?: string
        }
        Update: {
          announcement_round?: string
          category?: string | null
          comparison_json?: Json
          created_at?: string | null
          created_by?: string | null
          draft_json?: Json | null
          end_date?: string | null
          festival_id?: number | null
          festival_name?: string | null
          id?: number
          location?: string | null
          parent_candidate_id?: number | null
          raw_text?: string | null
          reject_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number | null
          source_assets?: Json
          source_type?: string | null
          source_url?: string | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          version_number?: number
          work_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "festival_candidates_festival_id_fkey"
            columns: ["festival_id"]
            isOneToOne: false
            referencedRelation: "festivals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "festival_candidates_parent_candidate_id_fkey"
            columns: ["parent_candidate_id"]
            isOneToOne: false
            referencedRelation: "festival_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      festival_ticket_rounds: {
        Row: {
          created_at: string
          festival_id: number
          id: number
          open_at: string | null
          price_info: string | null
          round_name: string
          round_type: string | null
          ticket_platform: string | null
          ticket_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          festival_id: number
          id?: number
          open_at?: string | null
          price_info?: string | null
          round_name: string
          round_type?: string | null
          ticket_platform?: string | null
          ticket_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          festival_id?: number
          id?: number
          open_at?: string | null
          price_info?: string | null
          round_name?: string
          round_type?: string | null
          ticket_platform?: string | null
          ticket_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "festival_ticket_rounds_festival_id_fkey"
            columns: ["festival_id"]
            isOneToOne: false
            referencedRelation: "festivals"
            referencedColumns: ["id"]
          },
        ]
      }
      festival_update_drafts: {
        Row: {
          announcement_round: string
          applied_at: string | null
          base_data_hash: string | null
          base_festival_updated_at: string | null
          comparison_json: Json
          created_at: string
          created_by: string | null
          draft_json: Json
          festival_id: number
          id: number
          selection_json: Json
          source_type: string
          source_url: string
          status: string
          version_number: number
          workflow_json: Json
        }
        Insert: {
          announcement_round?: string
          applied_at?: string | null
          base_data_hash?: string | null
          base_festival_updated_at?: string | null
          comparison_json?: Json
          created_at?: string
          created_by?: string | null
          draft_json: Json
          festival_id: number
          id?: number
          selection_json?: Json
          source_type?: string
          source_url: string
          status?: string
          version_number?: number
          workflow_json?: Json
        }
        Update: {
          announcement_round?: string
          applied_at?: string | null
          base_data_hash?: string | null
          base_festival_updated_at?: string | null
          comparison_json?: Json
          created_at?: string
          created_by?: string | null
          draft_json?: Json
          festival_id?: number
          id?: number
          selection_json?: Json
          source_type?: string
          source_url?: string
          status?: string
          version_number?: number
          workflow_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "festival_update_drafts_festival_id_fkey"
            columns: ["festival_id"]
            isOneToOne: false
            referencedRelation: "festivals"
            referencedColumns: ["id"]
          },
        ]
      }
      festivals: {
        Row: {
          address: string | null
          category: string | null
          confidence_score: number | null
          created_at: string | null
          description: string | null
          end_date: string
          id: number
          location: string | null
          name: string
          normalized_name: string
          official_url: string | null
          price_info: string | null
          price_type: string | null
          program_info: string | null
          region: string | null
          search_aliases: string | null
          slug: string | null
          source_url: string | null
          start_date: string
          status: string | null
          thumbnail_url: string | null
          timetable_status: string
          updated_at: string | null
          verification_status: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: number
          location?: string | null
          name: string
          normalized_name: string
          official_url?: string | null
          price_info?: string | null
          price_type?: string | null
          program_info?: string | null
          region?: string | null
          search_aliases?: string | null
          slug?: string | null
          source_url?: string | null
          start_date: string
          status?: string | null
          thumbnail_url?: string | null
          timetable_status?: string
          updated_at?: string | null
          verification_status?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: number
          location?: string | null
          name?: string
          normalized_name?: string
          official_url?: string | null
          price_info?: string | null
          price_type?: string | null
          program_info?: string | null
          region?: string | null
          search_aliases?: string | null
          slug?: string | null
          source_url?: string | null
          start_date?: string
          status?: string | null
          thumbnail_url?: string | null
          timetable_status?: string
          updated_at?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
      pipeline_runs: {
        Row: {
          articles_added: number | null
          finished_at: string | null
          id: number
          notes: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          articles_added?: number | null
          finished_at?: string | null
          id?: number
          notes?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          articles_added?: number | null
          finished_at?: string | null
          id?: number
          notes?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_festival_json_update_with_audit: {
        Args: {
          p_announcement_date?: string
          p_artists?: Json
          p_basic_changes?: Json
          p_festival_id: number
          p_lineup_round?: string
          p_reason?: string
          p_source_file_name?: string
          p_source_type?: string
          p_source_url?: string
          p_tickets?: Json
          p_work_type?: string
        }
        Returns: Json
      }
      apply_festival_json_update_with_summary: {
        Args: {
          p_announcement_date?: string
          p_artists?: Json
          p_audit_summary?: Json
          p_basic_changes?: Json
          p_festival_id: number
          p_lineup_round?: string
          p_reason?: string
          p_source_file_name?: string
          p_source_type?: string
          p_source_url?: string
          p_tickets?: Json
          p_work_type?: string
        }
        Returns: Json
      }
      apply_lineup_work_with_audit: {
        Args: {
          p_announcement_date: string
          p_festival_id: number
          p_lineup_round: string
          p_operations: Json
          p_reason: string
          p_source_url: string
          p_work_type: string
        }
        Returns: number
      }
      approve_new_festival_candidate: {
        Args: { p_candidate_id: number; p_draft: Json; p_review_notes?: string }
        Returns: Json
      }
      audit_actor_name: { Args: never; Returns: string }
      audit_lineup_snapshot: {
        Args: {
          p_festival_id: number
          p_normalized_name: string
          p_performance_date: string
        }
        Returns: Json
      }
      audit_ticket_snapshot: { Args: { p_ticket_id: number }; Returns: Json }
      change_festival_thumbnail_with_audit: {
        Args: {
          p_festival_id: number
          p_new_url: string
          p_note?: string
          p_source_url?: string
        }
        Returns: number
      }
      change_festival_ticket_with_audit: {
        Args: {
          p_festival_id: number
          p_note?: string
          p_operation: string
          p_source_url?: string
          p_ticket?: Json
          p_ticket_id?: number
        }
        Returns: Json
      }
      create_artist_with_audit: {
        Args: {
          p_aliases?: string[]
          p_name: string
          p_normalized_name: string
        }
        Returns: Json
      }
      create_discord_festival_candidate: {
        Args: {
          p_announcement_round: string
          p_comparison: Json
          p_draft: Json
          p_regenerate?: boolean
          p_source_assets: Json
          p_source_url: string
          p_work_type: string
        }
        Returns: {
          announcement_round: string
          category: string | null
          comparison_json: Json
          created_at: string | null
          created_by: string | null
          draft_json: Json | null
          end_date: string | null
          festival_id: number | null
          festival_name: string | null
          id: number
          location: string | null
          parent_candidate_id: number | null
          raw_text: string | null
          reject_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          score: number | null
          source_assets: Json
          source_type: string | null
          source_url: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string | null
          version_number: number
          work_type: string
        }
        SetofOptions: {
          from: "*"
          to: "festival_candidates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_discord_festival_registration_draft: {
        Args: {
          p_announcement_round: string
          p_comparison: Json
          p_draft: Json
          p_source_assets: Json
          p_source_url: string
        }
        Returns: {
          announcement_round: string
          category: string | null
          comparison_json: Json
          created_at: string | null
          created_by: string | null
          draft_json: Json | null
          end_date: string | null
          festival_id: number | null
          festival_name: string | null
          id: number
          location: string | null
          parent_candidate_id: number | null
          raw_text: string | null
          reject_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          score: number | null
          source_assets: Json
          source_type: string | null
          source_url: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string | null
          version_number: number
          work_type: string
        }
        SetofOptions: {
          from: "*"
          to: "festival_candidates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_discord_festival_update_draft: {
        Args: {
          p_announcement_round: string
          p_comparison: Json
          p_draft: Json
          p_festival_id: number
          p_regenerate?: boolean
          p_source_url: string
        }
        Returns: {
          announcement_round: string
          applied_at: string | null
          base_data_hash: string | null
          base_festival_updated_at: string | null
          comparison_json: Json
          created_at: string
          created_by: string | null
          draft_json: Json
          festival_id: number
          id: number
          selection_json: Json
          source_type: string
          source_url: string
          status: string
          version_number: number
          workflow_json: Json
        }
        SetofOptions: {
          from: "*"
          to: "festival_update_drafts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_discord_new_festival_candidate: {
        Args: {
          p_announcement_round: string
          p_comparison: Json
          p_draft: Json
          p_regenerate?: boolean
          p_source_assets: Json
          p_source_url: string
        }
        Returns: {
          announcement_round: string
          category: string | null
          comparison_json: Json
          created_at: string | null
          created_by: string | null
          draft_json: Json | null
          end_date: string | null
          festival_id: number | null
          festival_name: string | null
          id: number
          location: string | null
          parent_candidate_id: number | null
          raw_text: string | null
          reject_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          score: number | null
          source_assets: Json
          source_type: string | null
          source_url: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string | null
          version_number: number
          work_type: string
        }
        SetofOptions: {
          from: "*"
          to: "festival_candidates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_festival_with_audit: {
        Args: { p_festival: Json }
        Returns: number
      }
      delete_artist_admin: { Args: { p_artist_id: number }; Returns: Json }
      delete_festival_with_audit: {
        Args: { p_festival_id: number }
        Returns: number
      }
      festival_update_data_snapshot: {
        Args: { p_festival_id: number }
        Returns: Json
      }
      finalize_festival_update_draft: {
        Args: {
          p_announcement_date?: string
          p_artists?: Json
          p_audit_summary?: Json
          p_basic_changes?: Json
          p_lineup_round?: string
          p_reason?: string
          p_tickets?: Json
          p_update_draft_id: number
          p_work_type?: string
        }
        Returns: Json
      }
      import_festival_from_xlsx: {
        Args: { p_artists: Json; p_festival: Json }
        Returns: Json
      }
      import_festival_lineup: {
        Args: { p_artists: Json; p_festival_id: number }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      is_festival_bot: { Args: never; Returns: boolean }
      normalize_artist_name: { Args: { input_name: string }; Returns: string }
      normalize_festival_name: {
        Args: { p_name: string; p_start_date?: string }
        Returns: string
      }
      refresh_festival_statuses: { Args: never; Returns: number }
      search_similar_artists: {
        Args: { input_name: string }
        Returns: {
          id: number
          name: string
          normalized_name: string
          similarity_score: number
        }[]
      }
      set_artist_display_name: {
        Args: { p_artist_id: number; p_display_name: string }
        Returns: {
          id: number
          name: string
          normalized_name: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_artist_admin: {
        Args: {
          p_aliases?: string[]
          p_artist_id: number
          p_name: string
          p_normalized_name: string
        }
        Returns: Json
      }
      update_artist_from_festival_admin: {
        Args: {
          p_aliases?: string[]
          p_artist_id: number
          p_festival_id: number
          p_name: string
          p_normalized_name: string
        }
        Returns: Json
      }
      update_artists_from_excel: { Args: { p_artists: Json }; Returns: Json }
      update_festival_basic_info_with_audit: {
        Args: { p_festival: Json; p_festival_id: number }
        Returns: number
      }
      update_festival_statuses: { Args: never; Returns: undefined }
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
