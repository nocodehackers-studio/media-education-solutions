/**
 * ParticipantCategoryCard Unit Tests
 * Tests category display states: published, closed, submitted
 * Redesigned: Cards are fully clickable, navigate to category detail page
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ParticipantCategoryCard, type ParticipantCategory } from './ParticipantCategoryCard'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock useParticipantSession to provide timezone context
vi.mock('@/contexts', () => ({
  useParticipantSession: () => ({
    session: {
      contestTimezone: 'America/New_York',
      participantId: 'participant-123',
      code: 'TEST1234',
      contestId: 'contest-123',
    },
  }),
}))

const baseCategory: ParticipantCategory = {
  id: 'cat-123',
  name: 'Best Documentary',
  type: 'video',
  deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  status: 'published',
  description: 'Submit your best documentary',
  rules: null,
  hasSubmitted: false,
  submissionStatus: null,
  submissionId: null,
}

function renderCard(category: ParticipantCategory, contestEnded?: boolean, acceptingSubmissions?: boolean) {
  return render(
    <BrowserRouter>
      <ParticipantCategoryCard category={category} contestEnded={contestEnded} acceptingSubmissions={acceptingSubmissions} />
    </BrowserRouter>
  )
}

describe('ParticipantCategoryCard', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  describe('basic rendering', () => {
    it('displays category name', () => {
      renderCard(baseCategory)
      expect(screen.getByText('Best Documentary')).toBeInTheDocument()
    })

    it('displays category description', () => {
      renderCard(baseCategory)
      expect(screen.getByText('Submit your best documentary')).toBeInTheDocument()
    })

    it('renders without description', () => {
      renderCard({ ...baseCategory, description: null })
      expect(screen.getByText('Best Documentary')).toBeInTheDocument()
      expect(screen.queryByText('Submit your best documentary')).not.toBeInTheDocument()
    })
  })

  describe('published category', () => {
    it('shows countdown timer', () => {
      renderCard(baseCategory)
      expect(screen.getByText(/\d+h \d+m \d+s/)).toBeInTheDocument()
    })

    it('navigates to category detail on click', async () => {
      const user = userEvent.setup()
      renderCard(baseCategory)

      await user.click(screen.getByText('Best Documentary'))

      expect(mockNavigate).toHaveBeenCalledWith('/participant/category/cat-123', {
        state: { category: baseCategory, contestEnded: undefined, acceptingSubmissions: true },
      })
    })
  })

  describe('closed category', () => {
    const closedCategory: ParticipantCategory = {
      ...baseCategory,
      status: 'closed',
    }

    it('shows "Submissions closed" badge', () => {
      renderCard(closedCategory)
      const matches = screen.getAllByText('Submissions closed')
      expect(matches.length).toBeGreaterThanOrEqual(1)
    })

    it('has muted styling (opacity-60)', () => {
      const { container } = renderCard(closedCategory)
      const card = container.querySelector('[class*="opacity-60"]')
      expect(card).toBeInTheDocument()
    })

    it('navigates on click (not blocked)', async () => {
      const user = userEvent.setup()
      renderCard(closedCategory)
      await user.click(screen.getByText('Best Documentary'))
      expect(mockNavigate).toHaveBeenCalled()
    })
  })

  describe('submitted category', () => {
    const submittedCategory: ParticipantCategory = {
      ...baseCategory,
      hasSubmitted: true,
      submissionStatus: 'submitted',
      submissionId: 'sub-456',
    }

    it('shows Submitted badge', () => {
      renderCard(submittedCategory)
      expect(screen.getByText('Submitted')).toBeInTheDocument()
    })

    it('navigates to category detail on click', async () => {
      const user = userEvent.setup()
      renderCard(submittedCategory)

      await user.click(screen.getByText('Best Documentary'))

      expect(mockNavigate).toHaveBeenCalledWith('/participant/category/cat-123', {
        state: { category: submittedCategory, contestEnded: undefined, acceptingSubmissions: true },
      })
    })
  })

  describe('uploaded category (no pending badge)', () => {
    const uploadedCategory: ParticipantCategory = {
      ...baseCategory,
      hasSubmitted: true,
      submissionStatus: 'uploaded',
      submissionId: 'sub-789',
    }

    it('does not show any status badge for uploaded state', () => {
      renderCard(uploadedCategory)
      expect(screen.queryByText('Pending')).not.toBeInTheDocument()
      expect(screen.queryByText('Submitted')).not.toBeInTheDocument()
    })
  })

  describe('contest ended with submission', () => {
    const endedWithSubmission: ParticipantCategory = {
      ...baseCategory,
      status: 'closed' as const,
      hasSubmitted: true,
      submissionStatus: 'submitted' as const,
      submissionId: 'sub-001',
    }

    it('shows "Submission received" badge', () => {
      renderCard(endedWithSubmission, true, false)
      expect(screen.getByText('Submission received')).toBeInTheDocument()
    })

    it('navigates on click', async () => {
      const user = userEvent.setup()
      renderCard(endedWithSubmission, true, false)
      await user.click(screen.getByText('Best Documentary'))
      expect(mockNavigate).toHaveBeenCalled()
    })
  })

  describe('contest ended without submission', () => {
    const endedNoSubmission: ParticipantCategory = {
      ...baseCategory,
      status: 'closed' as const,
      noSubmission: true,
    }

    it('shows "Submissions closed" badge', () => {
      renderCard(endedNoSubmission, true, false)
      expect(screen.getByText('Submissions closed')).toBeInTheDocument()
    })

    it('has opacity-60 styling', () => {
      const { container } = renderCard(endedNoSubmission, true, false)
      const card = container.querySelector('[class*="opacity-60"]')
      expect(card).toBeInTheDocument()
    })

    it('navigates on click (not blocked)', async () => {
      const user = userEvent.setup()
      renderCard(endedNoSubmission, true, false)
      await user.click(screen.getByText('Best Documentary'))
      expect(mockNavigate).toHaveBeenCalled()
    })
  })
})
