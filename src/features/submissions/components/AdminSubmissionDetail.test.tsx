// Story 6-1/6-3/6-4: AdminSubmissionDetail component tests

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdminSubmissionDetail } from './AdminSubmissionDetail'
import type { AdminSubmission } from '../types/adminSubmission.types'

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

function renderWithProviders(ui: ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const mockSubmission: AdminSubmission = {
  id: 'sub-1',
  mediaType: 'photo',
  mediaUrl: 'https://example.com/photo.jpg',
  bunnyVideoId: null,
  thumbnailUrl: null,
  status: 'submitted',
  submittedAt: '2026-01-30T10:00:00Z',
  createdAt: '2026-01-30T10:00:00Z',
  participantId: 'p-1',
  participantCode: 'ABC12345',
  participantName: 'Alice Smith',
  organizationName: 'Springfield Elementary',
  tlcName: 'Mr. Burns',
  tlcEmail: 'burns@test.com',
  categoryId: 'cat-1',
  categoryName: 'Photography',
  categoryType: 'photo',
  review: {
    reviewId: 'rev-1',
    judgeId: 'judge-1',
    judgeName: 'Jane Doe',
    rating: 7,
    ratingTier: 'Advanced Producer',
    feedback: 'Great work!',
    reviewedAt: '2026-01-31T10:00:00Z',
    adminFeedbackOverride: null,
    adminFeedbackOverrideAt: null,
  },
  disqualifiedAt: null,
  restoredAt: null,
  rankingPosition: 1,
  rankingId: 'rank-1',
  adminRankingOverride: null,
  adminRankingOverrideAt: null,
  assignedJudgeName: 'Jane Doe',
}

const mockVideoSubmission: AdminSubmission = {
  ...mockSubmission,
  id: 'sub-2',
  mediaType: 'video',
  mediaUrl: 'https://iframe.mediadelivery.net/embed/12345/video-id',
  bunnyVideoId: 'video-id',
  categoryName: 'Short Film',
  categoryType: 'video',
}

describe('AdminSubmissionDetail', () => {
  it('renders nothing when submission is null', () => {
    const { container } = renderWithProviders(
      <AdminSubmissionDetail
        submission={null}
        open={false}
        onOpenChange={vi.fn()}
      />
    )

    expect(container.innerHTML).toBe('')
  })

  it('displays participant info when open', () => {
    renderWithProviders(
      <AdminSubmissionDetail
        submission={mockSubmission}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText('ABC12345')).toBeInTheDocument()
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Springfield Elementary')).toBeInTheDocument()
    expect(screen.getByText('Mr. Burns')).toBeInTheDocument()
    expect(screen.getByText('burns@test.com')).toBeInTheDocument()
  })

  it('displays submission metadata', () => {
    renderWithProviders(
      <AdminSubmissionDetail
        submission={mockSubmission}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText('Photography')).toBeInTheDocument()
    expect(screen.getByText('photo')).toBeInTheDocument()
    expect(screen.getByText('submitted')).toBeInTheDocument()
  })

  it('renders photo preview for photo submissions', () => {
    renderWithProviders(
      <AdminSubmissionDetail
        submission={mockSubmission}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    const img = screen.getByAltText('Photo by ABC12345')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
  })

  it('renders video iframe for video submissions', () => {
    renderWithProviders(
      <AdminSubmissionDetail
        submission={mockVideoSubmission}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    const iframe = screen.getByTitle('Video by ABC12345')
    expect(iframe).toBeInTheDocument()
    expect(iframe.getAttribute('src')).toContain('iframe.mediadelivery.net')
  })

  it('displays sheet title', () => {
    renderWithProviders(
      <AdminSubmissionDetail
        submission={mockSubmission}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText('Submission Details')).toBeInTheDocument()
  })

  it('displays judge review section when reviewed', () => {
    renderWithProviders(
      <AdminSubmissionDetail
        submission={mockSubmission}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText('Judge Review')).toBeInTheDocument()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText(/7\/10/)).toBeInTheDocument()
    expect(screen.getByText('Great work!')).toBeInTheDocument()
  })

  it('displays pending review when no review exists', () => {
    const pendingSubmission: AdminSubmission = {
      ...mockSubmission,
      review: null,
      rankingPosition: null,
    }

    renderWithProviders(
      <AdminSubmissionDetail
        submission={pendingSubmission}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText('Pending Review')).toBeInTheDocument()
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument()
  })

  it('shows Disqualify button for submitted submissions', () => {
    renderWithProviders(
      <AdminSubmissionDetail
        submission={mockSubmission}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText('Disqualify')).toBeInTheDocument()
    expect(screen.queryByText('Restore')).not.toBeInTheDocument()
  })

  it('shows Restore button for disqualified submissions', () => {
    const disqualifiedSubmission: AdminSubmission = {
      ...mockSubmission,
      status: 'disqualified',
      disqualifiedAt: '2026-01-31T12:00:00Z',
    }

    renderWithProviders(
      <AdminSubmissionDetail
        submission={disqualifiedSubmission}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText('Restore')).toBeInTheDocument()
    expect(screen.queryByText('Disqualify')).not.toBeInTheDocument()
  })

  it('displays disqualifiedAt timestamp for disqualified submissions', () => {
    const disqualifiedSubmission: AdminSubmission = {
      ...mockSubmission,
      status: 'disqualified',
      disqualifiedAt: '2026-01-31T12:00:00Z',
    }

    renderWithProviders(
      <AdminSubmissionDetail
        submission={disqualifiedSubmission}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText(/Disqualified/)).toBeInTheDocument()
  })

  it('does not show Disqualify button for non-submitted statuses', () => {
    const uploadingSubmission: AdminSubmission = {
      ...mockSubmission,
      status: 'uploading',
    }

    renderWithProviders(
      <AdminSubmissionDetail
        submission={uploadingSubmission}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.queryByText('Disqualify')).not.toBeInTheDocument()
    expect(screen.queryByText('Restore')).not.toBeInTheDocument()
  })
})
