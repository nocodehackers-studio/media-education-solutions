// Division types - Story 2.9
// Database types (snake_case) and application types (camelCase)

// Database row (snake_case from Supabase)
export interface DivisionRow {
  id: string;
  contest_id: string;
  name: string;
  display_order: number;
  created_at: string;
}

// Application type (camelCase for React)
export interface Division {
  id: string;
  contestId: string;
  name: string;
  displayOrder: number;
  createdAt: string;
  categoryCount?: number; // Computed in query
}

// Transform database row to application type
export function transformDivision(row: DivisionRow & { category_count?: number }): Division {
  return {
    id: row.id,
    contestId: row.contest_id,
    name: row.name,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    categoryCount: row.category_count,
  };
}
