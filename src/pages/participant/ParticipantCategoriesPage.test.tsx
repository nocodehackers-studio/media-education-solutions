/**
 * ParticipantCategoriesPage Unit Tests
 * Tests loading, error, empty, and success states
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ParticipantCategoriesPage } from './ParticipantCategoriesPage'
import { type ParticipantCategory } from '@/features/participants'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock useParticipantSession
const mockEndSession = vi.fn()
const mockExtendSession = vi.fn()
const mockSession = {
  participantId: 'p-123',
  code: 'ABCD1234',
  contestId: 'c-456',
  contestCode: 'CNT001',
  contestName: 'Best Media Contest',
  lastActivity: Date.now(),
  name: 'John Doe',
}

// F11: Make session configurable for null session test
let currentMockSession: typeof mockSession | null = mockSession

vi.mock('@/contexts', () => ({
  useParticipantSession: () => ({
    session: currentMockSession,
    showWarning: false,
    endSession: mockEndSession,
    extendSession: mockExtendSession,
  }),
}))

// Mock useParticipantCategories
const mockRefetch = vi.fn()
let mockCategoriesData: {
  data: ParticipantCategory[] | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

vi.mock('@/features/participants', async () => {
  const actual = await vi.importActual('@/features/participants')
  return {
    ...actual,
    useParticipantCategories: () => mockCategoriesData,
  }
})

function renderPage() {
  return render(
    <BrowserRouter>
      <ParticipantCategoriesPage />
    </BrowserRouter>
  )
}

describe('ParticipantCategoriesPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockEndSession.mockClear()
    mockExtendSession.mockClear()
    mockRefetch.mockClear()
    currentMockSession = mockSession // Reset to valid session
  })

  describe('loading state', () => {
    beforeEach(() => {
      mockCategoriesData = {
        data: undefined,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      }
    })

    it('shows loading skeletons', () => {
      const { container } = renderPage()
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('error state', () => {
    beforeEach(() => {
      mockCategoriesData = {
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        refetch: mockRefetch,
      }
    })

    it('shows error message', () => {
      renderPage()
      expect(screen.getByText(/failed to load categories/i)).toBeInTheDocument()
    })

    it('shows retry button', () => {
      renderPage()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })

    it('calls refetch on retry button click', async () => {
      const user = userEvent.setup()
      renderPage()

      await user.click(screen.getByRole('button', { name: /try again/i }))

      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  describe('empty state', () => {
    beforeEach(() => {
      mockCategoriesData = {
        data: [],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      }
    })

    it('shows empty state message', () => {
      renderPage()
      expect(
        screen.getByText(/no categories are currently accepting submissions/i)
      ).toBeInTheDocument()
    })
  })

  describe('success state', () => {
    const categories: ParticipantCategory[] = [
      {
        id: 'cat-1',
        name: 'Best Video',
        type: 'video',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'published',
        description: 'Submit your best video',
        hasSubmitted: false,
      },
      {
        id: 'cat-2',
        name: 'Best Photo',
        type: 'photo',
        deadline: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        status: 'closed',
        description: null,
        hasSubmitted: true,
      },
    ]

    beforeEach(() => {
      mockCategoriesData = {
        data: categories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      }
    })

    it('displays contest name in header', () => {
      renderPage()
      expect(screen.getByText('Best Media Contest')).toBeInTheDocument()
    })

    it('displays participant name in header', () => {
      renderPage()
      expect(screen.getByText(/welcome, john doe/i)).toBeInTheDocument()
    })

    it('renders category cards', () => {
      renderPage()
      expect(screen.getByText('Best Video')).toBeInTheDocument()
      expect(screen.getByText('Best Photo')).toBeInTheDocument()
    })

    it('shows exit button', () => {
      renderPage()
      expect(screen.getByRole('button', { name: /exit/i })).toBeInTheDocument()
    })
  })

  describe('logout', () => {
    beforeEach(() => {
      mockCategoriesData = {
        data: [],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      }
    })

    it('calls endSession and navigates to /enter on logout', async () => {
      const user = userEvent.setup()
      renderPage()

      await user.click(screen.getByRole('button', { name: /exit/i }))

      expect(mockEndSession).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/enter', { replace: true })
    })
  })

  // F11: Test null session handling
  describe('null session', () => {
    beforeEach(() => {
      currentMockSession = null
      mockCategoriesData = {
        data: [],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      }
    })

    it('renders nothing when session is null', () => {
      const { container } = renderPage()
      expect(container.firstChild).toBeNull()
    })
  })
})
