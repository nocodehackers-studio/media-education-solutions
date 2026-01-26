import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { SetPasswordPage } from './SetPasswordPage'

// Mock dependencies
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockGetSession = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
  },
}))

const mockUpdatePassword = vi.fn()
const mockFetchProfile = vi.fn()
vi.mock('@/features/auth', async () => {
  const actual = await vi.importActual('@/features/auth')
  return {
    ...actual,
    authApi: {
      updatePassword: (...args: unknown[]) => mockUpdatePassword(...args),
      fetchProfile: (...args: unknown[]) => mockFetchProfile(...args),
    },
  }
})

// Mock toast
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock('@/components/ui', async () => {
  const actual = await vi.importActual('@/components/ui')
  return {
    ...actual,
    toast: {
      success: (...args: unknown[]) => mockToastSuccess(...args),
      error: (...args: unknown[]) => mockToastError(...args),
    },
  }
})

function renderPage() {
  return render(
    <BrowserRouter>
      <SetPasswordPage />
    </BrowserRouter>
  )
}

function setUrlHash(hash: string) {
  window.location.hash = hash
}

describe('SetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.location.hash = ''
  })

  describe('Session Validation', () => {
    it('shows loading state while checking session', () => {
      mockGetSession.mockReturnValue(new Promise(() => {})) // Never resolves
      renderPage()
      expect(screen.getByText('Verifying...')).toBeInTheDocument()
    })

    it('renders password form when valid invite session exists', async () => {
      setUrlHash('#type=invite')
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByText(/set your password/i)).toBeInTheDocument()
      })
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /set password/i })).toBeInTheDocument()
    })

    it('renders password form when valid recovery session exists', async () => {
      setUrlHash('#type=recovery')
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByText(/set your password/i)).toBeInTheDocument()
      })
    })

    it('renders password form when valid magiclink session exists', async () => {
      setUrlHash('#type=magiclink')
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      })

      renderPage()

      await waitFor(() => {
        expect(screen.getByText(/set your password/i)).toBeInTheDocument()
      })
    })

    it('shows invalid link error when no session exists', async () => {
      setUrlHash('#type=invite')
      mockGetSession.mockResolvedValue({ data: { session: null } })

      renderPage()

      await waitFor(() => {
        expect(screen.getByText(/invalid or expired link/i)).toBeInTheDocument()
      })
      expect(screen.getByRole('button', { name: /go to login/i })).toBeInTheDocument()
    })

    it('redirects to login when session exists but no valid type in hash', async () => {
      // When type is invalid but session exists, the component treats it as
      // "user navigated directly while logged in" - so it checks profile and redirects
      setUrlHash('#type=invalid')
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      })
      mockFetchProfile.mockResolvedValue({ role: 'admin' })

      renderPage()

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
      })
    })

    it('redirects judge to dashboard if session exists but not from setup flow (AC5)', async () => {
      // No type in hash - indicates direct navigation, not from invite link
      window.location.hash = ''
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      })
      mockFetchProfile.mockResolvedValue({ role: 'judge' })

      renderPage()

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/judge/dashboard', { replace: true })
      })
    })

    it('redirects non-judge to login if session exists but not from setup flow (AC5)', async () => {
      window.location.hash = ''
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      })
      mockFetchProfile.mockResolvedValue({ role: 'admin' })

      renderPage()

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
      })
    })
  })

  describe('Form Validation', () => {
    beforeEach(async () => {
      setUrlHash('#type=invite')
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      })
    })

    it('shows error when password is too short (AC4)', async () => {
      const user = userEvent.setup()
      renderPage()

      await waitFor(() => {
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      })

      const passwordInput = screen.getByLabelText(/^password$/i)
      await user.type(passwordInput, 'short')
      await user.tab() // Trigger blur validation

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      })
    })

    it('shows error when passwords do not match (AC3)', async () => {
      const user = userEvent.setup()
      renderPage()

      await waitFor(() => {
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      })

      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmInput = screen.getByLabelText(/confirm password/i)

      await user.type(passwordInput, 'validpassword123')
      await user.type(confirmInput, 'differentpassword')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })

    it('does not show error when passwords match', async () => {
      const user = userEvent.setup()
      renderPage()

      await waitFor(() => {
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      })

      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmInput = screen.getByLabelText(/confirm password/i)

      await user.type(passwordInput, 'validpassword123')
      await user.type(confirmInput, 'validpassword123')
      await user.tab()

      await waitFor(() => {
        expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Password Submission', () => {
    beforeEach(async () => {
      setUrlHash('#type=invite')
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      })
    })

    it('calls updatePassword and navigates to judge dashboard on success (AC2)', async () => {
      mockUpdatePassword.mockResolvedValue(undefined)
      const user = userEvent.setup()
      renderPage()

      await waitFor(() => {
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      })

      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /set password/i })

      await user.type(passwordInput, 'validpassword123')
      await user.type(confirmInput, 'validpassword123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUpdatePassword).toHaveBeenCalledWith('validpassword123')
      })

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith('Password set successfully!')
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/judge/dashboard', { replace: true })
      })
    })

    it('shows error toast on submission failure', async () => {
      mockUpdatePassword.mockRejectedValue(new Error('Failed to set password'))
      const user = userEvent.setup()
      renderPage()

      await waitFor(() => {
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      })

      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /set password/i })

      await user.type(passwordInput, 'validpassword123')
      await user.type(confirmInput, 'validpassword123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Failed to set password')
      })
    })

    it('shows loading state while submitting', async () => {
      mockUpdatePassword.mockImplementation(() => new Promise(() => {})) // Never resolves
      const user = userEvent.setup()
      renderPage()

      await waitFor(() => {
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      })

      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /set password/i })

      await user.type(passwordInput, 'validpassword123')
      await user.type(confirmInput, 'validpassword123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
    })

    it('disables inputs while submitting', async () => {
      mockUpdatePassword.mockImplementation(() => new Promise(() => {}))
      const user = userEvent.setup()
      renderPage()

      await waitFor(() => {
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      })

      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /set password/i })

      await user.type(passwordInput, 'validpassword123')
      await user.type(confirmInput, 'validpassword123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(passwordInput).toBeDisabled()
        expect(confirmInput).toBeDisabled()
      })
    })
  })

  describe('Invalid Link Actions', () => {
    it('navigates to login when clicking Go to Login button', async () => {
      setUrlHash('#type=invite')
      mockGetSession.mockResolvedValue({ data: { session: null } })
      const user = userEvent.setup()

      renderPage()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /go to login/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /go to login/i }))

      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
    })
  })
})
