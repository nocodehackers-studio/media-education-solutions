/**
 * ParticipantInfoForm Unit Tests
 * Tests form validation, submission, pre-fill, and loading states
 * Story 4.2: Participant Info Form
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ParticipantInfoForm } from './ParticipantInfoForm'

describe('ParticipantInfoForm', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  describe('rendering (AC1)', () => {
    it('renders all 4 form fields', () => {
      render(<ParticipantInfoForm onSubmit={mockOnSubmit} />)

      expect(screen.getByLabelText(/your name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/school\/organization/i)).toBeInTheDocument()
      expect(
        screen.getByLabelText(/teacher\/leader\/coach name/i)
      ).toBeInTheDocument()
      expect(
        screen.getByLabelText(/teacher\/leader\/coach email/i)
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /continue/i })
      ).toBeInTheDocument()
    })

    it('shows empty fields for first-time participant (AC1)', () => {
      render(<ParticipantInfoForm onSubmit={mockOnSubmit} />)

      expect(screen.getByLabelText(/your name/i)).toHaveValue('')
      expect(screen.getByLabelText(/school\/organization/i)).toHaveValue('')
      expect(
        screen.getByLabelText(/teacher\/leader\/coach name/i)
      ).toHaveValue('')
      expect(
        screen.getByLabelText(/teacher\/leader\/coach email/i)
      ).toHaveValue('')
    })
  })

  describe('pre-fill for returning participant (AC2)', () => {
    it('pre-fills form with provided defaultValues', () => {
      const defaultValues = {
        name: 'John Doe',
        organizationName: 'Test School',
        tlcName: 'Mr. Smith',
        tlcEmail: 'smith@school.edu',
      }

      render(
        <ParticipantInfoForm
          onSubmit={mockOnSubmit}
          defaultValues={defaultValues}
        />
      )

      expect(screen.getByLabelText(/your name/i)).toHaveValue('John Doe')
      expect(screen.getByLabelText(/school\/organization/i)).toHaveValue(
        'Test School'
      )
      expect(
        screen.getByLabelText(/teacher\/leader\/coach name/i)
      ).toHaveValue('Mr. Smith')
      expect(
        screen.getByLabelText(/teacher\/leader\/coach email/i)
      ).toHaveValue('smith@school.edu')
    })

    it('allows editing pre-filled fields', async () => {
      const user = userEvent.setup()
      const defaultValues = {
        name: 'John Doe',
        organizationName: 'Test School',
        tlcName: 'Mr. Smith',
        tlcEmail: 'smith@school.edu',
      }

      render(
        <ParticipantInfoForm
          onSubmit={mockOnSubmit}
          defaultValues={defaultValues}
        />
      )

      const nameInput = screen.getByLabelText(/your name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Jane Doe')

      expect(nameInput).toHaveValue('Jane Doe')
    })
  })

  describe('validation errors for empty fields (AC4)', () => {
    it('shows validation error for empty name', async () => {
      const user = userEvent.setup()
      render(<ParticipantInfoForm onSubmit={mockOnSubmit} />)

      const nameInput = screen.getByLabelText(/your name/i)
      await user.click(nameInput)
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument()
      })
    })

    it('shows validation error for empty organization', async () => {
      const user = userEvent.setup()
      render(<ParticipantInfoForm onSubmit={mockOnSubmit} />)

      const orgInput = screen.getByLabelText(/school\/organization/i)
      await user.click(orgInput)
      await user.tab()

      await waitFor(() => {
        expect(
          screen.getByText('School/Organization is required')
        ).toBeInTheDocument()
      })
    })

    it('shows validation error for empty TLC name', async () => {
      const user = userEvent.setup()
      render(<ParticipantInfoForm onSubmit={mockOnSubmit} />)

      const tlcNameInput = screen.getByLabelText(
        /teacher\/leader\/coach name/i
      )
      await user.click(tlcNameInput)
      await user.tab()

      await waitFor(() => {
        expect(
          screen.getByText('Teacher/Leader/Coach name is required')
        ).toBeInTheDocument()
      })
    })

    it('shows validation error for empty TLC email', async () => {
      const user = userEvent.setup()
      render(<ParticipantInfoForm onSubmit={mockOnSubmit} />)

      const tlcEmailInput = screen.getByLabelText(
        /teacher\/leader\/coach email/i
      )
      await user.click(tlcEmailInput)
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument()
      })
    })

    it('prevents submission with empty required fields (AC4)', async () => {
      const user = userEvent.setup()
      render(<ParticipantInfoForm onSubmit={mockOnSubmit} />)

      await user.click(screen.getByRole('button', { name: /continue/i }))

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('email validation (AC5)', () => {
    it('shows error for invalid email on blur', async () => {
      const user = userEvent.setup()
      render(<ParticipantInfoForm onSubmit={mockOnSubmit} />)

      const emailInput = screen.getByLabelText(/teacher\/leader\/coach email/i)
      await user.type(emailInput, 'invalid-email')
      await user.tab()

      await waitFor(() => {
        expect(
          screen.getByText('Please enter a valid email address')
        ).toBeInTheDocument()
      })
    })

    it('accepts valid email format', async () => {
      const user = userEvent.setup()
      render(<ParticipantInfoForm onSubmit={mockOnSubmit} />)

      const emailInput = screen.getByLabelText(/teacher\/leader\/coach email/i)
      await user.type(emailInput, 'teacher@school.edu')
      await user.tab()

      await waitFor(() => {
        expect(
          screen.queryByText('Please enter a valid email address')
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('successful submission (AC3)', () => {
    it('calls onSubmit with form data', async () => {
      const user = userEvent.setup()
      render(<ParticipantInfoForm onSubmit={mockOnSubmit} />)

      await user.type(screen.getByLabelText(/your name/i), 'John Doe')
      await user.type(
        screen.getByLabelText(/school\/organization/i),
        'Test School'
      )
      await user.type(
        screen.getByLabelText(/teacher\/leader\/coach name/i),
        'Mr. Smith'
      )
      await user.type(
        screen.getByLabelText(/teacher\/leader\/coach email/i),
        'smith@school.edu'
      )
      await user.click(screen.getByRole('button', { name: /continue/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
        expect(mockOnSubmit.mock.calls[0][0]).toEqual({
          name: 'John Doe',
          organizationName: 'Test School',
          tlcName: 'Mr. Smith',
          tlcEmail: 'smith@school.edu',
        })
      })
    })
  })

  describe('loading state', () => {
    it('disables inputs when isLoading is true', () => {
      render(<ParticipantInfoForm onSubmit={mockOnSubmit} isLoading={true} />)

      expect(screen.getByLabelText(/your name/i)).toBeDisabled()
      expect(screen.getByLabelText(/school\/organization/i)).toBeDisabled()
      expect(
        screen.getByLabelText(/teacher\/leader\/coach name/i)
      ).toBeDisabled()
      expect(
        screen.getByLabelText(/teacher\/leader\/coach email/i)
      ).toBeDisabled()
      expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
    })

    it('enables inputs when isLoading is false', () => {
      render(<ParticipantInfoForm onSubmit={mockOnSubmit} isLoading={false} />)

      expect(screen.getByLabelText(/your name/i)).not.toBeDisabled()
      expect(screen.getByLabelText(/school\/organization/i)).not.toBeDisabled()
      expect(
        screen.getByLabelText(/teacher\/leader\/coach name/i)
      ).not.toBeDisabled()
      expect(
        screen.getByLabelText(/teacher\/leader\/coach email/i)
      ).not.toBeDisabled()
      expect(
        screen.getByRole('button', { name: /continue/i })
      ).not.toBeDisabled()
    })
  })
})
