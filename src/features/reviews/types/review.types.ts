// Review types - Story 5.1
// Types for judge review dashboard and submission review

export type SubmissionFilter = 'all' | 'pending' | 'reviewed';

export interface RatingTier {
  tier: number;
  label: string;
  minScore: number;
  maxScore: number;
}

export const RATING_TIERS: RatingTier[] = [
  { tier: 1, label: 'Developing Skills', minScore: 1, maxScore: 2 },
  { tier: 2, label: 'Emerging Producer', minScore: 3, maxScore: 4 },
  { tier: 3, label: 'Proficient Creator', minScore: 5, maxScore: 6 },
  { tier: 4, label: 'Advanced Producer', minScore: 7, maxScore: 8 },
  { tier: 5, label: 'Master Creator', minScore: 9, maxScore: 10 },
];

export function getRatingTier(rating: number): RatingTier | null {
  if (!Number.isFinite(rating) || rating < 1 || rating > 10) {
    return null;
  }
  const tier = RATING_TIERS.find(
    (t) => rating >= t.minScore && rating <= t.maxScore
  );
  return tier ?? null;
}

export interface SubmissionForReview {
  id: string;
  mediaType: 'video' | 'photo';
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  bunnyVideoId: string | null;
  status: string;
  submittedAt: string;
  participantCode: string;
  reviewId: string | null;
  rating: number | null;
  feedback: string | null;
}

export interface ReviewProgress {
  total: number;
  reviewed: number;
  pending: number;
  percentage: number;
}

/** Raw row returned by get_submissions_for_review RPC */
export interface SubmissionForReviewRow {
  id: string;
  media_type: string;
  media_url: string | null;
  thumbnail_url: string | null;
  bunny_video_id: string | null;
  status: string;
  submitted_at: string;
  participant_code: string;
  review_id: string | null;
  rating: number | null;
  feedback: string | null;
}

export function transformSubmissionForReview(
  row: SubmissionForReviewRow
): SubmissionForReview {
  return {
    id: row.id,
    mediaType: row.media_type as 'video' | 'photo',
    mediaUrl: row.media_url,
    thumbnailUrl: row.thumbnail_url,
    bunnyVideoId: row.bunny_video_id,
    status: row.status,
    submittedAt: row.submitted_at,
    participantCode: row.participant_code,
    reviewId: row.review_id,
    rating: row.rating,
    feedback: row.feedback,
  };
}
