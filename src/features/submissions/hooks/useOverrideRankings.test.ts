// Story 6-3: useOverrideRankings hook tests

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useOverrideRankings } from './useOverrideRankings'

vi.mock('../api/adminSubmissionsApi', () => ({
  adminSubmissionsApi: {
    overrideRankings: vi.fn(),
    clearRankingOverrides: vi.fn(),
  },
}))

import { adminSubmissionsApi } from '../api/adminSubmissionsApi'

const mockOverrideRankings = vi.mocked(adminSubmissionsApi.overrideRankings)
const mockClearRankingOverrides = vi.mocked(adminSubmissionsApi.clearRankingOverrides)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useOverrideRankings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls overrideRankings API on mutation', async () => {
    mockOverrideRankings.mockResolvedValue(undefined)

    const overrides = [
      { rankingId: 'rank-1', overrideSubmissionId: 'sub-a' },
      { rankingId: 'rank-2', overrideSubmissionId: 'sub-b' },
    ]

    const { result } = renderHook(() => useOverrideRankings(), {
      wrapper: createWrapper(),
    })

    await result.current.overrideMutation.mutateAsync({
      categoryId: 'cat-1',
      overrides,
    })

    expect(mockOverrideRankings).toHaveBeenCalledWith('cat-1', overrides)
  })

  it('calls clearRankingOverrides API on clear mutation', async () => {
    mockClearRankingOverrides.mockResolvedValue(undefined)

    const { result } = renderHook(() => useOverrideRankings(), {
      wrapper: createWrapper(),
    })

    await result.current.clearMutation.mutateAsync('cat-1')

    expect(mockClearRankingOverrides).toHaveBeenCalledWith('cat-1')
  })

  it('handles override error', async () => {
    mockOverrideRankings.mockRejectedValue(new Error('Failed'))

    const { result } = renderHook(() => useOverrideRankings(), {
      wrapper: createWrapper(),
    })

    await expect(
      result.current.overrideMutation.mutateAsync({
        categoryId: 'cat-1',
        overrides: [{ rankingId: 'rank-1', overrideSubmissionId: 'sub-a' }],
      })
    ).rejects.toThrow('Failed')

    await waitFor(() => expect(result.current.overrideMutation.isError).toBe(true))
  })
})
