// Story 6-2: AdminReviewSection component tests

import { describe, it, expect, vi } from 'vitest'
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
  adminFeedbackOverride: null,
  adminFeedbackOverrideAt: null,
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

  it('shows "Overridden" badge when feedback override exists', () => {
    const overriddenReview: AdminSubmissionReview = {
      ...mockReview,
      adminFeedbackOverride: 'Admin corrected feedback',
      adminFeedbackOverrideAt: '2026-02-01T10:00:00Z',
    }

    render(
      <AdminReviewSection
        review={overriddenReview}
        assignedJudgeName="Jane Doe"
        rankingPosition={null}
      />
    )

    expect(screen.getByText('Overridden')).toBeInTheDocument()
    expect(screen.getByText('Admin corrected feedback')).toBeInTheDocument()
  })

  it('shows original feedback as secondary when override exists', () => {
    const overriddenReview: AdminSubmissionReview = {
      ...mockReview,
      feedback: 'Original feedback text',
      adminFeedbackOverride: 'Admin override text',
      adminFeedbackOverrideAt: '2026-02-01T10:00:00Z',
    }

    render(
      <AdminReviewSection
        review={overriddenReview}
        assignedJudgeName="Jane Doe"
        rankingPosition={null}
      />
    )

    expect(screen.getByText('Admin override text')).toBeInTheDocument()
    expect(screen.getByText('Original feedback text')).toBeInTheDocument()
    expect(screen.getByText('Original:')).toBeInTheDocument()
  })

  it('renders override feedback button when callback provided', () => {
    const onOverride = vi.fn()

    render(
      <AdminReviewSection
        review={mockReview}
        assignedJudgeName="Jane Doe"
        rankingPosition={null}
        onOverrideFeedback={onOverride}
      />
    )

    expect(screen.getByText('Override Feedback')).toBeInTheDocument()
  })

  it('renders "Edit Override" button when override exists and callback provided', () => {
    const overriddenReview: AdminSubmissionReview = {
      ...mockReview,
      adminFeedbackOverride: 'Override text',
      adminFeedbackOverrideAt: '2026-02-01T10:00:00Z',
    }

    render(
      <AdminReviewSection
        review={overriddenReview}
        assignedJudgeName="Jane Doe"
        rankingPosition={null}
        onOverrideFeedback={vi.fn()}
      />
    )

    expect(screen.getByText('Edit Override')).toBeInTheDocument()
  })
})
