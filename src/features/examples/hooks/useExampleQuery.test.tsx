/**
 * useExampleQuery Unit Tests (AC4)
 * Tests TanStack Query states: isLoading, isFetching, error
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useProfiles, useProfileById } from './useExampleQuery'

// Mock Supabase client
vi.mock('@/lib', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib'

// Create a fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
}

// Wrapper component with QueryClientProvider
function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('useProfiles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isLoading state (AC4)', () => {
    it('returns isLoading=true on initial load', async () => {
      // Setup mock that never resolves immediately
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue(new Promise(() => {})), // Never resolves
      })
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

      const { result } = renderHook(() => useProfiles(), {
        wrapper: createWrapper(),
      })

      // Initially isLoading should be true
      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('returns isLoading=false after data loads', async () => {
      const mockProfiles = [
        {
          id: '1',
          email: 'test@example.com',
          role: 'admin' as const,
          first_name: 'Test',
          last_name: 'User',
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
      })
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

      const { result } = renderHook(() => useProfiles(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toHaveLength(1)
      expect(result.current.data?.[0].email).toBe('test@example.com')
    })
  })

  describe('isFetching state (AC4)', () => {
    it('returns isFetching=true while request is in-flight', async () => {
      let resolvePromise: (value: { data: unknown[]; error: null }) => void
      const pendingPromise = new Promise<{ data: unknown[]; error: null }>((resolve) => {
        resolvePromise = resolve
      })

      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue(pendingPromise),
      })
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

      const { result } = renderHook(() => useProfiles(), {
        wrapper: createWrapper(),
      })

      // isFetching should be true while waiting
      expect(result.current.isFetching).toBe(true)

      // Resolve the promise
      resolvePromise!({ data: [], error: null })

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false)
      })
    })
  })

  describe('error state (AC4)', () => {
    it('returns error when query fails', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
        }),
      })
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

      const { result } = renderHook(() => useProfiles(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })

      expect(result.current.error?.message).toBe('Database connection failed')
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('data transformation', () => {
    it('transforms snake_case to camelCase', async () => {
      const mockProfiles = [
        {
          id: 'uuid-1',
          email: 'admin@test.com',
          role: 'admin' as const,
          first_name: 'John',
          last_name: 'Doe',
          created_at: '2024-01-15T10:30:00Z',
        },
      ]

      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
      })
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

      const { result } = renderHook(() => useProfiles(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const profile = result.current.data?.[0]
      expect(profile).toEqual({
        id: 'uuid-1',
        email: 'admin@test.com',
        role: 'admin',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: '2024-01-15T10:30:00Z',
      })
    })
  })
})

describe('useProfileById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isLoading state (AC4)', () => {
    it('returns isLoading=true on initial load with id', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockReturnValue(new Promise(() => {})), // Never resolves
        }),
      })
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

      const { result } = renderHook(() => useProfileById('test-id'), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })

    it('does not fetch when id is undefined', () => {
      const { result } = renderHook(() => useProfileById(undefined), {
        wrapper: createWrapper(),
      })

      // Should not be loading since query is disabled
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isFetching).toBe(false)
    })
  })

  describe('error state (AC4)', () => {
    it('returns error when single profile fetch fails', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Profile not found' },
          }),
        }),
      })
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

      const { result } = renderHook(() => useProfileById('non-existent-id'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })

      expect(result.current.error?.message).toBe('Profile not found')
    })
  })

  describe('successful fetch', () => {
    it('returns transformed profile data', async () => {
      const mockProfile = {
        id: 'uuid-123',
        email: 'judge@test.com',
        role: 'judge' as const,
        first_name: 'Jane',
        last_name: 'Smith',
        created_at: '2024-02-01T12:00:00Z',
      }

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      })
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

      const { result } = renderHook(() => useProfileById('uuid-123'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual({
        id: 'uuid-123',
        email: 'judge@test.com',
        role: 'judge',
        firstName: 'Jane',
        lastName: 'Smith',
        createdAt: '2024-02-01T12:00:00Z',
      })
    })
  })
})
