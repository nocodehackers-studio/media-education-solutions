// Story 6-1: Admin submission types
// Full submission data with participant PII for admin view (NOT anonymous)

import type { MediaType, SubmissionStatus } from './submission.types'

// Database row shape (snake_case) from Supabase join query
export interface AdminSubmissionRow {
  id: string
  media_type: MediaType
  media_url: string | null
  bunny_video_id: string | null
  thumbnail_url: string | null
  status: SubmissionStatus
  submitted_at: string
  created_at: string
  participants: {
    id: string
    code: string
    name: string | null
    organization_name: string | null
    tlc_name: string | null
    tlc_email: string | null
  }
  categories: {
    id: string
    name: string
    type: MediaType
    divisions: {
      contest_id: string
    }
  }
}

// Frontend shape (camelCase)
export interface AdminSubmission {
  id: string
  mediaType: MediaType
  mediaUrl: string | null
  bunnyVideoId: string | null
  thumbnailUrl: string | null
  status: SubmissionStatus
  submittedAt: string
  createdAt: string
  participantId: string
  participantCode: string
  participantName: string | null
  organizationName: string | null
  tlcName: string | null
  tlcEmail: string | null
  categoryId: string
  categoryName: string
  categoryType: MediaType
}

// Filter state for admin submissions list
export interface AdminSubmissionFilters {
  categoryId?: string
  status?: string
  mediaType?: string
}

// Badge variant mapping for submission status
export const SUBMISSION_STATUS_VARIANT: Record<string, 'default' | 'destructive' | 'secondary'> = {
  submitted: 'default',
  disqualified: 'destructive',
  uploading: 'secondary',
  uploaded: 'secondary',
}

// Date formatting helpers for admin views
export function formatSubmissionDate(dateStr: string, style: 'short' | 'long' = 'short'): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: style === 'short' ? 'short' : 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Transform database row to frontend shape
export function transformAdminSubmission(row: AdminSubmissionRow): AdminSubmission {
  return {
    id: row.id,
    mediaType: row.media_type,
    mediaUrl: row.media_url,
    bunnyVideoId: row.bunny_video_id,
    thumbnailUrl: row.thumbnail_url,
    status: row.status,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    participantId: row.participants.id,
    participantCode: row.participants.code,
    participantName: row.participants.name,
    organizationName: row.participants.organization_name,
    tlcName: row.participants.tlc_name,
    tlcEmail: row.participants.tlc_email,
    categoryId: row.categories.id,
    categoryName: row.categories.name,
    categoryType: row.categories.type,
  }
}
