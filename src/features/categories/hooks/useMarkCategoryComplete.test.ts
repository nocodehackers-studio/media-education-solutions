/**
 * useMarkCategoryComplete Unit Tests - Story 5-6
 * Tests the mutation hook for marking a category as complete
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';

// Mock supabase
const mockRpc = vi.fn();
const mockFunctionsInvoke = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    functions: {
      invoke: (...args: unknown[]) => mockFunctionsInvoke(...args),
    },
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

// Mock auth
vi.mock('@/contexts', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'judge-123', email: 'judge@test.com', role: 'judge' },
    isLoading: false,
  })),
}));

import { useMarkCategoryComplete } from './useMarkCategoryComplete';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useMarkCategoryComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls mark_category_complete RPC with category ID', async () => {
    mockRpc.mockResolvedValue({
      data: { success: true, completed_at: '2026-01-30T12:00:00Z' },
      error: null,
    });
    mockFunctionsInvoke.mockResolvedValue({ data: { success: true }, error: null });

    const { result } = renderHook(() => useMarkCategoryComplete(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('cat-123');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockRpc).toHaveBeenCalledWith('mark_category_complete', {
      p_category_id: 'cat-123',
    });
  });

  it('returns error when RPC fails', async () => {
    mockRpc.mockResolvedValue({
      data: { success: false, error: 'REVIEWS_INCOMPLETE' },
      error: null,
    });

    const { result } = renderHook(() => useMarkCategoryComplete(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('cat-123');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      success: false,
      error: 'REVIEWS_INCOMPLETE',
    });
  });

  it('fires admin notification after successful RPC', async () => {
    mockRpc.mockResolvedValue({
      data: { success: true, completed_at: '2026-01-30T12:00:00Z' },
      error: null,
    });
    mockFunctionsInvoke.mockResolvedValue({ data: { success: true }, error: null });

    const { result } = renderHook(() => useMarkCategoryComplete(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('cat-123');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFunctionsInvoke).toHaveBeenCalledWith(
      'notify-admin-category-complete',
      { body: { categoryId: 'cat-123' } }
    );
  });
});
