// Story 6-1/6-2: Admin submission types
// Full submission data with participant PII for admin view (NOT anonymous)

import type { MediaType, SubmissionStatus } from './submission.types'
import { getRatingTier } from '@/features/reviews'

// Review data for admin display (Story 6-2, 6-3: override fields)
export interface AdminSubmissionReview {
  reviewId: string
  judgeId: string
  judgeName: string
  rating: number | null
  ratingTier: string | null
  feedback: string | null
  reviewedAt: string
  adminFeedbackOverride: string | null
  adminFeedbackOverrideAt: string | null
}

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
  disqualified_at: string | null
  restored_at: string | null
  student_name: string | null
  tlc_name: string | null
  tlc_email: string | null
  group_member_names: string | null
  participants: {
    id: string
    code: string
    organization_name: string | null
  }
  categories: {
    id: string
    name: string
    type: MediaType
    assigned_judge_id: string | null
    divisions: {
      contest_id: string
    }
    assigned_judge: { first_name: string | null; last_name: string | null } | null
  }
  reviews: Array<{
    id: string
    judge_id: string
    rating: number | null
    feedback: string | null
    updated_at: string
    admin_feedback_override: string | null
    admin_feedback_override_at: string | null
    judge: { first_name: string | null; last_name: string | null } | null
  }> | null
  rankings: Array<{
    id: string
    rank: number
    submission_id: string
    admin_ranking_override: string | null
    admin_ranking_override_at: string | null
  }> | null
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
  disqualifiedAt: string | null
  restoredAt: string | null
  participantId: string
  participantCode: string
  studentName: string | null
  organizationName: string | null
  tlcName: string | null
  tlcEmail: string | null
  groupMemberNames: string | null
  categoryId: string
  categoryName: string
  categoryType: MediaType
  review: AdminSubmissionReview | null
  rankingPosition: number | null
  rankingId: string | null
  adminRankingOverride: string | null
  adminRankingOverrideAt: string | null
  assignedJudgeName: string | null
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

// Ranking position display helper
export function formatRankingPosition(rank: number): string {
  switch (rank) {
    case 1:
      return '1st'
    case 2:
      return '2nd'
    case 3:
      return '3rd'
    default:
      return `${rank}th`
  }
}

function buildJudgeName(profile: { first_name: string | null; last_name: string | null } | null): string | null {
  if (!profile) return null
  const parts = [profile.first_name, profile.last_name].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : 'Unknown Judge'
}

// Transform database row to frontend shape
export function transformAdminSubmission(row: AdminSubmissionRow): AdminSubmission {
  const reviewRow = row.reviews?.[0]

  return {
    id: row.id,
    mediaType: row.media_type,
    mediaUrl: row.media_url,
    bunnyVideoId: row.bunny_video_id,
    thumbnailUrl: row.thumbnail_url,
    status: row.status,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    disqualifiedAt: row.disqualified_at ?? null,
    restoredAt: row.restored_at ?? null,
    participantId: row.participants.id,
    participantCode: row.participants.code,
    studentName: row.student_name,
    organizationName: row.participants.organization_name,
    tlcName: row.tlc_name,
    tlcEmail: row.tlc_email,
    groupMemberNames: row.group_member_names,
    categoryId: row.categories.id,
    categoryName: row.categories.name,
    categoryType: row.categories.type,
    review: reviewRow
      ? {
          reviewId: reviewRow.id,
          judgeId: reviewRow.judge_id,
          judgeName: buildJudgeName(reviewRow.judge) ?? 'Unknown Judge',
          rating: reviewRow.rating,
          ratingTier: reviewRow.rating ? (getRatingTier(reviewRow.rating)?.label ?? null) : null,
          feedback: reviewRow.feedback,
          reviewedAt: reviewRow.updated_at,
          adminFeedbackOverride: reviewRow.admin_feedback_override ?? null,
          adminFeedbackOverrideAt: reviewRow.admin_feedback_override_at ?? null,
        }
      : null,
    rankingPosition: row.rankings?.[0]?.rank ?? null,
    rankingId: row.rankings?.[0]?.id ?? null,
    adminRankingOverride: row.rankings?.[0]?.admin_ranking_override ?? null,
    adminRankingOverrideAt: row.rankings?.[0]?.admin_ranking_override_at ?? null,
    assignedJudgeName: buildJudgeName(row.categories.assigned_judge),
  }
}
