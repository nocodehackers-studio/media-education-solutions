// Story 6-3: AdminCategoryRankings component tests

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { AdminCategoryRankings } from './AdminCategoryRankings'
import type { AdminSubmission } from '../types/adminSubmission.types'

// Mock @dnd-kit/core to avoid complex DnD setup in tests
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DragOverlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useSensor: () => ({}),
  useSensors: () => [],
  PointerSensor: class {},
  TouchSensor: class {},
  KeyboardSensor: class {},
}))

// Mock review feature DnD components
vi.mock('@/features/reviews', () => ({
  RankingSlot: ({ position }: { position: number }) => (
    <div data-testid={`ranking-slot-${position}`}>Slot {position}</div>
  ),
  DraggableSubmissionCard: ({ submission }: { submission: { id: string; participantCode: string } }) => (
    <div data-testid={`draggable-${submission.id}`}>{submission.participantCode}</div>
  ),
}))

// Mock hooks
vi.mock('../hooks/useAdminSubmissions', () => ({
  useAdminSubmissions: vi.fn(),
}))

vi.mock('../hooks/useOverrideRankings', () => ({
  useOverrideRankings: vi.fn(),
}))

import { useAdminSubmissions } from '../hooks/useAdminSubmissions'
import { useOverrideRankings } from '../hooks/useOverrideRankings'

const mockUseAdminSubmissions = vi.mocked(useAdminSubmissions)
const mockUseOverrideRankings = vi.mocked(useOverrideRankings)

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

