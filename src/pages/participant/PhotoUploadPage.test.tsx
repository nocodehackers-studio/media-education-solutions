// Story 4-5: Tests for PhotoUploadPage
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PhotoUploadPage } from './PhotoUploadPage'

// Mock useParticipantSession
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

// Mock PhotoUploadForm
vi.mock('@/features/submissions', () => ({
  PhotoUploadForm: vi.fn(({ onUploadComplete }) => (
    <div data-testid="photo-upload-form">
      <button onClick={() => onUploadComplete('submission-789')}>
        Complete Upload
      </button>
    </div>
  )),
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

describe('PhotoUploadPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useParticipantSession).mockReturnValue({
      session: mockSession,
    } as ReturnType<typeof useParticipantSession>)
  })

  const renderWithRouter = (categoryId = 'category-123') => {
    return render(
      <MemoryRouter initialEntries={[`/participant/submit/${categoryId}`]}>
        <Routes>
          <Route
            path="/participant/submit/:categoryId"
            element={<PhotoUploadPage />}
          />
        </Routes>
      </MemoryRouter>
    )
  }

  it('renders page header', () => {
    renderWithRouter()

    expect(screen.getByText('Upload Photo')).toBeInTheDocument()
    expect(screen.getByText('Submit your photo entry')).toBeInTheDocument()
  })

  it('renders PhotoUploadForm with correct props', () => {
    renderWithRouter()

    expect(screen.getByTestId('photo-upload-form')).toBeInTheDocument()
  })

  it('navigates to preview page on upload complete', async () => {
    renderWithRouter()

    const user = userEvent.setup()
    await user.click(screen.getByText('Complete Upload'))

    expect(mockNavigate).toHaveBeenCalledWith(
      '/participant/preview/submission-789'
    )
  })

  it('navigates back to categories when back button clicked', async () => {
    renderWithRouter()

    const user = userEvent.setup()
    const backButton = screen.getByRole('button', { name: '' }) // Icon button
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/participant/categories')
  })

  it('redirects to /enter when no session', () => {
    vi.mocked(useParticipantSession).mockReturnValue({
      session: null,
    } as ReturnType<typeof useParticipantSession>)

    renderWithRouter()

    expect(mockNavigate).toHaveBeenCalledWith('/enter', { replace: true })
  })
})
