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
const mockUpdateProfile = vi.fn()
vi.mock('@/features/auth', async () => {
  const actual = await vi.importActual('@/features/auth')
  return {
    ...actual,
    authApi: {
      updatePassword: (...args: unknown[]) => mockUpdatePassword(...args),
      fetchProfile: (...args: unknown[]) => mockFetchProfile(...args),
      updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
    },
  }
})

// Mock useAuth
const mockRefreshProfile = vi.fn()
vi.mock('@/contexts', () => ({
  useAuth: () => ({
    refreshProfile: mockRefreshProfile,
  }),
}))

// Mock toast
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
const mockToastWarning = vi.fn()
vi.mock('@/components/ui', async () => {
  const actual = await vi.importActual('@/components/ui')
  return {
    ...actual,
    toast: {
      success: (...args: unknown[]) => mockToastSuccess(...args),
      error: (...args: unknown[]) => mockToastError(...args),
      warning: (...args: unknown[]) => mockToastWarning(...args),
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

    it('shows invalid link error when no session exists', async () => {
      setUrlHash('#type=invite')
      mockGetSession.mockResolvedValue({ data: { session: null } })

      renderPage()

      await waitFor(() => {
        expect(screen.getByText(/invalid or expired link/i)).toBeInTheDocument()
      })
      expect(screen.getByRole('button', { name: /go to login/i })).toBeInTheDocument()
    })

    it('redirects judge to dashboard if session exists but not from setup flow (AC5)', async () => {
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

  describe('Onboarding Mode (invite/magiclink)', () => {
    beforeEach(() => {
      setUrlHash('#type=invite')
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      })
    })

    it('shows all four fields when invite session exists (AC2)', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Complete Your Account')).toBeInTheDocument()
      })
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    })

    it('shows "Complete Your Account" title and onboarding description', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Complete Your Account')).toBeInTheDocument()
        expect(screen.getByText(/complete your account setup to start judging/i)).toBeInTheDocument()
      })
    })

    it('shows all four fields when magiclink session exists', async () => {
      window.location.hash = ''
      setUrlHash('#type=magiclink')

      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Complete Your Account')).toBeInTheDocument()
      })
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    })

    it('calls updatePassword FIRST, then updateProfile, then refreshProfile on submit (AC3)', async () => {
      mockUpdatePassword.mockResolvedValue(undefined)
      mockUpdateProfile.mockResolvedValue(undefined)
      mockRefreshProfile.mockResolvedValue(undefined)
      const user = userEvent.setup()
      renderPage()

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/first name/i), 'Jane')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/^password$/i), 'validpassword123')
      await user.type(screen.getByLabelText(/confirm password/i), 'validpassword123')
      await user.click(screen.getByRole('button', { name: /complete setup/i }))

      await waitFor(() => {
        expect(mockUpdatePassword).toHaveBeenCalledWith('validpassword123')
      })

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith('user-123', { firstName: 'Jane', lastName: 'Doe' })
      })

      await waitFor(() => {
        expect(mockRefreshProfile).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/judge/dashboard', { replace: true })
      })
    })

    it('does NOT call updateProfile when updatePassword fails', async () => {
      mockUpdatePassword.mockRejectedValue(new Error('Failed to set password'))
      const user = userEvent.setup()
      renderPage()

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/first name/i), 'Jane')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/^password$/i), 'validpassword123')
      await user.type(screen.getByLabelText(/confirm password/i), 'validpassword123')
      await user.click(screen.getByRole('button', { name: /complete setup/i }))

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Failed to set password')
      })

      expect(mockUpdateProfile).not.toHaveBeenCalled()
    })

    it('shows warning toast and still navigates when updateProfile fails (AC11)', async () => {
      mockUpdatePassword.mockResolvedValue(undefined)
      mockUpdateProfile.mockRejectedValue(new Error('Profile update failed'))
      const user = userEvent.setup()
      renderPage()

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/first name/i), 'Jane')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/^password$/i), 'validpassword123')
      await user.type(screen.getByLabelText(/confirm password/i), 'validpassword123')
      await user.click(screen.getByRole('button', { name: /complete setup/i }))

      await waitFor(() => {
        expect(mockToastWarning).toHaveBeenCalledWith('Password set, but name update failed. You can update your name later.')
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/judge/dashboard', { replace: true })
      })
    })

    it('shows validation error when first name is empty', async () => {
      const user = userEvent.setup()
      renderPage()

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      })

      await user.click(screen.getByLabelText(/first name/i))
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument()
      })
    })

    it('shows validation error when last name is empty', async () => {
      const user = userEvent.setup()
      renderPage()

      await waitFor(() => {
        expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
      })

      await user.click(screen.getByLabelText(/last name/i))
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('Last name is required')).toBeInTheDocument()
      })
    })
  })

  describe('Recovery Mode', () => {
    beforeEach(() => {
      setUrlHash('#type=recovery')
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      })
    })

    it('shows only password fields when recovery session exists (AC4)', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Reset Your Password')).toBeInTheDocument()
      })
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/last name/i)).not.toBeInTheDocument()
    })

    it('shows "Reset Your Password" title (AC4)', async () => {
      renderPage()

      await waitFor(() => {
        expect(screen.getByText('Reset Your Password')).toBeInTheDocument()
        expect(screen.getByText('Enter your new password below.')).toBeInTheDocument()
      })
    })

    it('calls updatePassword and navigates on success', async () => {
      mockUpdatePassword.mockResolvedValue(undefined)
      const user = userEvent.setup()
      renderPage()

      await waitFor(() => {
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/^password$/i), 'validpassword123')
      await user.type(screen.getByLabelText(/confirm password/i), 'validpassword123')
      await user.click(screen.getByRole('button', { name: /set password/i }))

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

      await user.type(screen.getByLabelText(/^password$/i), 'validpassword123')
      await user.type(screen.getByLabelText(/confirm password/i), 'validpassword123')
      await user.click(screen.getByRole('button', { name: /set password/i }))

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Failed to set password')
      })
    })
  })

  describe('Form Validation', () => {
    beforeEach(() => {
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

      await user.type(screen.getByLabelText(/^password$/i), 'short')
      await user.tab()

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

      await user.type(screen.getByLabelText(/^password$/i), 'validpassword123')
      await user.type(screen.getByLabelText(/confirm password/i), 'differentpassword')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
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
