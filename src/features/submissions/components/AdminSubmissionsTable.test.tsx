// Story 6-1: AdminSubmissionsTable component tests

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdminSubmissionsTable } from './AdminSubmissionsTable'
import type { AdminSubmission } from '../types/adminSubmission.types'

const mockSubmissions: AdminSubmission[] = [
  {
    id: 'sub-1',
    mediaType: 'video',
    mediaUrl: 'https://example.com/video',
    bunnyVideoId: 'bunny-1',
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
    categoryName: 'Short Film',
    categoryType: 'video',
    review: {
      reviewId: 'rev-1',
      judgeId: 'judge-1',
      judgeName: 'Jane Doe',
      rating: 8,
      ratingTier: 'Advanced Producer',
      feedback: 'Excellent storytelling',
      reviewedAt: '2026-01-31T10:00:00Z',
      adminFeedbackOverride: null,
      adminFeedbackOverrideAt: null,
    },
    rankingPosition: 1,
    rankingId: 'rank-1',
    disqualifiedAt: null,
    restoredAt: null,
    adminRankingOverride: null,
    adminRankingOverrideAt: null,
    assignedJudgeName: 'Jane Doe',
  },
  {
    id: 'sub-2',
    mediaType: 'photo',
    mediaUrl: 'https://example.com/photo.jpg',
    bunnyVideoId: null,
    thumbnailUrl: null,
    status: 'disqualified',
    submittedAt: '2026-01-29T08:00:00Z',
    createdAt: '2026-01-29T08:00:00Z',
    participantId: 'p-2',
    participantCode: 'XYZ67890',
    participantName: 'Bob Jones',
    organizationName: 'Shelbyville High',
    tlcName: 'Mrs. Krabappel',
    tlcEmail: 'krabappel@test.com',
    categoryId: 'cat-2',
    categoryName: 'Photography',
    categoryType: 'photo',
    review: null,
    rankingPosition: null,
    rankingId: null,
    disqualifiedAt: null,
    restoredAt: null,
    adminRankingOverride: null,
    adminRankingOverrideAt: null,
    assignedJudgeName: 'John Smith',
  },
]

describe('AdminSubmissionsTable', () => {
  it('renders table with submission data', () => {
    render(
      <AdminSubmissionsTable
        submissions={mockSubmissions}
        onSelectSubmission={vi.fn()}
      />
    )

    expect(screen.getByText('ABC12345')).toBeInTheDocument()
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Short Film')).toBeInTheDocument()
    expect(screen.getByText('XYZ67890')).toBeInTheDocument()
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
  })

  it('renders status badges', () => {
    render(
      <AdminSubmissionsTable
        submissions={mockSubmissions}
        onSelectSubmission={vi.fn()}
      />
    )

    expect(screen.getByText('submitted')).toBeInTheDocument()
    expect(screen.getByText('disqualified')).toBeInTheDocument()
  })

  it('calls onSelectSubmission when row is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <AdminSubmissionsTable
        submissions={mockSubmissions}
        onSelectSubmission={onSelect}
      />
    )

    await user.click(screen.getByText('Alice Smith'))
    expect(onSelect).toHaveBeenCalledWith(mockSubmissions[0])
  })

  it('shows empty state when no submissions', () => {
    render(
      <AdminSubmissionsTable
        submissions={[]}
        onSelectSubmission={vi.fn()}
      />
    )

    expect(screen.getByText(/no submissions found/i)).toBeInTheDocument()
  })

  it('renders all column headers including rating and rank', () => {
    render(
      <AdminSubmissionsTable
        submissions={mockSubmissions}
        onSelectSubmission={vi.fn()}
      />
    )

    expect(screen.getByText('Code')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Rating')).toBeInTheDocument()
    expect(screen.getByText('Feedback')).toBeInTheDocument()
    expect(screen.getByText('Rank')).toBeInTheDocument()
  })

  it('displays rating, feedback preview, and ranking data in table cells', () => {
    render(
      <AdminSubmissionsTable
        submissions={mockSubmissions}
        onSelectSubmission={vi.fn()}
      />
    )

    expect(screen.getByText('8/10')).toBeInTheDocument()
    expect(screen.getByText('Excellent storytelling')).toBeInTheDocument()
    expect(screen.getByText('1st')).toBeInTheDocument()
  })

  it('displays dash for unreviewed submissions', () => {
    render(
      <AdminSubmissionsTable
        submissions={mockSubmissions}
        onSelectSubmission={vi.fn()}
      />
    )

    // Bob Jones has no review/ranking - should show dashes
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('sorts by rating when rating header clicked', async () => {
    const user = userEvent.setup()

    render(
      <AdminSubmissionsTable
        submissions={mockSubmissions}
        onSelectSubmission={vi.fn()}
      />
    )

    const ratingHeader = screen.getByText('Rating')
    await user.click(ratingHeader)

    // After sorting by rating desc, Alice (8/10) should be first
    const rows = screen.getAllByRole('row')
    // First row is header, second should be Alice (rated), third Bob (unrated)
    expect(rows[1]).toHaveTextContent('ABC12345')
    expect(rows[2]).toHaveTextContent('XYZ67890')
  })
})
