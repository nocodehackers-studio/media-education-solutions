// Story 4-7: Tests for useWithdrawSubmission hook
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useWithdrawSubmission } from './useWithdrawSubmission'

// Mock dependencies
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}))

const mockInvoke = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}))

// Helper: simulate Supabase FunctionsHttpError for non-2xx Edge Function responses
function mockHttpError(errorCode: string) {
  return {
    data: null,
    error: {
      name: 'FunctionsHttpError',
      message: 'Edge Function returned a non-2xx status code',
      context: new Response(
        JSON.stringify({ success: false, error: errorCode }),
        { headers: { 'Content-Type': 'application/json' } }
      ),
    },
  }
}

const defaultParams = {
  submissionId: 'sub-123',
  participantId: 'participant-456',
  participantCode: 'ABC123',
}

describe('useWithdrawSubmission', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
      },
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)

  it('calls withdraw-submission Edge Function with correct params', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { success: true },
      error: null,
    })

    const { result } = renderHook(() => useWithdrawSubmission(), { wrapper })

    result.current.mutate(defaultParams)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockInvoke).toHaveBeenCalledWith('withdraw-submission', {
      body: defaultParams,
    })
  })

  it('on success: invalidates queries, shows toast, navigates', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { success: true },
      error: null,
    })

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useWithdrawSubmission(), { wrapper })

    result.current.mutate(defaultParams)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockToastSuccess).toHaveBeenCalledWith('Submission withdrawn')
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['participant-categories'],
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['submission-preview'],
    })
    expect(mockNavigate).toHaveBeenCalledWith('/participant/categories')
  })

  it('extracts DEADLINE_PASSED error code from non-2xx response', async () => {
    mockInvoke.mockResolvedValueOnce(mockHttpError('DEADLINE_PASSED'))

    const { result } = renderHook(() => useWithdrawSubmission(), { wrapper })

    result.current.mutate(defaultParams)

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(mockToastError).toHaveBeenCalledWith(
      'Deadline has passed — submission is locked'
    )
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('extracts CATEGORY_CLOSED error code from non-2xx response', async () => {
    mockInvoke.mockResolvedValueOnce(mockHttpError('CATEGORY_CLOSED'))

    const { result } = renderHook(() => useWithdrawSubmission(), { wrapper })

    result.current.mutate(defaultParams)

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(mockToastError).toHaveBeenCalledWith(
      'This category is no longer accepting changes'
    )
  })

  it('shows generic message for unknown error codes', async () => {
    mockInvoke.mockResolvedValueOnce(mockHttpError('SOME_UNKNOWN_ERROR'))

    const { result } = renderHook(() => useWithdrawSubmission(), { wrapper })

    result.current.mutate(defaultParams)

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(mockToastError).toHaveBeenCalledWith(
      'Failed to withdraw submission'
    )
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('handles network/invoke error gracefully', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: new Error('Network error'),
    })

    const { result } = renderHook(() => useWithdrawSubmission(), { wrapper })

    result.current.mutate(defaultParams)

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(mockToastError).toHaveBeenCalledWith(
      'Failed to withdraw submission'
    )
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