function renderWithProviders(ui: ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

function createSubmission(overrides: Partial<AdminSubmission> = {}): AdminSubmission {
  return {
    id: 'sub-1',
    mediaType: 'photo',
    mediaUrl: 'https://example.com/photo.jpg',
    bunnyVideoId: null,
    thumbnailUrl: null,
    status: 'submitted',
    submittedAt: '2026-01-30T10:00:00Z',
    createdAt: '2026-01-30T10:00:00Z',
    participantId: 'p-1',
    participantCode: 'ABC12345',
    participantName: 'Alice Smith',
    organizationName: 'Test Org',
    tlcName: null,
    tlcEmail: null,
    categoryId: 'cat-1',
    categoryName: 'Photography',
    categoryType: 'photo',
    review: {
      reviewId: 'rev-1',
      judgeId: 'judge-1',
      judgeName: 'Jane Doe',
      rating: 8,
      ratingTier: 'Advanced Producer',
      feedback: 'Great work',
      reviewedAt: '2026-01-31T10:00:00Z',
      adminFeedbackOverride: null,
      adminFeedbackOverrideAt: null,
    },
    rankingPosition: null,
    rankingId: null,
    disqualifiedAt: null,
    restoredAt: null,
    adminRankingOverride: null,
    adminRankingOverrideAt: null,
    assignedJudgeName: 'Jane Doe',
    ...overrides,
  }
}

const defaultOverrideRankings = {
  overrideMutation: { isPending: false, mutateAsync: vi.fn() },
  clearMutation: { isPending: false, mutateAsync: vi.fn() },
} as unknown as ReturnType<typeof useOverrideRankings>

describe('AdminCategoryRankings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseOverrideRankings.mockReturnValue(defaultOverrideRankings)
  })

  it('shows loading skeleton when data is loading', () => {
    mockUseAdminSubmissions.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useAdminSubmissions>)

    renderWithProviders(
      <AdminCategoryRankings categoryId="cat-1" contestId="contest-1" />
    )

    // Skeleton elements should be present
    expect(screen.queryByText('Category Rankings')).not.toBeInTheDocument()
  })

  it('shows error state on fetch failure', () => {
    mockUseAdminSubmissions.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed'),
    } as ReturnType<typeof useAdminSubmissions>)

    renderWithProviders(
      <AdminCategoryRankings categoryId="cat-1" contestId="contest-1" />
    )

    expect(screen.getByText('Failed to load rankings')).toBeInTheDocument()
  })

  it('shows empty message when no rankings exist', () => {
    mockUseAdminSubmissions.mockReturnValue({
      data: [createSubmission()],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useAdminSubmissions>)

    renderWithProviders(
      <AdminCategoryRankings categoryId="cat-1" contestId="contest-1" />
    )

    expect(screen.getByText('No rankings submitted yet for this category.')).toBeInTheDocument()
  })

  it('displays effective rankings in view mode', () => {
    const rankedSubs = [
      createSubmission({ id: 'sub-1', participantCode: 'FIRST1', rankingPosition: 1, rankingId: 'rank-1' }),
      createSubmission({ id: 'sub-2', participantCode: 'SECOND', rankingPosition: 2, rankingId: 'rank-2' }),
      createSubmission({ id: 'sub-3', participantCode: 'THIRD3', rankingPosition: 3, rankingId: 'rank-3' }),
    ]

    mockUseAdminSubmissions.mockReturnValue({
      data: rankedSubs,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useAdminSubmissions>)

    renderWithProviders(
      <AdminCategoryRankings categoryId="cat-1" contestId="contest-1" />
    )

    expect(screen.getByText('Category Rankings')).toBeInTheDocument()
    expect(screen.getByText('1st')).toBeInTheDocument()
    expect(screen.getByText('2nd')).toBeInTheDocument()
    expect(screen.getByText('3rd')).toBeInTheDocument()
    expect(screen.getByText('FIRST1')).toBeInTheDocument()
    expect(screen.getByText('SECOND')).toBeInTheDocument()
    expect(screen.getByText('THIRD3')).toBeInTheDocument()
  })

  it('shows Override Rankings button when rankings exist', () => {
    const rankedSubs = [
      createSubmission({ id: 'sub-1', rankingPosition: 1, rankingId: 'rank-1' }),
    ]

    mockUseAdminSubmissions.mockReturnValue({
      data: rankedSubs,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useAdminSubmissions>)

    renderWithProviders(
      <AdminCategoryRankings categoryId="cat-1" contestId="contest-1" />
    )

    expect(screen.getByText('Override Rankings')).toBeInTheDocument()
  })

  it('shows "Overridden" badge when admin override exists', () => {
    const rankedSubs = [
      createSubmission({
        id: 'sub-1',
        participantCode: 'ORIG01',
        rankingPosition: 1,
        rankingId: 'rank-1',
        adminRankingOverride: 'sub-2',
        adminRankingOverrideAt: '2026-02-01T10:00:00Z',
      }),
      createSubmission({
        id: 'sub-2',
        participantCode: 'OVRD02',
        rankingPosition: null,
        rankingId: null,
      }),
    ]

    mockUseAdminSubmissions.mockReturnValue({
      data: rankedSubs,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useAdminSubmissions>)

    renderWithProviders(
      <AdminCategoryRankings categoryId="cat-1" contestId="contest-1" />
    )

    // Two "Overridden" badges: one in header, one on the ranking card
    const overriddenBadges = screen.getAllByText('Overridden')
    expect(overriddenBadges).toHaveLength(2)
    expect(screen.getByText('Edit Override')).toBeInTheDocument()
  })

  it('shows original judge pick alongside override (AC #6)', () => {
    const rankedSubs = [
      createSubmission({
        id: 'sub-1',
        participantCode: 'ORIG01',
        rankingPosition: 1,
        rankingId: 'rank-1',
        adminRankingOverride: 'sub-2',
        adminRankingOverrideAt: '2026-02-01T10:00:00Z',
      }),
      createSubmission({
        id: 'sub-2',
        participantCode: 'OVRD02',
        rankingPosition: null,
        rankingId: null,
      }),
    ]

    mockUseAdminSubmissions.mockReturnValue({
      data: rankedSubs,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useAdminSubmissions>)

    renderWithProviders(
      <AdminCategoryRankings categoryId="cat-1" contestId="contest-1" />
    )

    // Should show the override submission
    expect(screen.getByText('OVRD02')).toBeInTheDocument()
    // Should show original judge's pick
    expect(screen.getByText(/Originally:/)).toBeInTheDocument()
    expect(screen.getByText('ORIG01')).toBeInTheDocument()
  })

  it('enters override mode when Override Rankings is clicked', async () => {
    const user = userEvent.setup()
    const rankedSubs = [
      createSubmission({ id: 'sub-1', rankingPosition: 1, rankingId: 'rank-1' }),
      createSubmission({ id: 'sub-2', rankingPosition: 2, rankingId: 'rank-2' }),
      createSubmission({ id: 'sub-3', rankingPosition: 3, rankingId: 'rank-3' }),
    ]

    mockUseAdminSubmissions.mockReturnValue({
      data: rankedSubs,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useAdminSubmissions>)

    renderWithProviders(
      <AdminCategoryRankings categoryId="cat-1" contestId="contest-1" />
    )

    await user.click(screen.getByText('Override Rankings'))

    // Override mode shows DnD slots and action buttons
    expect(screen.getByText('Override Rankings', { selector: 'h3' })).toBeInTheDocument()
    expect(screen.getByText('Save Override')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('shows rating info for ranked submissions', () => {
    const rankedSubs = [
      createSubmission({
        id: 'sub-1',
        rankingPosition: 1,
        rankingId: 'rank-1',
        review: {
          reviewId: 'rev-1',
          judgeId: 'j-1',
          judgeName: 'Judge',
          rating: 9,
          ratingTier: 'Master Producer',
          feedback: null,
          reviewedAt: '2026-01-31T10:00:00Z',
          adminFeedbackOverride: null,
          adminFeedbackOverrideAt: null,
        },
      }),
    ]

    mockUseAdminSubmissions.mockReturnValue({
      data: rankedSubs,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useAdminSubmissions>)

    renderWithProviders(
      <AdminCategoryRankings categoryId="cat-1" contestId="contest-1" />
    )

    expect(screen.getByText(/Rating: 9\/10/)).toBeInTheDocument()
    expect(screen.getByText(/(Master Producer)/)).toBeInTheDocument()
  })
})
