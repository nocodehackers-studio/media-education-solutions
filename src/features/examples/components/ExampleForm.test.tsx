/**
 * ExampleForm Unit Tests (AC5)
 * Tests onBlur validation and inline error display
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExampleForm } from './ExampleForm'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('ExampleForm', () => {
  it('renders all form fields', () => {
    render(<ExampleForm />)

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contest code/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })

  describe('onBlur validation (AC5)', () => {
    it('shows error when name field is blurred empty', async () => {
      const user = userEvent.setup()
      render(<ExampleForm />)

      const nameInput = screen.getByLabelText(/name/i)

      // Focus and blur the field without entering a value
      await user.click(nameInput)
      await user.tab() // blur

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument()
      })
    })

    it('shows error when email is invalid on blur', async () => {
      const user = userEvent.setup()
      render(<ExampleForm />)

      const emailInput = screen.getByLabelText(/email/i)

      // Enter invalid email and blur
      await user.type(emailInput, 'invalid-email')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      })
    })

    it('shows error when contest code is wrong length on blur', async () => {
      const user = userEvent.setup()
      render(<ExampleForm />)

      const contestCodeInput = screen.getByLabelText(/contest code/i)

      // Enter wrong length code and blur
      await user.type(contestCodeInput, 'ABC')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('Contest code must be exactly 6 characters')).toBeInTheDocument()
      })
    })

    it('clears error when valid value is entered', async () => {
      const user = userEvent.setup()
      render(<ExampleForm />)

      const emailInput = screen.getByLabelText(/email/i)

      // Enter invalid email
      await user.type(emailInput, 'invalid')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      })

      // Clear and enter valid email
      await user.clear(emailInput)
      await user.type(emailInput, 'valid@example.com')
      await user.tab()

      await waitFor(() => {
        expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument()
      })
    })
  })

  describe('inline error display (AC5)', () => {
    it('displays errors below their respective fields', async () => {
      const user = userEvent.setup()
      render(<ExampleForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)

      // Trigger validation on both fields
      await user.click(nameInput)
      await user.tab()
      await user.click(emailInput)
      await user.type(emailInput, 'bad')
      await user.tab()

      await waitFor(() => {
        // Both errors should be visible
        expect(screen.getByText('Name is required')).toBeInTheDocument()
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      })

      // Verify error text has destructive styling (text-destructive class)
      const nameError = screen.getByText('Name is required')
      expect(nameError).toHaveClass('text-destructive')
    })
  })

  describe('form submission', () => {
    it('calls onSubmit with form data when valid', async () => {
      const user = userEvent.setup()
      const handleSubmit = vi.fn()
      render(<ExampleForm onSubmit={handleSubmit} />)

      // Fill in valid data
      await user.type(screen.getByLabelText(/name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/contest code/i), 'ABC123')

      // Submit
      await user.click(screen.getByRole('button', { name: /submit/i }))

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          contestCode: 'ABC123',
        })
      })
    })

    it('does not submit when form has errors', async () => {
      const user = userEvent.setup()
      const handleSubmit = vi.fn()
      render(<ExampleForm onSubmit={handleSubmit} />)

      // Submit without filling any fields
      await user.click(screen.getByRole('button', { name: /submit/i }))

      // Wait a bit to ensure submission doesn't happen
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(handleSubmit).not.toHaveBeenCalled()
    })
  })
})
