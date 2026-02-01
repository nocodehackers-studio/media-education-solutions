// Story 4-6/4-7: Tests for SubmissionPreviewPage
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

const mockConfirmMutate = vi.fn()
const mockWithdrawMutate = vi.fn()

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
        categoryDeadline: '2026-12-31T23:59:59Z',
        categoryStatus: 'published',
        isLocked: false,
        contestStatus: null,
        review: null,
      },
      libraryId: 'lib-123',
    },
    isLoading: false,
    error: null,
  })),
  useConfirmSubmission: vi.fn(() => ({
    mutate: mockConfirmMutate,
    isPending: false,
  })),
  useWithdrawSubmission: vi.fn(() => ({
    mutate: mockWithdrawMutate,
    isPending: false,
  })),
}))

vi.mock('@/features/participants', () => ({
  ParticipantFeedbackSection: vi.fn(({ feedback }) => (
    <div data-testid="participant-feedback-section">
      {feedback.ratingTierLabel}: {feedback.rating} out of 10
    </div>
  )),
}))

import {
  useSubmissionPreview,
  useConfirmSubmission,
  useWithdrawSubmission,
} from '@/features/submissions'

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
  categoryDeadline: '2026-12-31T23:59:59Z',
  categoryStatus: 'published',
  isLocked: false,
  contestStatus: null as string | null,
  review: null as { rating: number; ratingTierLabel: string; feedback: string } | null,
}

