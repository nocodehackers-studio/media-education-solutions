// Story 6-3: OverrideFeedbackDialog component tests

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OverrideFeedbackDialog } from './OverrideFeedbackDialog'

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

function renderWithProviders(ui: ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('OverrideFeedbackDialog', () => {
  it('shows original feedback read-only when open', () => {
    renderWithProviders(
      <OverrideFeedbackDialog
        reviewId="rev-1"
        originalFeedback="Great work on this submission"
        currentOverride={null}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText('Override Feedback')).toBeInTheDocument()
    expect(screen.getByText('Original Judge Feedback')).toBeInTheDocument()
    expect(screen.getByText('Great work on this submission')).toBeInTheDocument()
  })

  it('shows "No feedback provided" when original feedback is null', () => {
    renderWithProviders(
      <OverrideFeedbackDialog
        reviewId="rev-1"
        originalFeedback={null}
        currentOverride={null}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText('No feedback provided')).toBeInTheDocument()
  })

  it('pre-fills textarea with current override when editing', () => {
    renderWithProviders(
      <OverrideFeedbackDialog
        reviewId="rev-1"
        originalFeedback="Original"
        currentOverride="Existing override text"
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    const textarea = screen.getByPlaceholderText('Enter override feedback...')
    expect(textarea).toHaveValue('Existing override text')
  })

  it('shows "Overridden" badge when current override exists', () => {
    renderWithProviders(
      <OverrideFeedbackDialog
        reviewId="rev-1"
        originalFeedback="Original"
        currentOverride="Override"
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText('Overridden')).toBeInTheDocument()
  })

  it('shows Clear Override button when override exists', () => {
    renderWithProviders(
      <OverrideFeedbackDialog
        reviewId="rev-1"
        originalFeedback="Original"
        currentOverride="Override"
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText('Clear Override')).toBeInTheDocument()
  })

  it('does not show Clear Override button when no override', () => {
    renderWithProviders(
      <OverrideFeedbackDialog
        reviewId="rev-1"
        originalFeedback="Original"
        currentOverride={null}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.queryByText('Clear Override')).not.toBeInTheDocument()
  })

  it('renders Save Override and Cancel buttons', () => {
    renderWithProviders(
      <OverrideFeedbackDialog
        reviewId="rev-1"
        originalFeedback="Original"
        currentOverride={null}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText('Save Override')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })
})
