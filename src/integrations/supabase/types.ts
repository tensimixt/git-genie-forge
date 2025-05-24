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
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      AnalysisRequests: {
        Row: {
          branch: string
          createdAt: string
          deploymentPlatform: string | null
          greptileResponse: Json | null
          id: string
          mistralResponse: Json | null
          owner: string
          prompt: string
          repo: string
          repoStructureObject: Json | null
          repoUrl: string
          status: string
          updatedAt: string
        }
        Insert: {
          branch: string
          createdAt?: string
          deploymentPlatform?: string | null
          greptileResponse?: Json | null
          id?: string
          mistralResponse?: Json | null
          owner: string
          prompt: string
          repo: string
          repoStructureObject?: Json | null
          repoUrl: string
          status?: string
          updatedAt?: string
        }
        Update: {
          branch?: string
          createdAt?: string
          deploymentPlatform?: string | null
          greptileResponse?: Json | null
          id?: string
          mistralResponse?: Json | null
          owner?: string
          prompt?: string
          repo?: string
          repoStructureObject?: Json | null
          repoUrl?: string
          status?: string
          updatedAt?: string
        }
        Relationships: []
      }
      Chat: {
        Row: {
          createdAt: string
          id: string
          llamaCoderVersion: string
          model: string
          prompt: string
          quality: string
          shadcn: boolean
          title: string
        }
        Insert: {
          createdAt?: string
          id: string
          llamaCoderVersion?: string
          model: string
          prompt: string
          quality: string
          shadcn: boolean
          title: string
        }
        Update: {
          createdAt?: string
          id?: string
          llamaCoderVersion?: string
          model?: string
          prompt?: string
          quality?: string
          shadcn?: boolean
          title?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          session_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          session_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "repo_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      GeneratedApp: {
        Row: {
          code: string
          createdAt: string
          id: string
          model: string
          prompt: string
        }
        Insert: {
          code: string
          createdAt?: string
          id: string
          model: string
          prompt: string
        }
        Update: {
          code?: string
          createdAt?: string
          id?: string
          model?: string
          prompt?: string
        }
        Relationships: []
      }
      Message: {
        Row: {
          chatId: string
          content: string
          createdAt: string
          id: string
          position: number
          role: string
        }
        Insert: {
          chatId: string
          content: string
          createdAt?: string
          id: string
          position: number
          role: string
        }
        Update: {
          chatId?: string
          content?: string
          createdAt?: string
          id?: string
          position?: number
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "Message_chatId_fkey"
            columns: ["chatId"]
            isOneToOne: false
            referencedRelation: "Chat"
            referencedColumns: ["id"]
          },
        ]
      }
      repo_sessions: {
        Row: {
          created_at: string
          github_repo_id: number
          id: string
          repo_data: Json | null
          repo_full_name: string
          repo_name: string
          repo_url: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          github_repo_id: number
          id?: string
          repo_data?: Json | null
          repo_full_name: string
          repo_name: string
          repo_url: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          github_repo_id?: number
          id?: string
          repo_data?: Json | null
          repo_full_name?: string
          repo_name?: string
          repo_url?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          github_access_token: string | null
          github_id: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          github_access_token?: string | null
          github_id?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          github_access_token?: string | null
          github_id?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
