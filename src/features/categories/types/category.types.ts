// Category types - Story 2.5
// Database types (snake_case) and application types (camelCase)

export type CategoryStatus = 'draft' | 'published' | 'closed';
export type CategoryType = 'video' | 'photo';

// Database row (snake_case from Supabase)
export interface CategoryRow {
  id: string;
  contest_id: string;
  name: string;
  type: CategoryType;
  rules: string | null;
  description: string | null;
  deadline: string;
  status: CategoryStatus;
  created_at: string;
}

// Application type (camelCase for React)
export interface Category {
  id: string;
  contestId: string;
  name: string;
  type: CategoryType;
  rules: string | null;
  description: string | null;
  deadline: string;
  status: CategoryStatus;
  createdAt: string;
}

// Transform database row to application type
export function transformCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    contestId: row.contest_id,
    name: row.name,
    type: row.type,
    rules: row.rules,
    description: row.description,
    deadline: row.deadline,
    status: row.status,
    createdAt: row.created_at,
  };
}
