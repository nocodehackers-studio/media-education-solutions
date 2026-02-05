/**
 * ParticipantCategoriesPage Unit Tests
 * Tests loading, error, empty, and success states
 * Redesigned: Two-step flow with contest landing and division selection
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ParticipantCategoriesPage } from './ParticipantCategoriesPage'
import { type ParticipantCategory, type ParticipantDivision, type ContestInfo } from '@/features/participants'

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
}

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
  data: {
    categories: ParticipantCategory[]
    divisions: ParticipantDivision[]
    contest: ContestInfo | null
    contestStatus: string | null
  } | undefined
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

const baseCategory: ParticipantCategory = {
  id: 'cat-1',
  name: 'Best Video',
  type: 'video',
  deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  status: 'published',
  description: 'Submit your best video',
  rules: null,
  hasSubmitted: false,
  submissionStatus: null,
  submissionId: null,
}

const baseContest: ContestInfo = {
  name: 'Best Media Contest',
  description: 'A great contest for media students',
  rules: 'All entries must be original.',
  coverImageUrl: null,
  logoUrl: null,
}

describe('ParticipantCategoriesPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockEndSession.mockClear()
    mockExtendSession.mockClear()
    mockRefetch.mockClear()
    currentMockSession = mockSession
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
        data: { categories: [], divisions: [], contest: baseContest, contestStatus: null },
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

  describe('step 1 — contest landing', () => {
    const divisions: ParticipantDivision[] = [
      { id: 'd-1', name: 'Elementary', displayOrder: 0, categories: [baseCategory] },
      {
        id: 'd-2',
        name: 'Middle School',
        displayOrder: 1,
        categories: [{ ...baseCategory, id: 'cat-2', name: 'Best Photo', type: 'photo' }],
      },
    ]

    beforeEach(() => {
      mockCategoriesData = {
        data: {
          categories: [baseCategory, { ...baseCategory, id: 'cat-2', name: 'Best Photo', type: 'photo' }],
          divisions,
          contest: baseContest,
          contestStatus: null,
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      }
    })

    it('displays contest name', () => {
      renderPage()
      expect(screen.getByText('Best Media Contest')).toBeInTheDocument()
    })

    it('displays contest description', () => {
      renderPage()
      expect(screen.getByText('A great contest for media students')).toBeInTheDocument()
    })

    it('shows division cards', () => {
      renderPage()
      expect(screen.getByText('Elementary')).toBeInTheDocument()
      expect(screen.getByText('Middle School')).toBeInTheDocument()
    })

    it('shows user menu button', () => {
      renderPage()
      // User menu shows participant code as button text
      expect(screen.getByRole('button', { name: /ABCD1234/i })).toBeInTheDocument()
    })
  })

  describe('single division auto-select', () => {
    const singleDivision: ParticipantDivision[] = [
      { id: 'd-1', name: 'All Categories', displayOrder: 0, categories: [baseCategory] },
    ]

    beforeEach(() => {
      mockCategoriesData = {
        data: {
          categories: [baseCategory],
          divisions: singleDivision,
          contest: baseContest,
          contestStatus: null,
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      }
    })

    it('auto-selects single division and shows categories directly', () => {
      renderPage()
      // Should see category list directly without division selection step
      expect(screen.getByText('Best Video')).toBeInTheDocument()
      // Single division doesn't show division name as header, just shows categories
      expect(screen.getByText(/categories/i)).toBeInTheDocument()
    })
  })

  describe('logout', () => {
    const divisions: ParticipantDivision[] = [
      { id: 'd-1', name: 'Elementary', displayOrder: 0, categories: [baseCategory] },
    ]

    beforeEach(() => {
      mockCategoriesData = {
        data: { categories: [baseCategory], divisions, contest: baseContest, contestStatus: null },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      }
    })

    it('calls endSession and navigates to / on logout', async () => {
      const user = userEvent.setup()
      renderPage()

      // Click user menu trigger (shows participant code)
      await user.click(screen.getByRole('button', { name: /ABCD1234/i }))
      // Click Log Out in the popover
      await user.click(screen.getByRole('button', { name: /log out/i }))

      expect(mockEndSession).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })
  })

  describe('finished contest', () => {
    const finishedCategories: ParticipantCategory[] = [
      {
        ...baseCategory,
        status: 'closed',
        hasSubmitted: true,
        submissionStatus: 'submitted',
        submissionId: 'sub-001',
      },
    ]

    beforeEach(() => {
      mockCategoriesData = {
        data: {
          categories: finishedCategories,
          divisions: [{ id: 'd-1', name: 'All', displayOrder: 0, categories: finishedCategories }],
          contest: baseContest,
          contestStatus: 'finished',
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      }
    })

    it('shows finished contest banner', () => {
      renderPage()
      expect(
        screen.getByText(/this contest has ended/i)
      ).toBeInTheDocument()
    })
  })

  describe('null session', () => {
    beforeEach(() => {
      currentMockSession = null
      mockCategoriesData = {
        data: { categories: [], divisions: [], contest: null, contestStatus: null },
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
