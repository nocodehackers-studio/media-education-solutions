/**
 * ResetPasswordPage Unit Tests
 * Tests session validation, form submission, and error states
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ResetPasswordPage } from './ResetPasswordPage'

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

vi.mock('@/features/auth', async () => {
  const actual = await vi.importActual('@/features/auth')
  return {
    ...actual,
    authApi: {
      updatePassword: vi.fn(),
      signOut: vi.fn(),
    },
  }
})

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

import { supabase } from '@/lib/supabase'
import { authApi } from '@/features/auth'

// Helper to set URL hash for recovery flow
function setRecoveryHash() {
  window.location.hash = '#access_token=fake_token&type=recovery'
}

function clearHash() {
  window.location.hash = ''
}

function renderWithRouter(ui: React.ReactNode) {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearHash()
  })

  afterEach(() => {
    clearHash()
  })

  describe('session validation', () => {
    it('shows loading state while checking session', () => {
      vi.mocked(supabase.auth.getSession).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      renderWithRouter(<ResetPasswordPage />)

      expect(screen.getByText(/verifying/i)).toBeInTheDocument()
    })

    it('shows invalid link message when no session exists', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      renderWithRouter(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByText(/invalid or expired link/i)).toBeInTheDocument()
      })

      expect(
        screen.getByText(/this password reset link is no longer valid/i)
      ).toBeInTheDocument()
    })

    it('shows invalid link message when session exists but no recovery type in URL', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123', email: 'test@example.com' } as any,
            access_token: 'token',
          } as any,
        },
        error: null,
      })
      // No recovery hash set

      renderWithRouter(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByText(/invalid or expired link/i)).toBeInTheDocument()
      })
    })

    it('shows reset form when valid recovery session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123', email: 'test@example.com' } as any,
            access_token: 'token',
          } as any,
        },
        error: null,
      })
      setRecoveryHash()

      renderWithRouter(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByText(/set new password/i)).toBeInTheDocument()
      })

      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    })

    it('provides link to request new reset on invalid session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      renderWithRouter(<ResetPasswordPage />)

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /request new reset link/i })
        expect(button).toBeInTheDocument()
      })
    })
  })

  describe('form validation', () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123', email: 'test@example.com' } as any,
            access_token: 'token',
          } as any,
        },
        error: null,
      })
      setRecoveryHash()
    })

    it('shows validation error for empty password', async () => {
      const user = userEvent.setup()
      renderWithRouter(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
      })

      const passwordInput = screen.getByLabelText(/new password/i)
      await user.click(passwordInput)
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument()
      })
    })

    it('shows validation error for short password', async () => {
      const user = userEvent.setup()
      renderWithRouter(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/new password/i), 'short')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
      })
    })

    it('shows validation error when passwords do not match', async () => {
      const user = userEvent.setup()
      renderWithRouter(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/new password/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'different456')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
      })
    })
  })

  describe('form submission', () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123', email: 'test@example.com' } as any,
            access_token: 'token',
          } as any,
        },
        error: null,
      })
      setRecoveryHash()
    })

    it('successfully updates password and redirects', async () => {
      const user = userEvent.setup()
      const mockUpdatePassword = vi.mocked(authApi.updatePassword)
      const mockSignOut = vi.mocked(authApi.signOut)

      mockUpdatePassword.mockResolvedValue(undefined)
      mockSignOut.mockResolvedValue(undefined)

      renderWithRouter(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/new password/i), 'newpassword123')
      await user.type(screen.getByLabelText(/confirm password/i), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /update password/i }))

      await waitFor(() => {
        expect(mockUpdatePassword).toHaveBeenCalledWith('newpassword123')
        expect(mockSignOut).toHaveBeenCalled()
      })
    })

    it('disables form during submission', async () => {
      const user = userEvent.setup()
      vi.mocked(authApi.updatePassword).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      renderWithRouter(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/new password/i), 'newpassword123')
      await user.type(screen.getByLabelText(/confirm password/i), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /update password/i }))

      // Check loading state
      expect(screen.getByLabelText(/new password/i)).toBeDisabled()
      expect(screen.getByLabelText(/confirm password/i)).toBeDisabled()
      expect(screen.getByRole('button', { name: /update password/i })).toBeDisabled()
    })

    it('shows error message when password update fails', async () => {
      const user = userEvent.setup()
      vi.mocked(authApi.updatePassword).mockRejectedValue(new Error('Update failed'))

      renderWithRouter(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/new password/i), 'newpassword123')
      await user.type(screen.getByLabelText(/confirm password/i), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /update password/i }))

      await waitFor(() => {
        expect(authApi.updatePassword).toHaveBeenCalled()
      })

      // Form should still be visible (not redirected)
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
    })

    it('does not submit with invalid data', async () => {
      const user = userEvent.setup()
      renderWithRouter(<ResetPasswordPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /update password/i }))

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(authApi.updatePassword).not.toHaveBeenCalled()
    })
  })
})
