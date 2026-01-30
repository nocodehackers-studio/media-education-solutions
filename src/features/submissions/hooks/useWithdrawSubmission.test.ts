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

  it('on error: shows error toast, does not navigate', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { success: false, error: 'DEADLINE_PASSED' },
      error: null,
    })

    const { result } = renderHook(() => useWithdrawSubmission(), { wrapper })

    result.current.mutate(defaultParams)

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(mockToastError).toHaveBeenCalledWith(
      'Deadline has passed — submission is locked'
    )
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('shows user-friendly message for CATEGORY_CLOSED error', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { success: false, error: 'CATEGORY_CLOSED' },
      error: null,
    })

    const { result } = renderHook(() => useWithdrawSubmission(), { wrapper })

    result.current.mutate(defaultParams)

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(mockToastError).toHaveBeenCalledWith(
      'This category is no longer accepting changes'
    )
  })

  it('shows generic message for unknown error codes', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { success: false, error: 'SOME_UNKNOWN_ERROR' },
      error: null,
    })

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

    expect(mockToastError).toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
