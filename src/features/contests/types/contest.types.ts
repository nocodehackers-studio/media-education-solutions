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
  name: string | null;
  organization_name: string | null;
  tlc_name: string | null;
  tlc_email: string | null;
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
  name: string | null;
  organizationName: string | null;
  tlcName: string | null;
  tlcEmail: string | null;
  createdAt: string;
}
