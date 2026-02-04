/**
 * Contest status values
 */
export type ContestStatus = 'draft' | 'published' | 'closed' | 'reviewed' | 'finished';

/**
 * Contest entity from database (snake_case)
 */
export interface ContestRow {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  contest_code: string;
  rules: string | null;
  cover_image_url: string | null;
  status: ContestStatus;
  winners_page_password: string | null;
  winners_page_enabled: boolean;
  winners_page_generated_at: string | null;
  notify_tlc: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Contest entity for application use (camelCase)
 */
export interface Contest {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  contestCode: string;
  rules: string | null;
  coverImageUrl: string | null;
  status: ContestStatus;
  winnersPagePassword: string | null;
  winnersPageEnabled: boolean;
  winnersPageGeneratedAt: string | null;
  notifyTlc: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Participant status values
 */
export type ParticipantStatus = 'unused' | 'used';

/**
 * Participant entity from database (snake_case)
 */
export interface ParticipantRow {
  id: string;
  contest_id: string;
  code: string;
  status: ParticipantStatus;
  organization_name: string | null;
  created_at: string;
}

/**
 * Participant entity for application use (camelCase)
 */
export interface Participant {
  id: string;
  contestId: string;
  code: string;
  status: ParticipantStatus;
  organizationName: string | null;
  createdAt: string;
}

/**
 * Dashboard statistics for admin overview
 */
export interface DashboardStats {
  totalContests: number;
  activeContests: number;
  totalParticipants: number;
  totalSubmissions: number;
}

/**
 * Transform database row (snake_case) to application object (camelCase)
 */
export function transformParticipant(row: ParticipantRow): Participant {
  return {
    id: row.id,
    contestId: row.contest_id,
    code: row.code,
    status: row.status,
    organizationName: row.organization_name,
    createdAt: row.created_at,
  };
}
