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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json
          target_id: string | null
          target_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      commits: {
        Row: {
          author_avatar: string | null
          author_login: string | null
          committed_at: string | null
          id: string
          message: string | null
          repository_id: string
          sha: string
        }
        Insert: {
          author_avatar?: string | null
          author_login?: string | null
          committed_at?: string | null
          id?: string
          message?: string | null
          repository_id: string
          sha: string
        }
        Update: {
          author_avatar?: string | null
          author_login?: string | null
          committed_at?: string | null
          id?: string
          message?: string | null
          repository_id?: string
          sha?: string
        }
        Relationships: [
          {
            foreignKeyName: "commits_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "repositories"
            referencedColumns: ["id"]
          },
        ]
      }
      contributors: {
        Row: {
          avatar_url: string | null
          contributions: number
          login: string
          repository_id: string
        }
        Insert: {
          avatar_url?: string | null
          contributions?: number
          login: string
          repository_id: string
        }
        Update: {
          avatar_url?: string | null
          contributions?: number
          login?: string
          repository_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributors_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "repositories"
            referencedColumns: ["id"]
          },
        ]
      }
      documentation_drafts: {
        Row: {
          approval_status: string
          body_markdown: string
          created_at: string
          doc_type: string
          id: string
          model: string | null
          repository_id: string
          structured_result: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: string
          body_markdown?: string
          created_at?: string
          doc_type: string
          id?: string
          model?: string | null
          repository_id: string
          structured_result?: Json
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: string
          body_markdown?: string
          created_at?: string
          doc_type?: string
          id?: string
          model?: string | null
          repository_id?: string
          structured_result?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      github_publish_events: {
        Row: {
          created_at: string
          error_message: string | null
          github_response_metadata: Json
          github_url: string | null
          id: string
          repository_id: string
          source_id: string | null
          source_type: string
          status: string
          target_id: string | null
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          github_response_metadata?: Json
          github_url?: string | null
          id?: string
          repository_id: string
          source_id?: string | null
          source_type: string
          status: string
          target_id?: string | null
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          github_response_metadata?: Json
          github_url?: string | null
          id?: string
          repository_id?: string
          source_id?: string | null
          source_type?: string
          status?: string
          target_id?: string | null
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      issue_triage_results: {
        Row: {
          approval_status: string
          created_at: string
          id: string
          input_body: string | null
          input_title: string
          issue_id: string
          model: string
          repository_id: string
          result: Json
          suggested_reply: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: string
          created_at?: string
          id?: string
          input_body?: string | null
          input_title: string
          issue_id: string
          model: string
          repository_id: string
          result?: Json
          suggested_reply?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: string
          created_at?: string
          id?: string
          input_body?: string | null
          input_title?: string
          issue_id?: string
          model?: string
          repository_id?: string
          result?: Json
          suggested_reply?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      issues: {
        Row: {
          author_avatar: string | null
          author_login: string | null
          body: string | null
          closed_at: string | null
          comments: number
          created_at: string | null
          github_id: number
          id: string
          labels: Json
          number: number
          repository_id: string
          state: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author_avatar?: string | null
          author_login?: string | null
          body?: string | null
          closed_at?: string | null
          comments?: number
          created_at?: string | null
          github_id: number
          id?: string
          labels?: Json
          number: number
          repository_id: string
          state: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author_avatar?: string | null
          author_login?: string | null
          body?: string | null
          closed_at?: string | null
          comments?: number
          created_at?: string | null
          github_id?: number
          id?: string
          labels?: Json
          number?: number
          repository_id?: string
          state?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issues_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "repositories"
            referencedColumns: ["id"]
          },
        ]
      }
      labels: {
        Row: {
          color: string | null
          description: string | null
          name: string
          repository_id: string
        }
        Insert: {
          color?: string | null
          description?: string | null
          name: string
          repository_id: string
        }
        Update: {
          color?: string | null
          description?: string | null
          name?: string
          repository_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "labels_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "repositories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          github_id: string | null
          github_login: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          github_id?: string | null
          github_login?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          github_id?: string | null
          github_login?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      pull_request_ai_summaries: {
        Row: {
          approval_status: string
          created_at: string
          id: string
          input_body_snapshot: string | null
          input_metadata_snapshot: Json
          input_title_snapshot: string
          model: string
          pull_request_id: string
          release_note_candidate: string | null
          repository_id: string
          result: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: string
          created_at?: string
          id?: string
          input_body_snapshot?: string | null
          input_metadata_snapshot?: Json
          input_title_snapshot: string
          model: string
          pull_request_id: string
          release_note_candidate?: string | null
          repository_id: string
          result?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: string
          created_at?: string
          id?: string
          input_body_snapshot?: string | null
          input_metadata_snapshot?: Json
          input_title_snapshot?: string
          model?: string
          pull_request_id?: string
          release_note_candidate?: string | null
          repository_id?: string
          result?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pull_requests: {
        Row: {
          additions: number | null
          author_avatar: string | null
          author_login: string | null
          body: string | null
          changed_files: number | null
          closed_at: string | null
          created_at: string | null
          deletions: number | null
          draft: boolean | null
          github_id: number
          id: string
          merged_at: string | null
          number: number
          repository_id: string
          state: string
          title: string
          updated_at: string | null
        }
        Insert: {
          additions?: number | null
          author_avatar?: string | null
          author_login?: string | null
          body?: string | null
          changed_files?: number | null
          closed_at?: string | null
          created_at?: string | null
          deletions?: number | null
          draft?: boolean | null
          github_id: number
          id?: string
          merged_at?: string | null
          number: number
          repository_id: string
          state: string
          title: string
          updated_at?: string | null
        }
        Update: {
          additions?: number | null
          author_avatar?: string | null
          author_login?: string | null
          body?: string | null
          changed_files?: number | null
          closed_at?: string | null
          created_at?: string | null
          deletions?: number | null
          draft?: boolean | null
          github_id?: number
          id?: string
          merged_at?: string | null
          number?: number
          repository_id?: string
          state?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pull_requests_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "repositories"
            referencedColumns: ["id"]
          },
        ]
      }
      release_drafts: {
        Row: {
          body_markdown: string
          created_at: string
          id: string
          repository_id: string
          result: Json
          status: string
          title: string
          updated_at: string
          user_id: string
          version: string
        }
        Insert: {
          body_markdown?: string
          created_at?: string
          id?: string
          repository_id: string
          result?: Json
          status?: string
          title?: string
          updated_at?: string
          user_id: string
          version?: string
        }
        Update: {
          body_markdown?: string
          created_at?: string
          id?: string
          repository_id?: string
          result?: Json
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      repositories: {
        Row: {
          created_at: string
          default_branch: string | null
          description: string | null
          forks: number
          full_name: string
          github_id: number
          html_url: string | null
          id: string
          name: string
          open_issues: number
          owner: string
          primary_language: string | null
          pushed_at: string | null
          stars: number
          updated_at: string
          visibility: string | null
        }
        Insert: {
          created_at?: string
          default_branch?: string | null
          description?: string | null
          forks?: number
          full_name: string
          github_id: number
          html_url?: string | null
          id?: string
          name: string
          open_issues?: number
          owner: string
          primary_language?: string | null
          pushed_at?: string | null
          stars?: number
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          created_at?: string
          default_branch?: string | null
          description?: string | null
          forks?: number
          full_name?: string
          github_id?: number
          html_url?: string | null
          id?: string
          name?: string
          open_issues?: number
          owner?: string
          primary_language?: string | null
          pushed_at?: string | null
          stars?: number
          updated_at?: string
          visibility?: string | null
        }
        Relationships: []
      }
      repository_memberships: {
        Row: {
          connected_at: string
          repository_id: string
          role: string
          user_id: string
        }
        Insert: {
          connected_at?: string
          repository_id: string
          role?: string
          user_id: string
        }
        Update: {
          connected_at?: string
          repository_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "repository_memberships_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "repositories"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          ai_tone: string
          auto_changelog: boolean
          prefs: Json
          security_sensitivity: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_tone?: string
          auto_changelog?: boolean
          prefs?: Json
          security_sensitivity?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_tone?: string
          auto_changelog?: boolean
          prefs?: Json
          security_sensitivity?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sync_jobs: {
        Row: {
          commits_synced: number | null
          contributors_synced: number | null
          error: string | null
          finished_at: string | null
          id: string
          issues_synced: number | null
          labels_synced: number | null
          prs_synced: number | null
          repository_id: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          commits_synced?: number | null
          contributors_synced?: number | null
          error?: string | null
          finished_at?: string | null
          id?: string
          issues_synced?: number | null
          labels_synced?: number | null
          prs_synced?: number | null
          repository_id: string
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          commits_synced?: number | null
          contributors_synced?: number | null
          error?: string | null
          finished_at?: string | null
          id?: string
          issues_synced?: number | null
          labels_synced?: number | null
          prs_synced?: number | null
          repository_id?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_jobs_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "repositories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_github_tokens: {
        Row: {
          access_token: string
          refresh_token: string | null
          scopes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          refresh_token?: string | null
          scopes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          refresh_token?: string | null
          scopes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_repo_access: {
        Args: { _repo_id: string; _user_id: string }
        Returns: boolean
      }
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
