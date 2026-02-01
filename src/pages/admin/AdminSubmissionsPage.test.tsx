// Story 6-1: AdminSubmissionsPage integration tests

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdminSubmissionsPage } from './AdminSubmissionsPage'

vi.mock('@/features/contests', () => ({
  useContest: vi.fn(),
}))

vi.mock('@/features/submissions', () => ({
  AdminSubmissionFilters: vi.fn(() => <div data-testid="filters">Filters</div>),
  AdminSubmissionsTable: vi.fn(({ submissions }: { submissions: unknown[] }) => (
    <div data-testid="table">Table ({submissions.length} rows)</div>
  )),
  AdminSubmissionDetail: vi.fn(() => <div data-testid="detail">Detail</div>),
  useAdminSubmissions: vi.fn(),
}))

import { useContest } from '@/features/contests'
import { useAdminSubmissions } from '@/features/submissions'

const mockUseContest = vi.mocked(useContest)
const mockUseAdminSubmissions = vi.mocked(useAdminSubmissions)

function renderPage(contestId = 'contest-1') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/admin/contests/${contestId}/submissions`]}>
        <Routes>
          <Route
            path="/admin/contests/:contestId/submissions"
            element={<AdminSubmissionsPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const mockContest = {
  id: 'contest-1',
  name: 'Summer Contest',
  description: null,
  slug: 'summer-contest',
  contestCode: 'ABC123',
  rules: null,
  coverImageUrl: null,
  status: 'published' as const,
  winnersPagePassword: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('AdminSubmissionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state while contest loads', () => {
    mockUseContest.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useContest>)
    mockUseAdminSubmissions.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useAdminSubmissions>)

    renderPage()

    // Skeleton elements should be present (no table yet)
    expect(screen.queryByTestId('table')).not.toBeInTheDocument()
  })

  it('shows error state when contest not found', () => {
    mockUseContest.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useContest>)
    mockUseAdminSubmissions.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useAdminSubmissions>)

    renderPage()

    expect(screen.getByText('Contest not found')).toBeInTheDocument()
  })

  it('renders filters, table, and detail when data loads', () => {
    mockUseContest.mockReturnValue({
      data: mockContest,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useContest>)
    mockUseAdminSubmissions.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminSubmissions>)

    renderPage()

    expect(screen.getByTestId('filters')).toBeInTheDocument()
    expect(screen.getByTestId('table')).toBeInTheDocument()
    expect(screen.getByTestId('detail')).toBeInTheDocument()
  })

  it('shows contest name in breadcrumb', () => {
    mockUseContest.mockReturnValue({
      data: mockContest,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useContest>)
    mockUseAdminSubmissions.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminSubmissions>)

    renderPage()

    expect(screen.getByText('Summer Contest')).toBeInTheDocument()
    expect(screen.getByText('Submissions')).toBeInTheDocument()
  })

  it('shows error state when submissions fail to load', () => {
    mockUseContest.mockReturnValue({
      data: mockContest,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useContest>)
    mockUseAdminSubmissions.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
    } as unknown as ReturnType<typeof useAdminSubmissions>)

    renderPage()

    expect(screen.getByText('Failed to load submissions')).toBeInTheDocument()
  })
})
