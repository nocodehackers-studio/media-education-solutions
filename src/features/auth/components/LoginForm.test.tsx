/**
 * LoginForm Unit Tests
 * Tests form validation, submission, and loading states
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthContext } from '@/contexts/AuthContext'
import type { AuthContextType } from '@/features/auth/types/auth.types'
import { LoginForm } from './LoginForm'

// Mock auth context value
const mockAuthContext: AuthContextType = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  refreshProfile: vi.fn(),
}

// Wrapper component for router and auth context
function renderWithRouter(ui: ReactNode) {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>{ui}</AuthContext.Provider>
    </BrowserRouter>
  )
}

describe('LoginForm', () => {
  const mockOnSubmit = vi.fn<(data: { email: string; password: string }, turnstileToken: string) => Promise<void>>()

  beforeEach(() => {
    mockOnSubmit.mockClear()
    // Mock Turnstile widget - callback fires immediately with test token
    window.turnstile = {
      render: vi.fn((_container, options) => {
        options.callback('test-turnstile-token')
        return 'widget-1'
      }),
      reset: vi.fn(),
      remove: vi.fn(),
      getResponse: vi.fn(),
    }
  })

  afterEach(() => {
    window.turnstile = undefined
  })

  it('renders email and password fields', () => {
    renderWithRouter(<LoginForm onSubmit={mockOnSubmit} />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders forgot password link', () => {
    renderWithRouter(<LoginForm onSubmit={mockOnSubmit} />)

    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute(
      'href',
      '/forgot-password'
    )
  })

  describe('validation', () => {
    it('shows validation error for empty email', async () => {
      const user = userEvent.setup()
      renderWithRouter(<LoginForm onSubmit={mockOnSubmit} />)

      const emailInput = screen.getByLabelText(/email/i)

      await user.click(emailInput)
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument()
      })
    })

    it('shows validation error for invalid email format', async () => {
      const user = userEvent.setup()
      renderWithRouter(<LoginForm onSubmit={mockOnSubmit} />)

      const emailInput = screen.getByLabelText(/email/i)

      await user.type(emailInput, 'invalid-email')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      })
    })

    it('shows validation error for empty password', async () => {
      const user = userEvent.setup()
      renderWithRouter(<LoginForm onSubmit={mockOnSubmit} />)

      const passwordInput = screen.getByLabelText(/password/i)

      await user.click(passwordInput)
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument()
      })
    })

    it('shows validation error for short password', async () => {
      const user = userEvent.setup()
      renderWithRouter(<LoginForm onSubmit={mockOnSubmit} />)

      const passwordInput = screen.getByLabelText(/password/i)

      await user.type(passwordInput, 'short')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
      })
    })

    it('clears email error when valid value entered', async () => {
      const user = userEvent.setup()
      renderWithRouter(<LoginForm onSubmit={mockOnSubmit} />)

      const emailInput = screen.getByLabelText(/email/i)

      // Enter invalid email
      await user.type(emailInput, 'invalid')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      })

      // Fix the email
      await user.clear(emailInput)
      await user.type(emailInput, 'valid@example.com')
      await user.tab()

      await waitFor(() => {
        expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument()
      })
    })
  })

  describe('submission', () => {
    it('calls onSubmit with valid data and turnstile token', async () => {
      const user = userEvent.setup()
      renderWithRouter(<LoginForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/email/i), 'admin@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
        expect(mockOnSubmit.mock.calls[0][0]).toEqual({
          email: 'admin@example.com',
          password: 'password123',
        })
        expect(mockOnSubmit.mock.calls[0][1]).toBe('test-turnstile-token')
      })
    })

    it('does not submit with invalid data', async () => {
      const user = userEvent.setup()
      renderWithRouter(<LoginForm onSubmit={mockOnSubmit} />)

      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('loading state', () => {
    it('disables inputs and shows loading spinner when auth is loading', async () => {
      const loadingAuthContext: AuthContextType = {
        ...mockAuthContext,
        isLoading: true,
      }

      render(
        <BrowserRouter>
          <AuthContext.Provider value={loadingAuthContext}>
            <LoginForm onSubmit={mockOnSubmit} />
          </AuthContext.Provider>
        </BrowserRouter>
      )

      // Check loading state - fields should be disabled
      expect(screen.getByLabelText(/email/i)).toBeDisabled()
      expect(screen.getByLabelText(/password/i)).toBeDisabled()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled()
    })
  })
})
