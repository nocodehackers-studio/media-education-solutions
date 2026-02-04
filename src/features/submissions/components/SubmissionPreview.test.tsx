// Story 4-6: Tests for SubmissionPreview component
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SubmissionPreview, SubmissionPreviewSkeleton } from './SubmissionPreview'
import type { SubmissionPreviewData } from '../hooks/useSubmissionPreview'

// Mock PhotoLightbox (uses portal)
vi.mock('./PhotoLightbox', () => ({
  PhotoLightbox: vi.fn(({ alt, onClose }) => (
    <div data-testid="photo-lightbox" aria-label={alt}>
      <button onClick={onClose}>Close Lightbox</button>
    </div>
  )),
}))

describe('SubmissionPreview', () => {
  const videoSubmission: SubmissionPreviewData = {
    id: 'sub-123',
    mediaType: 'video',
    mediaUrl: null,
    bunnyVideoId: 'bunny-vid-456',
    thumbnailUrl: null,
    status: 'uploaded',
    submittedAt: '2026-01-29T00:00:00Z',
    categoryId: 'cat-789',
    categoryName: 'Best Documentary',
    categoryType: 'video',
    categoryDeadline: '2026-12-31T23:59:59Z',
    categoryStatus: 'published',
    isLocked: false,
    contestStatus: null,
    review: null,
    studentName: null,
    tlcName: null,
    tlcEmail: null,
    groupMemberNames: null,
  }

  const photoSubmission: SubmissionPreviewData = {
    ...videoSubmission,
    mediaType: 'photo',
    mediaUrl: 'https://cdn.example.com/photo.jpg',
    bunnyVideoId: null,
    categoryName: 'Best Photography',
    categoryType: 'photo',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Video preview', () => {
    it('renders iframe with correct embed URL', () => {
      render(
        <SubmissionPreview submission={videoSubmission} libraryId="lib-123" />
      )

      const iframe = screen.getByTitle('Video preview: Best Documentary')
      expect(iframe).toBeInTheDocument()
      expect(iframe).toHaveAttribute(
        'src',
        'https://iframe.mediadelivery.net/embed/lib-123/bunny-vid-456'
      )
    })

    it('renders iframe with allowFullScreen', () => {
      render(
        <SubmissionPreview submission={videoSubmission} libraryId="lib-123" />
      )

      const iframe = screen.getByTitle('Video preview: Best Documentary')
      expect(iframe).toHaveAttribute('allowfullscreen')
    })

    it('shows unavailable message when libraryId is null', () => {
      render(
        <SubmissionPreview submission={videoSubmission} libraryId={null} />
      )

      expect(screen.getByText('Video preview unavailable')).toBeInTheDocument()
    })

    it('shows unavailable message when bunnyVideoId is null', () => {
      render(
        <SubmissionPreview
          submission={{ ...videoSubmission, bunnyVideoId: null }}
          libraryId="lib-123"
        />
      )

      expect(screen.getByText('Video preview unavailable')).toBeInTheDocument()
    })
  })

  describe('Photo preview', () => {
    it('renders image with correct src and alt', () => {
      render(
        <SubmissionPreview submission={photoSubmission} libraryId={null} />
      )

      const img = screen.getByAltText('Photo submission for Best Photography')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://cdn.example.com/photo.jpg')
    })

    it('shows click hint text', () => {
      render(
        <SubmissionPreview submission={photoSubmission} libraryId={null} />
      )

      expect(screen.getByText('Click to view full screen')).toBeInTheDocument()
    })

    it('has accessible button role', () => {
      render(
        <SubmissionPreview submission={photoSubmission} libraryId={null} />
      )

      expect(
        screen.getByRole('button', { name: 'Click to view full screen' })
      ).toBeInTheDocument()
    })

    it('opens lightbox when clicked', () => {
      render(
        <SubmissionPreview submission={photoSubmission} libraryId={null} />
      )

      fireEvent.click(
        screen.getByRole('button', { name: 'Click to view full screen' })
      )

      expect(screen.getByTestId('photo-lightbox')).toBeInTheDocument()
    })

    it('opens lightbox on Enter key', () => {
      render(
        <SubmissionPreview submission={photoSubmission} libraryId={null} />
      )

      fireEvent.keyDown(
        screen.getByRole('button', { name: 'Click to view full screen' }),
        { key: 'Enter' }
      )

      expect(screen.getByTestId('photo-lightbox')).toBeInTheDocument()
    })

    it('opens lightbox on Space key', () => {
      render(
        <SubmissionPreview submission={photoSubmission} libraryId={null} />
      )

      fireEvent.keyDown(
        screen.getByRole('button', { name: 'Click to view full screen' }),
        { key: ' ' }
      )

      expect(screen.getByTestId('photo-lightbox')).toBeInTheDocument()
    })

    it('closes lightbox when onClose called', () => {
      render(
        <SubmissionPreview submission={photoSubmission} libraryId={null} />
      )

      // Open lightbox
      fireEvent.click(
        screen.getByRole('button', { name: 'Click to view full screen' })
      )
      expect(screen.getByTestId('photo-lightbox')).toBeInTheDocument()

      // Close lightbox via mock close button
      fireEvent.click(screen.getByText('Close Lightbox'))
      expect(screen.queryByTestId('photo-lightbox')).not.toBeInTheDocument()
    })

    it('shows unavailable message when mediaUrl is null', () => {
      render(
        <SubmissionPreview
          submission={{ ...photoSubmission, mediaUrl: null }}
          libraryId={null}
        />
      )

      expect(screen.getByText('Photo preview unavailable')).toBeInTheDocument()
    })
  })

  describe('SubmissionPreviewSkeleton', () => {
    it('renders without errors', () => {
      const { container } = render(<SubmissionPreviewSkeleton />)
      expect(container.firstChild).toBeInTheDocument()
    })
  })
})
