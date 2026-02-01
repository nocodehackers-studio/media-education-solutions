// Story 6-2: AdminReviewSection component tests

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdminReviewSection } from './AdminReviewSection'
import type { AdminSubmissionReview } from '../types/adminSubmission.types'

const mockReview: AdminSubmissionReview = {
  reviewId: 'rev-1',
  judgeId: 'judge-1',
  judgeName: 'Jane Doe',
  rating: 7,
  ratingTier: 'Advanced Producer',
  feedback: 'Great composition and storytelling.',
  reviewedAt: '2026-01-31T10:00:00Z',
}

describe('AdminReviewSection', () => {
  it('renders review data when reviewed', () => {
    render(
      <AdminReviewSection
        review={mockReview}
        assignedJudgeName="Jane Doe"
        rankingPosition={null}
      />
    )

    expect(screen.getByText('Judge Review')).toBeInTheDocument()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('7/10')).toBeInTheDocument()
    expect(screen.getByText('(Advanced Producer)')).toBeInTheDocument()
    expect(screen.getByText('Great composition and storytelling.')).toBeInTheDocument()
  })

  it('renders pending review when no review', () => {
    render(
      <AdminReviewSection
        review={null}
        assignedJudgeName="John Smith"
        rankingPosition={null}
      />
    )

    expect(screen.getByText('Pending Review')).toBeInTheDocument()
    expect(screen.getByText(/John Smith/)).toBeInTheDocument()
  })

  it('renders no judge assigned when assignedJudgeName is null', () => {
    render(
      <AdminReviewSection
        review={null}
        assignedJudgeName={null}
        rankingPosition={null}
      />
    )

    expect(screen.getByText('Pending Review')).toBeInTheDocument()
    expect(screen.getByText(/No judge assigned/)).toBeInTheDocument()
  })

  it('displays ranking position when present', () => {
    render(
      <AdminReviewSection
        review={mockReview}
        assignedJudgeName="Jane Doe"
        rankingPosition={2}
      />
    )

    expect(screen.getByText('2nd')).toBeInTheDocument()
  })

  it('does not display ranking when null', () => {
    render(
      <AdminReviewSection
        review={mockReview}
        assignedJudgeName="Jane Doe"
        rankingPosition={null}
      />
    )

    expect(screen.queryByText('Ranking')).not.toBeInTheDocument()
  })

  it('shows "No feedback provided" when feedback is empty', () => {
    const reviewNoFeedback: AdminSubmissionReview = {
      ...mockReview,
      feedback: null,
    }

    render(
      <AdminReviewSection
        review={reviewNoFeedback}
        assignedJudgeName="Jane Doe"
        rankingPosition={null}
      />
    )

    expect(screen.getByText('No feedback provided')).toBeInTheDocument()
  })
})
