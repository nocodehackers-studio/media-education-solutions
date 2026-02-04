// Database types - manually maintained with type-safe enums
// Story 2-9: Added divisions table, updated categories to use division_id

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'judge'
          first_name: string | null
          last_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'admin' | 'judge'
          first_name?: string | null
          last_name?: string | null
          created_at?: string
        }
        Update: {
          // SECURITY: Only first_name and last_name are updatable
          // role, email, id are protected by DB trigger (protect_profile_columns)
          first_name?: string | null
          last_name?: string | null
        }
        Relationships: []
      }
      contests: {
        Row: {
          id: string
          name: string
          description: string | null
          slug: string
          contest_code: string
          rules: string | null
          cover_image_url: string | null
          status: 'draft' | 'published' | 'closed' | 'reviewed' | 'finished' | 'deleted'
          deleted_at: string | null
          winners_page_password: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          slug: string
          contest_code: string
          rules?: string | null
          cover_image_url?: string | null
          status?: 'draft' | 'published' | 'closed' | 'reviewed' | 'finished' | 'deleted'
          deleted_at?: string | null
          winners_page_password?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          slug?: string
          contest_code?: string
          rules?: string | null
          cover_image_url?: string | null
          status?: 'draft' | 'published' | 'closed' | 'reviewed' | 'finished' | 'deleted'
          deleted_at?: string | null
          winners_page_password?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      // Story 2-9: Divisions table for organizing categories by competition level
      divisions: {
        Row: {
          id: string
          contest_id: string
          name: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          contest_id: string
          name: string
          display_order?: number
          created_at?: string
        }
        Update: {
          contest_id?: string
          name?: string
          display_order?: number
        }
        Relationships: [
          {
            foreignKeyName: 'divisions_contest_id_fkey'
            columns: ['contest_id']
            isOneToOne: false
            referencedRelation: 'contests'
            referencedColumns: ['id']
          }
        ]
      }
      participants: {
        Row: {
          id: string
          contest_id: string
          code: string
          status: 'unused' | 'used'
          name: string | null
          organization_name: string | null
          tlc_name: string | null
          tlc_email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          contest_id: string
          code: string
          status?: 'unused' | 'used'
          name?: string | null
          organization_name?: string | null
          tlc_name?: string | null
          tlc_email?: string | null
          created_at?: string
        }
        Update: {
          contest_id?: string
          code?: string
          status?: 'unused' | 'used'
          name?: string | null
          organization_name?: string | null
          tlc_name?: string | null
          tlc_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'participants_contest_id_fkey'
            columns: ['contest_id']
            isOneToOne: false
            referencedRelation: 'contests'
            referencedColumns: ['id']
          }
        ]
      }
      // Story 2-9: Categories now reference division_id instead of contest_id
      categories: {
        Row: {
          id: string
          division_id: string
          name: string
          type: 'video' | 'photo'
          rules: string | null
          description: string | null
          deadline: string
          status: 'draft' | 'published' | 'closed'
          created_at: string
        }
        Insert: {
          id?: string
          division_id: string
          name: string
          type: 'video' | 'photo'
          rules?: string | null
          description?: string | null
          deadline: string
          status?: 'draft' | 'published' | 'closed'
          created_at?: string
        }
        Update: {
          division_id?: string
          name?: string
          type?: 'video' | 'photo'
          rules?: string | null
          description?: string | null
          deadline?: string
          status?: 'draft' | 'published' | 'closed'
        }
        Relationships: [
          {
            foreignKeyName: 'categories_division_id_fkey'
            columns: ['division_id']
            isOneToOne: false
            referencedRelation: 'divisions'
            referencedColumns: ['id']
          }
        ]
      }
      // Story 7-1: Notification logs for email delivery tracking
      notification_logs: {
        Row: {
          id: string
          type: string
          recipient_email: string
          recipient_id: string | null
          related_contest_id: string | null
          related_category_id: string | null
          brevo_message_id: string | null
          status: string
          error_message: string | null
          retry_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: string
          recipient_email: string
          recipient_id?: string | null
          related_contest_id?: string | null
          related_category_id?: string | null
          brevo_message_id?: string | null
          status?: string
          error_message?: string | null
          retry_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          type?: string
          recipient_email?: string
          recipient_id?: string | null
          related_contest_id?: string | null
          related_category_id?: string | null
          brevo_message_id?: string | null
          status?: string
          error_message?: string | null
          retry_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notification_logs_recipient_id_fkey'
            columns: ['recipient_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notification_logs_related_contest_id_fkey'
            columns: ['related_contest_id']
            isOneToOne: false
            referencedRelation: 'contests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notification_logs_related_category_id_fkey'
            columns: ['related_category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          }
        ]
      }
      submissions: {
        Row: {
          id: string
          category_id: string
          participant_id: string
          media_url: string
          status: 'submitted' | 'disqualified'
          created_at: string
        }
        Insert: {
          id?: string
          category_id: string
          participant_id: string
          media_url: string
          status?: 'submitted' | 'disqualified'
          created_at?: string
        }
        Update: {
          category_id?: string
          participant_id?: string
          media_url?: string
          status?: 'submitted' | 'disqualified'
        }
        Relationships: [
          {
            foreignKeyName: 'submissions_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          }
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
      [_ in never]: never
    }
  }
}
