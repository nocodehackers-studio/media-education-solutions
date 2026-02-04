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

function renderCard(category: ParticipantCategory, contestFinished?: boolean) {
  return render(
    <BrowserRouter>
      <ParticipantCategoryCard category={category} contestFinished={contestFinished} />
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
      expect(screen.getByText(/due/i)).toBeInTheDocument()
    })

    it('navigates to category detail on click', async () => {
      const user = userEvent.setup()
      renderCard(baseCategory)

      await user.click(screen.getByText('Best Documentary'))

      expect(mockNavigate).toHaveBeenCalledWith('/participant/category/cat-123', {
        state: { category: baseCategory, contestFinished: undefined, acceptingSubmissions: true },
      })
    })
  })

  describe('closed category', () => {
    const closedCategory: ParticipantCategory = {
      ...baseCategory,
      status: 'closed',
    }

    it('shows Closed badge', () => {
      renderCard(closedCategory)
      expect(screen.getByText('Closed')).toBeInTheDocument()
    })

    it('shows "Submissions closed" text', () => {
      renderCard(closedCategory)
      expect(screen.getByText(/submissions closed/i)).toBeInTheDocument()
    })

    it('has muted styling (opacity-60)', () => {
      const { container } = renderCard(closedCategory)
      const card = container.querySelector('[class*="opacity-60"]')
      expect(card).toBeInTheDocument()
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
        state: { category: submittedCategory, contestFinished: undefined, acceptingSubmissions: true },
      })
    })
  })

  describe('uploaded (pending) category', () => {
    const uploadedCategory: ParticipantCategory = {
      ...baseCategory,
      hasSubmitted: true,
      submissionStatus: 'uploaded',
      submissionId: 'sub-789',
    }

    it('shows Pending badge', () => {
      renderCard(uploadedCategory)
      expect(screen.getByText('Pending')).toBeInTheDocument()
    })
  })

  describe('finished contest with no submission', () => {
    const noSubmission: ParticipantCategory = {
      ...baseCategory,
      noSubmission: true,
    }

    it('shows No submission badge', () => {
      renderCard(noSubmission, true)
      expect(screen.getByText('No submission')).toBeInTheDocument()
    })

    it('has disabled styling', () => {
      const { container } = renderCard(noSubmission, true)
      const card = container.querySelector('[class*="pointer-events-none"]')
      expect(card).toBeInTheDocument()
    })
  })
})
