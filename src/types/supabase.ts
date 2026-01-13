// Database types will be generated via: npx supabase gen types typescript
// For now, use a minimal placeholder

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
          status: 'draft' | 'published' | 'closed' | 'reviewed' | 'finished'
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
          status?: 'draft' | 'published' | 'closed' | 'reviewed' | 'finished'
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
          status?: 'draft' | 'published' | 'closed' | 'reviewed' | 'finished'
          winners_page_password?: string | null
          updated_at?: string
        }
        Relationships: []
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
      categories: {
        Row: {
          id: string
          contest_id: string
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
          contest_id: string
          name: string
          type: 'video' | 'photo'
          rules?: string | null
          description?: string | null
          deadline: string
          status?: 'draft' | 'published' | 'closed'
          created_at?: string
        }
        Update: {
          contest_id?: string
          name?: string
          type?: 'video' | 'photo'
          rules?: string | null
          description?: string | null
          deadline?: string
          status?: 'draft' | 'published' | 'closed'
        }
        Relationships: [
          {
            foreignKeyName: 'categories_contest_id_fkey'
            columns: ['contest_id']
            isOneToOne: false
            referencedRelation: 'contests'
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
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
        }
        Insert: {
          id?: string
          category_id: string
          participant_id: string
          media_url: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
        }
        Update: {
          category_id?: string
          participant_id?: string
          media_url?: string
          status?: 'pending' | 'approved' | 'rejected'
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
