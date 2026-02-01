// Story 6-1: useAdminSubmissions hook tests

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useAdminSubmissions } from './useAdminSubmissions'

vi.mock('../api/adminSubmissionsApi', () => ({
  adminSubmissionsApi: {
    getContestSubmissions: vi.fn(),
  },
}))

import { adminSubmissionsApi } from '../api/adminSubmissionsApi'

const mockGetContestSubmissions = vi.mocked(adminSubmissionsApi.getContestSubmissions)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

const mockSubmission = {
  id: 'sub-1',
  mediaType: 'video' as const,
  mediaUrl: 'https://example.com/video',
  bunnyVideoId: 'bunny-1',
  thumbnailUrl: null,
  status: 'submitted' as const,
  submittedAt: '2026-01-30T10:00:00Z',
  createdAt: '2026-01-30T10:00:00Z',
  participantId: 'p-1',
  participantCode: 'ABC12345',
  participantName: 'Test User',
  organizationName: 'Test School',
  tlcName: 'Teacher',
  tlcEmail: 'teacher@test.com',
  categoryId: 'cat-1',
  categoryName: 'Short Film',
  categoryType: 'video' as const,
  review: null,
  rankingPosition: null,
  assignedJudgeName: 'Test Judge',
}

describe('useAdminSubmissions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches submissions for a contest', async () => {
    mockGetContestSubmissions.mockResolvedValue([mockSubmission])

    const { result } = renderHook(() => useAdminSubmissions('contest-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockGetContestSubmissions).toHaveBeenCalledWith('contest-1', undefined)
    expect(result.current.data).toEqual([mockSubmission])
  })

  it('passes filters to API', async () => {
    mockGetContestSubmissions.mockResolvedValue([])
    const filters = { categoryId: 'cat-1', status: 'submitted' }

    const { result } = renderHook(() => useAdminSubmissions('contest-1', filters), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockGetContestSubmissions).toHaveBeenCalledWith('contest-1', filters)
  })

  it('is disabled when contestId is empty', () => {
    const { result } = renderHook(() => useAdminSubmissions(''), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetContestSubmissions).not.toHaveBeenCalled()
  })

  it('handles API errors', async () => {
    mockGetContestSubmissions.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useAdminSubmissions('contest-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeDefined()
  })
})