describe('SubmissionPreviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useSubmissionPreview).mockReturnValue({
      data: { submission: defaultSubmission, libraryId: 'lib-123' },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useSubmissionPreview>)
    vi.mocked(useConfirmSubmission).mockReturnValue({
      mutate: mockConfirmMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useConfirmSubmission>)
    vi.mocked(useWithdrawSubmission).mockReturnValue({
      mutate: mockWithdrawMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useWithdrawSubmission>)
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

    it('renders Confirm, Replace, and Withdraw buttons for uploaded status', () => {
      renderWithRouter()

      expect(
        screen.getByRole('button', { name: 'Confirm Submission' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Replace' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Withdraw' })
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

      expect(mockConfirmMutate).toHaveBeenCalledWith({
        submissionId: 'sub-123',
        participantId: 'participant-123',
        participantCode: 'ABC123',
      })
    })

    it('shows pending text while confirming', () => {
      vi.mocked(useConfirmSubmission).mockReturnValue({
        mutate: mockConfirmMutate,
        isPending: true,
      } as unknown as ReturnType<typeof useConfirmSubmission>)

      renderWithRouter()

      expect(screen.getByText('Confirming...')).toBeInTheDocument()
    })

    it('disables confirm button while pending', () => {
      vi.mocked(useConfirmSubmission).mockReturnValue({
        mutate: mockConfirmMutate,
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
          submission: { ...defaultSubmission, status: 'submitted' },
          libraryId: 'lib-123',
        },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSubmissionPreview>)
    })

    it('shows Submitted text', () => {
      renderWithRouter()

      expect(screen.getByText('Submitted')).toBeInTheDocument()
    })

    it('does not show Confirm button', () => {
      renderWithRouter()

      expect(
        screen.queryByRole('button', { name: 'Confirm Submission' })
      ).not.toBeInTheDocument()
    })

    it('shows Replace button for submitted status', () => {
      renderWithRouter()

      expect(
        screen.getByRole('button', { name: 'Replace' })
      ).toBeInTheDocument()
    })

    it('shows Withdraw button for submitted status', () => {
      renderWithRouter()

      expect(
        screen.getByRole('button', { name: 'Withdraw' })
      ).toBeInTheDocument()
    })
  })

  describe('Withdraw submission', () => {
    it('opens confirmation dialog when Withdraw clicked', async () => {
      renderWithRouter()

      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: 'Withdraw' }))

      expect(screen.getByText('Withdraw submission?')).toBeInTheDocument()
      expect(
        screen.getByText(
          'This will remove your submission. You can submit again before the deadline.'
        )
      ).toBeInTheDocument()
    })

    it('calls withdraw mutation when confirmed', async () => {
      renderWithRouter()

      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: 'Withdraw' }))
      // Click the confirm action in the dialog
      const dialogButtons = screen.getAllByRole('button', { name: 'Withdraw' })
      // The dialog action button is the second "Withdraw" button
      await user.click(dialogButtons[dialogButtons.length - 1])

      expect(mockWithdrawMutate).toHaveBeenCalledWith({
        submissionId: 'sub-123',
        participantId: 'participant-123',
        participantCode: 'ABC123',
      })
    })

    it('closes dialog when Cancel clicked', async () => {
      renderWithRouter()

      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: 'Withdraw' }))
      expect(screen.getByText('Withdraw submission?')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(screen.queryByText('Withdraw submission?')).not.toBeInTheDocument()
    })
  })

  describe('Locked state', () => {
    it('shows deadline locked message when isLocked is true', () => {
      vi.mocked(useSubmissionPreview).mockReturnValue({
        data: {
          submission: {
            ...defaultSubmission,
            status: 'submitted',
            isLocked: true,
            categoryStatus: 'published',
          },
          libraryId: 'lib-123',
        },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSubmissionPreview>)

      renderWithRouter()

      expect(
        screen.getByText(/Deadline passed/)
      ).toBeInTheDocument()
    })

    it('shows category closed message when category is closed', () => {
      vi.mocked(useSubmissionPreview).mockReturnValue({
        data: {
          submission: {
            ...defaultSubmission,
            status: 'submitted',
            isLocked: true,
            categoryStatus: 'closed',
          },
          libraryId: 'lib-123',
        },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSubmissionPreview>)

      renderWithRouter()

      expect(
        screen.getByText('This category is no longer accepting changes')
      ).toBeInTheDocument()
    })

    it('hides Replace and Withdraw buttons when locked', () => {
      vi.mocked(useSubmissionPreview).mockReturnValue({
        data: {
          submission: {
            ...defaultSubmission,
            status: 'submitted',
            isLocked: true,
          },
          libraryId: 'lib-123',
        },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSubmissionPreview>)

      renderWithRouter()

      expect(
        screen.queryByRole('button', { name: 'Replace' })
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Withdraw' })
      ).not.toBeInTheDocument()
    })

    it('hides Confirm button when locked', () => {
      vi.mocked(useSubmissionPreview).mockReturnValue({
        data: {
          submission: {
            ...defaultSubmission,
            status: 'uploaded',
            isLocked: true,
          },
          libraryId: 'lib-123',
        },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSubmissionPreview>)

      renderWithRouter()

      expect(
        screen.queryByRole('button', { name: 'Confirm Submission' })
      ).not.toBeInTheDocument()
    })
  })

  // Story 6-7: Finished contest feedback behavior
  describe('Finished contest state', () => {
    const reviewData = {
      rating: 7,
      ratingTierLabel: 'Advanced Producer',
      feedback: 'Great cinematography.',
    }

    it('shows feedback section when contest is finished and review exists', () => {
      vi.mocked(useSubmissionPreview).mockReturnValue({
        data: {
          submission: {
            ...defaultSubmission,
            status: 'submitted',
            contestStatus: 'finished',
            review: reviewData,
          },
          libraryId: 'lib-123',
        },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSubmissionPreview>)

      renderWithRouter()

      expect(screen.getByTestId('participant-feedback-section')).toBeInTheDocument()
      expect(screen.getByText(/Advanced Producer/)).toBeInTheDocument()
    })

    it('shows "not reviewed yet" when contest is finished but no review', () => {
      vi.mocked(useSubmissionPreview).mockReturnValue({
        data: {
          submission: {
            ...defaultSubmission,
            status: 'submitted',
            contestStatus: 'finished',
            review: null,
          },
          libraryId: 'lib-123',
        },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSubmissionPreview>)

      renderWithRouter()

      expect(
        screen.getByText('Your submission has not been reviewed yet.')
      ).toBeInTheDocument()
    })

    it('hides action buttons when contest is finished', () => {
      vi.mocked(useSubmissionPreview).mockReturnValue({
        data: {
          submission: {
            ...defaultSubmission,
            status: 'submitted',
            contestStatus: 'finished',
            review: reviewData,
          },
          libraryId: 'lib-123',
        },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSubmissionPreview>)

      renderWithRouter()

      expect(screen.queryByRole('button', { name: 'Confirm Submission' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Replace' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Withdraw' })).not.toBeInTheDocument()
    })

    it('hides lock message when contest is finished', () => {
      vi.mocked(useSubmissionPreview).mockReturnValue({
        data: {
          submission: {
            ...defaultSubmission,
            status: 'submitted',
            isLocked: true,
            contestStatus: 'finished',
            review: reviewData,
          },
          libraryId: 'lib-123',
        },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSubmissionPreview>)

      renderWithRouter()

      expect(screen.queryByText(/Deadline passed/)).not.toBeInTheDocument()
      expect(screen.queryByText(/no longer accepting/)).not.toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('navigates to categories when back button clicked', async () => {
      renderWithRouter()

      const user = userEvent.setup()
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
