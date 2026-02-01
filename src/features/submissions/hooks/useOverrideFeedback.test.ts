// Story 6-3: useOverrideFeedback hook tests

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useOverrideFeedback } from './useOverrideFeedback'

vi.mock('../api/adminSubmissionsApi', () => ({
  adminSubmissionsApi: {
    overrideFeedback: vi.fn(),
    clearFeedbackOverride: vi.fn(),
  },
}))

import { adminSubmissionsApi } from '../api/adminSubmissionsApi'

const mockOverrideFeedback = vi.mocked(adminSubmissionsApi.overrideFeedback)
const mockClearFeedbackOverride = vi.mocked(adminSubmissionsApi.clearFeedbackOverride)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useOverrideFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls overrideFeedback API on mutation', async () => {
    mockOverrideFeedback.mockResolvedValue(undefined)

    const { result } = renderHook(() => useOverrideFeedback(), {
      wrapper: createWrapper(),
    })

    await result.current.overrideMutation.mutateAsync({
      reviewId: 'rev-1',
      feedback: 'Admin corrected feedback',
    })

    expect(mockOverrideFeedback).toHaveBeenCalledWith('rev-1', 'Admin corrected feedback')
  })

  it('calls clearFeedbackOverride API on clear mutation', async () => {
    mockClearFeedbackOverride.mockResolvedValue(undefined)

    const { result } = renderHook(() => useOverrideFeedback(), {
      wrapper: createWrapper(),
    })

    await result.current.clearMutation.mutateAsync('rev-1')

    expect(mockClearFeedbackOverride).toHaveBeenCalledWith('rev-1')
  })

  it('handles override error', async () => {
    mockOverrideFeedback.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useOverrideFeedback(), {
      wrapper: createWrapper(),
    })

    await expect(
      result.current.overrideMutation.mutateAsync({
        reviewId: 'rev-1',
        feedback: 'test',
      })
    ).rejects.toThrow('Network error')

    await waitFor(() => expect(result.current.overrideMutation.isError).toBe(true))
  })
})
