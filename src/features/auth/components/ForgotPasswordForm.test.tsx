/**
 * ForgotPasswordForm Unit Tests
 * Tests form validation, submission, and success state
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ForgotPasswordForm } from './ForgotPasswordForm'

// Wrapper component for router
function renderWithRouter(ui: React.ReactNode) {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('ForgotPasswordForm', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it('renders email field and submit button', () => {
    renderWithRouter(<ForgotPasswordForm onSubmit={mockOnSubmit} />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
  })

  it('renders back to login link', () => {
    renderWithRouter(<ForgotPasswordForm onSubmit={mockOnSubmit} />)

    const links = screen.getAllByRole('link', { name: /back to login/i })
    expect(links.length).toBeGreaterThan(0)
    expect(links[0]).toHaveAttribute('href', '/login')
  })

  describe('validation', () => {
    it('shows validation error for empty email', async () => {
      const user = userEvent.setup()
      renderWithRouter(<ForgotPasswordForm onSubmit={mockOnSubmit} />)

      const emailInput = screen.getByLabelText(/email/i)

      await user.click(emailInput)
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument()
      })
    })

    it('shows validation error for invalid email format', async () => {
      const user = userEvent.setup()
      renderWithRouter(<ForgotPasswordForm onSubmit={mockOnSubmit} />)

      const emailInput = screen.getByLabelText(/email/i)

      await user.type(emailInput, 'invalid-email')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      })
    })

    it('clears error when valid email entered', async () => {
      const user = userEvent.setup()
      renderWithRouter(<ForgotPasswordForm onSubmit={mockOnSubmit} />)

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
    it('calls onSubmit with valid email', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)
      renderWithRouter(<ForgotPasswordForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /send reset link/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: 'test@example.com',
        })
      })
    })

    it('does not submit with invalid data', async () => {
      const user = userEvent.setup()
      renderWithRouter(<ForgotPasswordForm onSubmit={mockOnSubmit} />)

      await user.click(screen.getByRole('button', { name: /send reset link/i }))

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('disables inputs during submission', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)))
      renderWithRouter(<ForgotPasswordForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /send reset link/i }))

      // Check loading state immediately
      expect(screen.getByLabelText(/email/i)).toBeDisabled()
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeDisabled()
    })
  })

  describe('success state', () => {
    it('shows success message after successful submission', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)
      renderWithRouter(<ForgotPasswordForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /send reset link/i }))

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument()
        expect(
          screen.getByText(/if an account exists for test@example.com/i)
        ).toBeInTheDocument()
      })
    })

    it('shows back to login link in success state', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValue(undefined)
      renderWithRouter(<ForgotPasswordForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /send reset link/i }))

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /back to login/i })
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', '/login')
      })
    })

    it('does not show success state if submission fails', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockRejectedValue(new Error('Network error'))
      renderWithRouter(<ForgotPasswordForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /send reset link/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })

      // Should still show the form, not success state
      await waitFor(() => {
        expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument()
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      })
    })
  })
})
