// Story 6-4: RestoreConfirmDialog component tests

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RestoreConfirmDialog } from './RestoreConfirmDialog'

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

function renderWithProviders(ui: ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('RestoreConfirmDialog', () => {
  it('shows restore message when open', () => {
    renderWithProviders(
      <RestoreConfirmDialog
        submissionId="sub-1"
        participantCode="ABC12345"
        categoryName="Photography"
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText('Restore Submission')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to restore this submission?')).toBeInTheDocument()
  })

  it('displays warning about rankings not being auto-restored', () => {
    renderWithProviders(
      <RestoreConfirmDialog
        submissionId="sub-1"
        participantCode="ABC12345"
        categoryName="Photography"
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText('This will NOT automatically re-add the submission to rankings.')).toBeInTheDocument()
  })

  it('displays submission context', () => {
    renderWithProviders(
      <RestoreConfirmDialog
        submissionId="sub-1"
        participantCode="ABC12345"
        categoryName="Photography"
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText('ABC12345')).toBeInTheDocument()
    expect(screen.getByText(/Photography/)).toBeInTheDocument()
  })

  it('renders Restore and Cancel buttons', () => {
    renderWithProviders(
      <RestoreConfirmDialog
        submissionId="sub-1"
        participantCode="ABC12345"
        categoryName="Photography"
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText('Restore')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })
})
