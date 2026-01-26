/**
 * CodeEntryForm Unit Tests
 * Tests form validation, submission, auto-uppercase, and loading states
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CodeEntryForm } from './CodeEntryForm'

describe('CodeEntryForm', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it('renders contest code and participant code fields', () => {
    render(<CodeEntryForm onSubmit={mockOnSubmit} />)

    expect(screen.getByLabelText(/contest code/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/participant code/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /enter contest/i })
    ).toBeInTheDocument()
  })

  describe('validation', () => {
    it('shows validation error for short contest code', async () => {
      const user = userEvent.setup()
      render(<CodeEntryForm onSubmit={mockOnSubmit} />)

      const contestCodeInput = screen.getByLabelText(/contest code/i)

      await user.type(contestCodeInput, 'ABC')
      await user.tab()

      await waitFor(() => {
        expect(
          screen.getByText('Contest code must be 6 characters')
        ).toBeInTheDocument()
      })
    })

    it('shows validation error for short participant code', async () => {
      const user = userEvent.setup()
      render(<CodeEntryForm onSubmit={mockOnSubmit} />)

      const participantCodeInput = screen.getByLabelText(/participant code/i)

      await user.type(participantCodeInput, 'ABC')
      await user.tab()

      await waitFor(() => {
        expect(
          screen.getByText('Participant code must be 8 characters')
        ).toBeInTheDocument()
      })
    })

    it('shows validation error for invalid characters in contest code', async () => {
      const user = userEvent.setup()
      render(<CodeEntryForm onSubmit={mockOnSubmit} />)

      const contestCodeInput = screen.getByLabelText(/contest code/i)

      await user.type(contestCodeInput, 'ABC-12')
      await user.tab()

      await waitFor(() => {
        expect(
          screen.getByText('Contest code must contain only letters and numbers')
        ).toBeInTheDocument()
      })
    })

    it('shows validation error for invalid characters in participant code', async () => {
      const user = userEvent.setup()
      render(<CodeEntryForm onSubmit={mockOnSubmit} />)

      const participantCodeInput = screen.getByLabelText(/participant code/i)

      await user.type(participantCodeInput, 'ABCD-123')
      await user.tab()

      await waitFor(() => {
        expect(
          screen.getByText(
            'Participant code must contain only letters and numbers'
          )
        ).toBeInTheDocument()
      })
    })
  })

  describe('auto-uppercase', () => {
    it('converts contest code input to uppercase', async () => {
      const user = userEvent.setup()
      render(<CodeEntryForm onSubmit={mockOnSubmit} />)

      const contestCodeInput = screen.getByLabelText(
        /contest code/i
      ) as HTMLInputElement

      await user.type(contestCodeInput, 'abc123')

      expect(contestCodeInput.value).toBe('ABC123')
    })

    it('converts participant code input to uppercase', async () => {
      const user = userEvent.setup()
      render(<CodeEntryForm onSubmit={mockOnSubmit} />)

      const participantCodeInput = screen.getByLabelText(
        /participant code/i
      ) as HTMLInputElement

      await user.type(participantCodeInput, 'abcd1234')

      expect(participantCodeInput.value).toBe('ABCD1234')
    })
  })

  describe('submission', () => {
    it('calls onSubmit with valid data', async () => {
      const user = userEvent.setup()
      render(<CodeEntryForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/contest code/i), 'ABC123')
      await user.type(screen.getByLabelText(/participant code/i), 'WXYZ5678')
      await user.click(screen.getByRole('button', { name: /enter contest/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
        expect(mockOnSubmit.mock.calls[0][0]).toEqual({
          contestCode: 'ABC123',
          participantCode: 'WXYZ5678',
        })
      })
    })

    it('does not submit with invalid data', async () => {
      const user = userEvent.setup()
      render(<CodeEntryForm onSubmit={mockOnSubmit} />)

      await user.click(screen.getByRole('button', { name: /enter contest/i }))

      // Wait for validation errors to appear, then verify no submit
      await waitFor(() => {
        expect(screen.getByText(/contest code must be/i)).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('loading state', () => {
    it('disables inputs and shows loading spinner when isLoading is true', () => {
      render(<CodeEntryForm onSubmit={mockOnSubmit} isLoading={true} />)

      expect(screen.getByLabelText(/contest code/i)).toBeDisabled()
      expect(screen.getByLabelText(/participant code/i)).toBeDisabled()
      expect(
        screen.getByRole('button', { name: /enter contest/i })
      ).toBeDisabled()
    })

    it('enables inputs when isLoading is false', () => {
      render(<CodeEntryForm onSubmit={mockOnSubmit} isLoading={false} />)

      expect(screen.getByLabelText(/contest code/i)).not.toBeDisabled()
      expect(screen.getByLabelText(/participant code/i)).not.toBeDisabled()
      expect(
        screen.getByRole('button', { name: /enter contest/i })
      ).not.toBeDisabled()
    })
  })
})
