// Story 6-2/6-3: Admin review section for submission detail panel
// Displays judge review data with override support

import { Badge, Button } from '@/components/ui'
import type { AdminSubmissionReview } from '../types/adminSubmission.types'
import { formatSubmissionDate, formatRankingPosition } from '../types/adminSubmission.types'

interface AdminReviewSectionProps {
  review: AdminSubmissionReview | null
  assignedJudgeName: string | null
  rankingPosition: number | null
  onOverrideFeedback?: () => void
  contestTimezone?: string
}

export function AdminReviewSection({
  review,
  assignedJudgeName,
  rankingPosition,
  onOverrideFeedback,
  contestTimezone,
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

  const hasOverride = review.adminFeedbackOverride != null
  const effectiveFeedback = hasOverride ? review.adminFeedbackOverride : review.feedback

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Judge Review</h3>
        {onOverrideFeedback && (
          <Button variant="outline" size="sm" onClick={onOverrideFeedback}>
            {hasOverride ? 'Edit Override' : 'Override Feedback'}
          </Button>
        )}
      </div>
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
        <dd>
          {hasOverride && (
            <div className="mb-1">
              <Badge variant="secondary" className="text-xs">Overridden</Badge>
              {review.adminFeedbackOverrideAt && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {formatSubmissionDate(review.adminFeedbackOverrideAt, 'short', contestTimezone)}
                </span>
              )}
            </div>
          )}
          <div className="whitespace-pre-wrap break-words">
            {effectiveFeedback || 'No feedback provided'}
          </div>
          {hasOverride && review.feedback && (
            <div className="mt-2 rounded border bg-muted/50 p-2 text-xs text-muted-foreground">
              <span className="font-medium">Original: </span>
              <span className="whitespace-pre-wrap break-words">{review.feedback}</span>
            </div>
          )}
        </dd>

        <dt className="text-muted-foreground">Reviewed</dt>
        <dd>{formatSubmissionDate(review.reviewedAt, 'long', contestTimezone)}</dd>

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
