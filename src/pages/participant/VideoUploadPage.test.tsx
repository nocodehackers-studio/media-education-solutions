// Story 4-4: Tests for VideoUploadPage
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { VideoUploadPage } from './VideoUploadPage'

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
    isLoading: false,
    isAuthenticated: true,
    showWarning: false,
    sessionExpired: false,
  })),
}))

vi.mock('@/features/submissions', () => ({
  VideoUploadForm: vi.fn(({ onUploadComplete }) => (
    <div data-testid="video-upload-form">
      <button onClick={() => onUploadComplete('submission-789')}>
        Mock Complete Upload
      </button>
    </div>
  )),
}))

import { useParticipantSession } from '@/contexts'

describe('VideoUploadPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderWithRouter = (categoryId = 'category-123') => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/participant/submit/${categoryId}`]}>
          <Routes>
            <Route
              path="/participant/submit/:categoryId"
              element={<VideoUploadPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )
  }

  describe('Rendering', () => {
    it('renders page title and description', () => {
      renderWithRouter()

      expect(screen.getByText('Upload Video')).toBeInTheDocument()
      expect(screen.getByText('Submit your video entry')).toBeInTheDocument()
    })

    it('renders back button', () => {
      renderWithRouter()

      // Back button is the first button with ArrowLeft icon
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('renders VideoUploadForm', () => {
      renderWithRouter()

      expect(screen.getByTestId('video-upload-form')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('navigates back to categories when back button clicked', async () => {
      renderWithRouter()

      const user = userEvent.setup()
      const backButton = screen.getAllByRole('button')[0]
      await user.click(backButton)

      expect(mockNavigate).toHaveBeenCalledWith('/participant/categories')
    })

    it('navigates to preview page on upload complete', async () => {
      renderWithRouter()

      const user = userEvent.setup()
      await user.click(screen.getByText('Mock Complete Upload'))

      expect(mockNavigate).toHaveBeenCalledWith('/participant/preview/submission-789')
    })
  })

  describe('Session handling', () => {
    it('redirects to / when no session', () => {
      vi.mocked(useParticipantSession).mockReturnValue({
        session: null,
        isLoading: false,
        isAuthenticated: false,
        showWarning: false,
        sessionExpired: false,
        enterContest: vi.fn(),
        endSession: vi.fn(),
        updateActivity: vi.fn(),
        extendSession: vi.fn(),
        clearExpired: vi.fn(),
      })

      renderWithRouter()

      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })
  })
})
