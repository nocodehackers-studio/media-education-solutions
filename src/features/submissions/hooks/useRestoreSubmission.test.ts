// Story 6-4: useRestoreSubmission hook tests

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useRestoreSubmission } from './useRestoreSubmission'

vi.mock('../api/adminSubmissionsApi', () => ({
  adminSubmissionsApi: {
    restoreSubmission: vi.fn(),
  },
}))

import { adminSubmissionsApi } from '../api/adminSubmissionsApi'

const mockRestoreSubmission = vi.mocked(adminSubmissionsApi.restoreSubmission)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useRestoreSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls restoreSubmission API on mutation', async () => {
    mockRestoreSubmission.mockResolvedValue(undefined)

    const { result } = renderHook(() => useRestoreSubmission(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync('sub-1')

    expect(mockRestoreSubmission).toHaveBeenCalledWith('sub-1')
  })

  it('handles restore error', async () => {
    mockRestoreSubmission.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useRestoreSubmission(), {
      wrapper: createWrapper(),
    })

    await expect(result.current.mutateAsync('sub-1')).rejects.toThrow('Network error')

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
