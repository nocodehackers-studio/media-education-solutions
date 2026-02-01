// Story 6-1: AdminSubmissionFilters component tests

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdminSubmissionFilters } from './AdminSubmissionFilters'

vi.mock('@/features/categories', () => ({
  useCategories: vi.fn(() => ({
    data: [
      { id: 'cat-1', name: 'Short Film', type: 'video' },
      { id: 'cat-2', name: 'Photography', type: 'photo' },
    ],
    isLoading: false,
  })),
}))

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

describe('AdminSubmissionFilters', () => {
  const onFiltersChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all filter dropdowns', () => {
    renderWithProviders(
      <AdminSubmissionFilters
        contestId="contest-1"
        filters={{}}
        onFiltersChange={onFiltersChange}
      />
    )

    expect(screen.getByText('All Categories')).toBeInTheDocument()
    expect(screen.getByText('All Statuses')).toBeInTheDocument()
    expect(screen.getByText('All Media')).toBeInTheDocument()
  })

  it('calls onFiltersChange when status filter is changed', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })

    renderWithProviders(
      <AdminSubmissionFilters
        contestId="contest-1"
        filters={{}}
        onFiltersChange={onFiltersChange}
      />
    )

    await user.click(screen.getByText('All Statuses'))
    await user.click(screen.getByText('Submitted'))

    expect(onFiltersChange).toHaveBeenCalledWith({ status: 'submitted' })
  })

  it('calls onFiltersChange when media type filter is changed', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })

    renderWithProviders(
      <AdminSubmissionFilters
        contestId="contest-1"
        filters={{}}
        onFiltersChange={onFiltersChange}
      />
    )

    await user.click(screen.getByText('All Media'))
    await user.click(screen.getByText('Video'))

    expect(onFiltersChange).toHaveBeenCalledWith({ mediaType: 'video' })
  })

  it('calls onFiltersChange when category filter is changed', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })

    renderWithProviders(
      <AdminSubmissionFilters
        contestId="contest-1"
        filters={{}}
        onFiltersChange={onFiltersChange}
      />
    )

    await user.click(screen.getByText('All Categories'))
    await user.click(screen.getByText('Short Film'))

    expect(onFiltersChange).toHaveBeenCalledWith({ categoryId: 'cat-1' })
  })
})
