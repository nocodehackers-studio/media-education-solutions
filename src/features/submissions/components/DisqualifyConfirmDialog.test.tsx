// Story 6-4: DisqualifyConfirmDialog component tests

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DisqualifyConfirmDialog } from './DisqualifyConfirmDialog'

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

function renderWithProviders(ui: ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('DisqualifyConfirmDialog', () => {
  it('shows confirmation message when open', () => {
    renderWithProviders(
      <DisqualifyConfirmDialog
        submissionId="sub-1"
        participantCode="ABC12345"
        categoryName="Photography"
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText('Disqualify Submission')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to disqualify this submission?')).toBeInTheDocument()
  })

  it('displays submission context', () => {
    renderWithProviders(
      <DisqualifyConfirmDialog
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

  it('renders Disqualify and Cancel buttons', () => {
    renderWithProviders(
      <DisqualifyConfirmDialog
        submissionId="sub-1"
        participantCode="ABC12345"
        categoryName="Photography"
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText('Disqualify')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })
})
