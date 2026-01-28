// Story 4-5: Tests for SubmitPage wrapper component
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SubmitPage } from './SubmitPage'

// Mock session
const mockSession = {
  contestId: 'contest-123',
  participantId: 'participant-456',
  code: 'ABC123',
}

vi.mock('@/contexts', () => ({
  useParticipantSession: vi.fn(() => ({
    session: mockSession,
  })),
}))

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}))

// Mock VideoUploadPage and PhotoUploadPage
vi.mock('./VideoUploadPage', () => ({
  VideoUploadPage: () => <div data-testid="video-upload-page">Video Upload</div>,
}))

vi.mock('./PhotoUploadPage', () => ({
  PhotoUploadPage: () => <div data-testid="photo-upload-page">Photo Upload</div>,
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import { useParticipantSession } from '@/contexts'
import { supabase } from '@/lib/supabase'

describe('SubmitPage', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    vi.mocked(useParticipantSession).mockReturnValue({
      session: mockSession,
    } as ReturnType<typeof useParticipantSession>)
  })

  const renderWithProviders = (categoryId = 'category-123') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/participant/submit/${categoryId}`]}>
          <Routes>
            <Route path="/participant/submit/:categoryId" element={<SubmitPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )
  }

  it('shows loading skeleton while fetching category type', () => {
    // Mock pending query
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockReturnValue(new Promise(() => {})), // Never resolves
        }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    renderWithProviders()

    // Should show loading skeleton (via class)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders VideoUploadPage for video category', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { type: 'video' },
            error: null,
          }),
        }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByTestId('video-upload-page')).toBeInTheDocument()
    })
  })

  it('renders PhotoUploadPage for photo category', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { type: 'photo' },
            error: null,
          }),
        }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByTestId('photo-upload-page')).toBeInTheDocument()
    })
  })

  it('shows error message when category fetch fails', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
          }),
        }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    renderWithProviders()

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load category. Please try again.')
      ).toBeInTheDocument()
    })
  })

  it('redirects to /enter when no session', () => {
    vi.mocked(useParticipantSession).mockReturnValue({
      session: null,
    } as ReturnType<typeof useParticipantSession>)

    renderWithProviders()

    expect(mockNavigate).toHaveBeenCalledWith('/enter', { replace: true })
  })
})
