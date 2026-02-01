// Story 6-2: Admin review section for submission detail panel
// Displays judge review data or pending review state

import { Badge } from '@/components/ui'
import type { AdminSubmissionReview } from '../types/adminSubmission.types'
import { formatSubmissionDate, formatRankingPosition } from '../types/adminSubmission.types'

interface AdminReviewSectionProps {
  review: AdminSubmissionReview | null
  assignedJudgeName: string | null
  rankingPosition: number | null
}

export function AdminReviewSection({
  review,
  assignedJudgeName,
  rankingPosition,
}: AdminReviewSectionProps) {
  if (!review) {
    return (
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Judge Review</h3>
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          <p className="font-medium">Pending Review</p>
          <p className="mt-1">
            Assigned to: {assignedJudgeName ?? 'No judge assigned'}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Judge Review</h3>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Judge</dt>
        <dd>{review.judgeName}</dd>

        <dt className="text-muted-foreground">Rating</dt>
        <dd>
          {review.rating != null ? `${review.rating}/10` : 'Not rated'}
          {review.ratingTier && (
            <span className="ml-2 text-muted-foreground">({review.ratingTier})</span>
          )}
        </dd>

        <dt className="text-muted-foreground">Feedback</dt>
        <dd className="whitespace-pre-wrap break-words">{review.feedback || 'No feedback provided'}</dd>

        <dt className="text-muted-foreground">Reviewed</dt>
        <dd>{formatSubmissionDate(review.reviewedAt, 'long')}</dd>

        {rankingPosition != null && (
          <>
            <dt className="text-muted-foreground">Ranking</dt>
            <dd>
              <Badge variant="default">{formatRankingPosition(rankingPosition)}</Badge>
            </dd>
          </>
        )}
      </dl>
    </section>
  )
}
