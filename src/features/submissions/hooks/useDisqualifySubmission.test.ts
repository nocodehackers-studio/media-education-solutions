// Story 6-4: useDisqualifySubmission hook tests

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useDisqualifySubmission } from './useDisqualifySubmission'

vi.mock('../api/adminSubmissionsApi', () => ({
  adminSubmissionsApi: {
    disqualifySubmission: vi.fn(),
  },
}))

import { adminSubmissionsApi } from '../api/adminSubmissionsApi'

const mockDisqualifySubmission = vi.mocked(adminSubmissionsApi.disqualifySubmission)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useDisqualifySubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls disqualifySubmission API on mutation', async () => {
    mockDisqualifySubmission.mockResolvedValue(undefined)

    const { result } = renderHook(() => useDisqualifySubmission(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync('sub-1')

    expect(mockDisqualifySubmission).toHaveBeenCalledWith('sub-1')
  })

  it('handles disqualify error', async () => {
    mockDisqualifySubmission.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useDisqualifySubmission(), {
      wrapper: createWrapper(),
    })

    await expect(result.current.mutateAsync('sub-1')).rejects.toThrow('Network error')

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
