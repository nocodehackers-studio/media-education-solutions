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

// Mock useParticipantCategories
const mockUseParticipantCategories = vi.fn()
vi.mock('@/features/participants', () => ({
  useParticipantCategories: () => mockUseParticipantCategories(),
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
    // Default mock: empty categories data, not loading
    mockUseParticipantCategories.mockReturnValue({
      data: { categories: [], acceptingSubmissions: true },
      isLoading: false,
      error: null,
    })
  })

  const renderWithProviders = (categoryId = 'category-123', navState?: { type?: string }) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[{ pathname: `/participant/submit/${categoryId}`, state: navState }]}>
          <Routes>
            <Route path="/participant/submit/:categoryId" element={<SubmitPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )
  }

  it('shows loading skeleton while fetching category type', () => {
    // Mock loading state
    mockUseParticipantCategories.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })

    renderWithProviders()

    // Should show loading skeleton (via class)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders VideoUploadPage for video category', async () => {
    // Pass category type via navigation state (the primary method)
    renderWithProviders('category-123', { type: 'video' })

    await waitFor(() => {
      expect(screen.getByTestId('video-upload-page')).toBeInTheDocument()
    })
  })

  it('renders PhotoUploadPage for photo category', async () => {
    // Pass category type via navigation state (the primary method)
    renderWithProviders('category-123', { type: 'photo' })

    await waitFor(() => {
      expect(screen.getByTestId('photo-upload-page')).toBeInTheDocument()
    })
  })

  it('resolves category type from edge function data when no nav state', async () => {
    mockUseParticipantCategories.mockReturnValue({
      data: {
        categories: [{ id: 'category-123', type: 'video', name: 'Video Category' }],
        acceptingSubmissions: true,
      },
      isLoading: false,
      error: null,
    })

    renderWithProviders('category-123') // No nav state

    await waitFor(() => {
      expect(screen.getByTestId('video-upload-page')).toBeInTheDocument()
    })
  })

  it('shows error message when category not found', async () => {
    // No nav state and category not in the list
    mockUseParticipantCategories.mockReturnValue({
      data: {
        categories: [], // Empty - category won't be found
        acceptingSubmissions: true,
      },
      isLoading: false,
      error: null,
    })

    renderWithProviders('category-123')

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load category. Please try again.')
      ).toBeInTheDocument()
    })
  })

  it('shows error message when category fetch fails', async () => {
    mockUseParticipantCategories.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
    })

    renderWithProviders()

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load category. Please try again.')
      ).toBeInTheDocument()
    })
  })

  it('redirects to / when no session', () => {
    vi.mocked(useParticipantSession).mockReturnValue({
      session: null,
    } as ReturnType<typeof useParticipantSession>)

    renderWithProviders()

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
  })
})
