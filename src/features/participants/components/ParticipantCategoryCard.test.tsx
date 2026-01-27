/**
 * ParticipantCategoryCard Unit Tests
 * Tests category display states: published, closed, submitted
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
  hasSubmitted: false,
}

function renderCard(category: ParticipantCategory) {
  return render(
    <BrowserRouter>
      <ParticipantCategoryCard category={category} />
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

    it('displays video badge for video type', () => {
      renderCard(baseCategory)
      expect(screen.getByText('Video')).toBeInTheDocument()
    })

    it('displays photo badge for photo type', () => {
      renderCard({ ...baseCategory, type: 'photo' })
      expect(screen.getByText('Photo')).toBeInTheDocument()
    })
  })

  describe('published category (AC2)', () => {
    it('shows Submit button for published category without submission', () => {
      renderCard(baseCategory)
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
    })

    it('shows countdown timer', () => {
      renderCard(baseCategory)
      expect(screen.getByText(/due/i)).toBeInTheDocument()
    })

    it('navigates to submit page on Submit click', async () => {
      const user = userEvent.setup()
      renderCard(baseCategory)

      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(mockNavigate).toHaveBeenCalledWith('/participant/submit/cat-123')
    })
  })

  describe('closed category (AC4)', () => {
    const closedCategory: ParticipantCategory = {
      ...baseCategory,
      status: 'closed',
    }

    it('shows Closed button (disabled)', () => {
      renderCard(closedCategory)
      const button = screen.getByRole('button', { name: /closed/i })
      expect(button).toBeInTheDocument()
      expect(button).toBeDisabled()
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

  describe('submitted category (AC5)', () => {
    const submittedCategory: ParticipantCategory = {
      ...baseCategory,
      hasSubmitted: true,
    }

    it('shows Submitted badge', () => {
      renderCard(submittedCategory)
      expect(screen.getByText(/submitted/i)).toBeInTheDocument()
    })

    it('shows View/Edit button instead of Submit', () => {
      renderCard(submittedCategory)
      expect(screen.queryByRole('button', { name: /^submit$/i })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /view\/edit/i })).toBeInTheDocument()
    })

    it('navigates to submission page on View/Edit click', async () => {
      const user = userEvent.setup()
      renderCard(submittedCategory)

      await user.click(screen.getByRole('button', { name: /view\/edit/i }))

      expect(mockNavigate).toHaveBeenCalledWith('/participant/submission/cat-123')
    })
  })

  describe('closed + submitted category', () => {
    const closedSubmittedCategory: ParticipantCategory = {
      ...baseCategory,
      status: 'closed',
      hasSubmitted: true,
    }

    it('shows View button (not View/Edit) when closed but has submission', () => {
      renderCard(closedSubmittedCategory)
      expect(screen.getByRole('button', { name: /^view$/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /view\/edit/i })).not.toBeInTheDocument()
    })

    it('still shows Submitted badge', () => {
      renderCard(closedSubmittedCategory)
      expect(screen.getByText(/submitted/i)).toBeInTheDocument()
    })

    it('navigates to submission page on View click', async () => {
      const user = userEvent.setup()
      renderCard(closedSubmittedCategory)

      await user.click(screen.getByRole('button', { name: /^view$/i }))

      expect(mockNavigate).toHaveBeenCalledWith('/participant/submission/cat-123')
    })
  })

  describe('without description', () => {
    it('renders without description', () => {
      renderCard({ ...baseCategory, description: null })
      expect(screen.getByText('Best Documentary')).toBeInTheDocument()
      expect(screen.queryByText('Submit your best documentary')).not.toBeInTheDocument()
    })
  })
})
