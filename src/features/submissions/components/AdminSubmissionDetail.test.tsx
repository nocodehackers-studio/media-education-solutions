// Story 6-1: AdminSubmissionDetail component tests

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdminSubmissionDetail } from './AdminSubmissionDetail'
import type { AdminSubmission } from '../types/adminSubmission.types'

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
    const { container } = render(
      <AdminSubmissionDetail
        submission={null}
        open={false}
        onOpenChange={vi.fn()}
      />
    )

    expect(container.innerHTML).toBe('')
  })

  it('displays participant info when open', () => {
    render(
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
    render(
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
    render(
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
    render(
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
    render(
      <AdminSubmissionDetail
        submission={mockSubmission}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText('Submission Details')).toBeInTheDocument()
  })
})
