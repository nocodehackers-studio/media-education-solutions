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
