// Story 4-6: Tests for SubmissionPreviewPage
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { SubmissionPreviewPage } from './SubmissionPreviewPage'

// Mock dependencies
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockSession = {
  participantId: 'participant-123',
  code: 'ABC123',
  contestId: 'contest-456',
  contestCode: 'CONTEST',
  contestName: 'Test Contest',
  lastActivity: Date.now(),
  name: 'Test Participant',
}

vi.mock('@/contexts', () => ({
  useParticipantSession: vi.fn(() => ({
    session: mockSession,
  })),
}))

const mockMutate = vi.fn()

vi.mock('@/features/submissions', () => ({
  SubmissionPreview: vi.fn(({ submission }) => (
    <div data-testid="submission-preview">Preview: {submission.categoryName}</div>
  )),
  SubmissionPreviewSkeleton: vi.fn(() => (
    <div data-testid="submission-preview-skeleton">Loading...</div>
  )),
  useSubmissionPreview: vi.fn(() => ({
    data: {
      submission: {
        id: 'sub-123',
        mediaType: 'video',
        mediaUrl: null,
        bunnyVideoId: 'vid-456',
        thumbnailUrl: null,
        status: 'uploaded',
        submittedAt: '2026-01-29T00:00:00Z',
        categoryId: 'cat-789',
        categoryName: 'Best Short Film',
        categoryType: 'video',
      },
      libraryId: 'lib-123',
    },
    isLoading: false,
    error: null,
  })),
  useConfirmSubmission: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
  })),
}))

import { useSubmissionPreview, useConfirmSubmission } from '@/features/submissions'

const defaultSubmission = {
  id: 'sub-123',
  mediaType: 'video' as const,
  mediaUrl: null,
  bunnyVideoId: 'vid-456',
  thumbnailUrl: null,
  status: 'uploaded' as const,
  submittedAt: '2026-01-29T00:00:00Z',
  categoryId: 'cat-789',
  categoryName: 'Best Short Film',
  categoryType: 'video' as const,
}

describe('SubmissionPreviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mocks to default uploaded state (clearAllMocks doesn't reset mockReturnValue)
    vi.mocked(useSubmissionPreview).mockReturnValue({
      data: { submission: defaultSubmission, libraryId: 'lib-123' },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useSubmissionPreview>)
    vi.mocked(useConfirmSubmission).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useConfirmSubmission>)
  })

  const renderWithRouter = (submissionId = 'sub-123') => {
    return render(
      <MemoryRouter initialEntries={[`/participant/preview/${submissionId}`]}>
        <Routes>
          <Route
            path="/participant/preview/:submissionId"
            element={<SubmissionPreviewPage />}
          />
        </Routes>
      </MemoryRouter>
    )
  }

  describe('Rendering', () => {
    it('renders page title and category name', () => {
      renderWithRouter()

      expect(screen.getByText('Preview Submission')).toBeInTheDocument()
      expect(screen.getByText('Best Short Film')).toBeInTheDocument()
    })

    it('renders SubmissionPreview component', () => {
      renderWithRouter()

      expect(screen.getByTestId('submission-preview')).toBeInTheDocument()
      expect(screen.getByText('Preview: Best Short Film')).toBeInTheDocument()
    })

    it('renders Confirm and Replace buttons for uploaded status', () => {
      renderWithRouter()

      expect(
        screen.getByRole('button', { name: 'Confirm Submission' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Replace' })
      ).toBeInTheDocument()
    })

    it('shows media type label in card header', () => {
      renderWithRouter()

      expect(screen.getByText('Video Preview')).toBeInTheDocument()
    })
  })

  describe('Loading state', () => {
    it('shows skeleton while loading', () => {
      vi.mocked(useSubmissionPreview).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as ReturnType<typeof useSubmissionPreview>)

      renderWithRouter()

      expect(screen.getByTestId('submission-preview-skeleton')).toBeInTheDocument()
    })
  })

  describe('Error state', () => {
    it('shows error message when data fails to load', () => {
      vi.mocked(useSubmissionPreview).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed'),
      } as ReturnType<typeof useSubmissionPreview>)

      renderWithRouter()

      expect(
        screen.getByText('Submission not found. It may have been removed.')
      ).toBeInTheDocument()
    })

    it('shows back button in error state', async () => {
      vi.mocked(useSubmissionPreview).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed'),
      } as ReturnType<typeof useSubmissionPreview>)

      renderWithRouter()

      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: 'Back to Categories' }))

      expect(mockNavigate).toHaveBeenCalledWith('/participant/categories')
    })
  })

  describe('Confirm submission', () => {
    it('calls confirm mutation with correct params', async () => {
      renderWithRouter()

      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: 'Confirm Submission' }))

      expect(mockMutate).toHaveBeenCalledWith({
        submissionId: 'sub-123',
        participantId: 'participant-123',
        participantCode: 'ABC123',
      })
    })

    it('shows pending text while confirming', () => {
      vi.mocked(useConfirmSubmission).mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      } as unknown as ReturnType<typeof useConfirmSubmission>)

      renderWithRouter()

      expect(screen.getByText('Confirming...')).toBeInTheDocument()
    })

    it('disables confirm button while pending', () => {
      vi.mocked(useConfirmSubmission).mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      } as unknown as ReturnType<typeof useConfirmSubmission>)

      renderWithRouter()

      expect(screen.getByText('Confirming...').closest('button')).toBeDisabled()
    })
  })

  describe('Submitted state', () => {
    beforeEach(() => {
      vi.mocked(useSubmissionPreview).mockReturnValue({
        data: {
          submission: {
            id: 'sub-123',
            mediaType: 'video',
            mediaUrl: null,
            bunnyVideoId: 'vid-456',
            thumbnailUrl: null,
            status: 'submitted',
            submittedAt: '2026-01-29T00:00:00Z',
            categoryId: 'cat-789',
            categoryName: 'Best Short Film',
            categoryType: 'video',
          },
          libraryId: 'lib-123',
        },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSubmissionPreview>)
    })

    it('shows Submitted text', () => {
      renderWithRouter()

      expect(screen.getByText('Submitted!')).toBeInTheDocument()
    })

    it('does not show Confirm button', () => {
      renderWithRouter()

      expect(
        screen.queryByRole('button', { name: 'Confirm Submission' })
      ).not.toBeInTheDocument()
    })

    it('does not show Replace button', () => {
      renderWithRouter()

      expect(
        screen.queryByRole('button', { name: 'Replace' })
      ).not.toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('navigates to categories when back button clicked', async () => {
      renderWithRouter()

      const user = userEvent.setup()
      // Back button is the first icon-only button
      const buttons = screen.getAllByRole('button')
      await user.click(buttons[0])

      expect(mockNavigate).toHaveBeenCalledWith('/participant/categories')
    })

    it('navigates to submit page when Replace clicked', async () => {
      renderWithRouter()

      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: 'Replace' }))

      expect(mockNavigate).toHaveBeenCalledWith('/participant/submit/cat-789')
    })
  })
})
