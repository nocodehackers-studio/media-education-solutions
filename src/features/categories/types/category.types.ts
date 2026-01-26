// Category types - Story 2.5, updated Story 3-1
// Database types (snake_case) and application types (camelCase)

export type CategoryStatus = 'draft' | 'published' | 'closed';
export type CategoryType = 'video' | 'photo';

// Database row (snake_case from Supabase)
// Story 2-9: Categories now reference division_id instead of contest_id
// Story 3-1: Added assigned_judge_id and invited_at for judge assignment
export interface CategoryRow {
  id: string;
  division_id: string;
  name: string;
  type: CategoryType;
  rules: string | null;
  description: string | null;
  deadline: string;
  status: CategoryStatus;
  created_at: string;
  assigned_judge_id: string | null;
  invited_at: string | null;
}

// Joined judge profile data (when fetched with join)
export interface AssignedJudge {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

// Application type (camelCase for React)
// Story 3-1: Added assignedJudgeId, invitedAt, and optional assignedJudge join
export interface Category {
  id: string;
  divisionId: string;
  name: string;
  type: CategoryType;
  rules: string | null;
  description: string | null;
  deadline: string;
  status: CategoryStatus;
  createdAt: string;
  assignedJudgeId: string | null;
  invitedAt: string | null;
  // Joined field (optional, only when fetched with join)
  assignedJudge?: AssignedJudge | null;
}

// Extended row type when fetched with judge join
export interface CategoryRowWithJudge extends CategoryRow {
  profiles?: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

// Story 3-4: Extended category type for judge dashboard
// Includes contest/division context and submission count
export interface CategoryWithContext extends Category {
  contestName: string;
  contestId: string;
  divisionName: string;
  submissionCount: number;
}

// Transform database row to application type
// Story 3-1: Updated to handle assigned judge fields and optional join
export function transformCategory(
  row: CategoryRow | CategoryRowWithJudge
): Category {
  const baseCategory = {
    id: row.id,
    divisionId: row.division_id,
    name: row.name,
    type: row.type,
    rules: row.rules,
    description: row.description,
    deadline: row.deadline,
    status: row.status,
    createdAt: row.created_at,
    assignedJudgeId: row.assigned_judge_id,
    invitedAt: row.invited_at,
  };

  // Check if row has joined profiles data
  const rowWithJudge = row as CategoryRowWithJudge;
  if (rowWithJudge.profiles) {
    return {
      ...baseCategory,
      assignedJudge: {
        id: rowWithJudge.profiles.id,
        email: rowWithJudge.profiles.email,
        firstName: rowWithJudge.profiles.first_name,
        lastName: rowWithJudge.profiles.last_name,
      },
    };
  }

  return {
    ...baseCategory,
    assignedJudge: null,
  };
}
