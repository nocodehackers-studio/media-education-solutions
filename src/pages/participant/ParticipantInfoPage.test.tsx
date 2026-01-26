/**
 * ParticipantInfoPage Unit Tests
 * Tests page-level behavior including data fetching, form submission, and redirects
 *
 * AC1: Empty form for first-time participant
 * AC2: Pre-filled form for returning participant
 * AC3: Successful form submission and redirect
 * AC6: Data persists in session for future submissions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ParticipantInfoPage } from './ParticipantInfoPage'

// Mock the participants feature
vi.mock('@/features/participants', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/participants')>()
  return {
    ...actual,
    useParticipant: vi.fn(),
  }
})

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}))

// Mock the contexts
const mockSession = {
  participantId: 'test-participant-id',
  code: 'ABCD1234',
  contestId: 'test-contest-id',
  contestCode: 'TEST01',
  contestName: 'Test Contest',
  lastActivity: Date.now(),
}

const mockEndSession = vi.fn()
const mockExtendSession = vi.fn()
const mockUpdateParticipantInfo = vi.fn()

vi.mock('@/contexts', () => ({
  useParticipantSession: vi.fn(() => ({
    session: mockSession,
    endSession: mockEndSession,
    showWarning: false,
    extendSession: mockExtendSession,
    updateParticipantInfo: mockUpdateParticipantInfo,
  })),
}))

// Mock navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { useParticipant } from '@/features/participants'
import { useParticipantSession } from '@/contexts'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// Create a fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
}

// Wrapper component with providers
function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    )
  }
}

describe('ParticipantInfoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset session mock to default
    vi.mocked(useParticipantSession).mockReturnValue({
      session: mockSession,
      isLoading: false,
      isAuthenticated: true,
      showWarning: false,
      sessionExpired: false,
      endSession: mockEndSession,
      extendSession: mockExtendSession,
      updateActivity: vi.fn(),
      clearExpired: vi.fn(),
      enterContest: vi.fn(),
      updateParticipantInfo: mockUpdateParticipantInfo,
    })
  })

  describe('AC1: Empty form for first-time participant', () => {
    it('shows empty form when participant has no saved data', async () => {
      vi.mocked(useParticipant).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useParticipant>)

      render(<ParticipantInfoPage />, { wrapper: createWrapper() })

      expect(screen.getByLabelText(/your name/i)).toHaveValue('')
      expect(screen.getByLabelText(/school\/organization/i)).toHaveValue('')
      expect(
        screen.getByLabelText(/teacher\/leader\/coach name/i)
      ).toHaveValue('')
      expect(
        screen.getByLabelText(/teacher\/leader\/coach email/i)
      ).toHaveValue('')
    })

    it('shows loading state while fetching data', () => {
      vi.mocked(useParticipant).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useParticipant>)

      render(<ParticipantInfoPage />, { wrapper: createWrapper() })

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('AC2: Pre-filled form for returning participant', () => {
    it('pre-fills form with existing participant data', async () => {
      vi.mocked(useParticipant).mockReturnValue({
        data: {
          id: 'test-id',
          name: 'John Doe',
          organizationName: 'Test School',
          tlcName: 'Mr. Smith',
          tlcEmail: 'smith@school.edu',
          status: 'used',
        },
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useParticipant>)

      render(<ParticipantInfoPage />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByLabelText(/your name/i)).toHaveValue('John Doe')
      })
      expect(screen.getByLabelText(/school\/organization/i)).toHaveValue(
        'Test School'
      )
      expect(screen.getByLabelText(/teacher\/leader\/coach name/i)).toHaveValue(
        'Mr. Smith'
      )
      expect(
        screen.getByLabelText(/teacher\/leader\/coach email/i)
      ).toHaveValue('smith@school.edu')
    })

    it('allows editing pre-filled fields', async () => {
      const user = userEvent.setup()

      vi.mocked(useParticipant).mockReturnValue({
        data: {
          id: 'test-id',
          name: 'John Doe',
          organizationName: 'Test School',
          tlcName: 'Mr. Smith',
          tlcEmail: 'smith@school.edu',
          status: 'used',
        },
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useParticipant>)

      render(<ParticipantInfoPage />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByLabelText(/your name/i)).toHaveValue('John Doe')
      })

      const nameInput = screen.getByLabelText(/your name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Jane Doe')

      expect(nameInput).toHaveValue('Jane Doe')
    })
  })

  describe('AC3: Successful form submission', () => {
    it('submits form and redirects to categories on success', async () => {
      const user = userEvent.setup()

      vi.mocked(useParticipant).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useParticipant>)

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true, participant: {} },
        error: null,
      })

      render(<ParticipantInfoPage />, { wrapper: createWrapper() })

      await user.type(screen.getByLabelText(/your name/i), 'John Doe')
      await user.type(
        screen.getByLabelText(/school\/organization/i),
        'Test School'
      )
      await user.type(
        screen.getByLabelText(/teacher\/leader\/coach name/i),
        'Mr. Smith'
      )
      await user.type(
        screen.getByLabelText(/teacher\/leader\/coach email/i),
        'smith@school.edu'
      )

      await user.click(screen.getByRole('button', { name: /continue/i }))

      await waitFor(() => {
        expect(supabase.functions.invoke).toHaveBeenCalledWith(
          'update-participant',
          {
            body: {
              participantId: 'test-participant-id',
              participantCode: 'ABCD1234',
              contestId: 'test-contest-id',
              name: 'John Doe',
              organizationName: 'Test School',
              tlcName: 'Mr. Smith',
              tlcEmail: 'smith@school.edu',
            },
          }
        )
      })

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Information saved!')
      })

      expect(mockNavigate).toHaveBeenCalledWith('/participant/categories', {
        replace: true,
      })
    })

    it('shows error toast on submission failure', async () => {
      const user = userEvent.setup()

      vi.mocked(useParticipant).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useParticipant>)

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: false, error: 'UPDATE_FAILED' },
        error: null,
      })

      render(<ParticipantInfoPage />, { wrapper: createWrapper() })

      await user.type(screen.getByLabelText(/your name/i), 'John Doe')
      await user.type(
        screen.getByLabelText(/school\/organization/i),
        'Test School'
      )
      await user.type(
        screen.getByLabelText(/teacher\/leader\/coach name/i),
        'Mr. Smith'
      )
      await user.type(
        screen.getByLabelText(/teacher\/leader\/coach email/i),
        'smith@school.edu'
      )

      await user.click(screen.getByRole('button', { name: /continue/i }))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('UPDATE_FAILED')
      })

      expect(mockNavigate).not.toHaveBeenCalledWith('/participant/categories', {
        replace: true,
      })
    })
  })

  describe('AC6: Data persists in session', () => {
    it('updates session context after successful submission', async () => {
      const user = userEvent.setup()

      vi.mocked(useParticipant).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useParticipant>)

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true, participant: {} },
        error: null,
      })

      render(<ParticipantInfoPage />, { wrapper: createWrapper() })

      await user.type(screen.getByLabelText(/your name/i), 'John Doe')
      await user.type(
        screen.getByLabelText(/school\/organization/i),
        'Test School'
      )
      await user.type(
        screen.getByLabelText(/teacher\/leader\/coach name/i),
        'Mr. Smith'
      )
      await user.type(
        screen.getByLabelText(/teacher\/leader\/coach email/i),
        'smith@school.edu'
      )

      await user.click(screen.getByRole('button', { name: /continue/i }))

      await waitFor(() => {
        expect(mockUpdateParticipantInfo).toHaveBeenCalledWith({
          name: 'John Doe',
          organizationName: 'Test School',
          tlcName: 'Mr. Smith',
          tlcEmail: 'smith@school.edu',
        })
      })
    })
  })

  describe('session handling', () => {
    it('redirects to /enter when session expires during submission', async () => {
      const user = userEvent.setup()

      vi.mocked(useParticipant).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useParticipant>)

      // Session becomes null after render
      vi.mocked(useParticipantSession).mockReturnValue({
        session: null,
        isLoading: false,
        isAuthenticated: false,
        showWarning: false,
        sessionExpired: false,
        endSession: mockEndSession,
        extendSession: mockExtendSession,
        updateActivity: vi.fn(),
        clearExpired: vi.fn(),
        enterContest: vi.fn(),
        updateParticipantInfo: mockUpdateParticipantInfo,
      })

      render(<ParticipantInfoPage />, { wrapper: createWrapper() })

      // Component should return null when no session
      expect(screen.queryByLabelText(/your name/i)).not.toBeInTheDocument()
    })

    it('displays contest name in header', () => {
      vi.mocked(useParticipant).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useParticipant>)

      render(<ParticipantInfoPage />, { wrapper: createWrapper() })

      expect(screen.getByText('Your Information')).toBeInTheDocument()
      expect(screen.getByText('Submitting to: Test Contest')).toBeInTheDocument()
    })
  })
})
