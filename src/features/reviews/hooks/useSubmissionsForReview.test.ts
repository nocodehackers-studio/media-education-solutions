/**
 * useSubmissionsForReview Hook Tests - Story 5.1 (AC1, AC2, AC4)
 * Tests TanStack Query hook for fetching submissions with review progress
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useSubmissionsForReview } from './useSubmissionsForReview';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

vi.mock('@/lib/errorCodes', () => ({
  ERROR_CODES: { SERVER_ERROR: 'SERVER_ERROR' },
  getErrorMessage: () => 'Something went wrong',
}));

import { supabase } from '@/lib/supabase';

const mockRpcData = [
  {
    id: 'sub-1',
    media_type: 'photo',
    media_url: 'https://cdn.example.com/photo.jpg',
    thumbnail_url: null,
    bunny_video_id: null,
    status: 'submitted',
    submitted_at: '2026-01-15T00:00:00Z',
    participant_code: 'ABC123',
    review_id: null,
    rating: null,
    feedback: null,
  },
  {
    id: 'sub-2',
    media_type: 'video',
    media_url: null,
    thumbnail_url: 'https://cdn.example.com/thumb.jpg',
    bunny_video_id: 'vid-123',
    status: 'submitted',
    submitted_at: '2026-01-16T00:00:00Z',
    participant_code: 'DEF456',
    review_id: 'rev-1',
    rating: 7,
    feedback: 'Good work',
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useSubmissionsForReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls RPC with correct category ID', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockRpcData,
      error: null,
    } as never);

    const { result } = renderHook(() => useSubmissionsForReview('cat-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(supabase.rpc).toHaveBeenCalledWith('get_submissions_for_review', {
      p_category_id: 'cat-1',
    });
  });

  it('transforms snake_case response to camelCase', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockRpcData,
      error: null,
    } as never);

    const { result } = renderHook(() => useSubmissionsForReview('cat-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.[0]).toEqual({
      id: 'sub-1',
      mediaType: 'photo',
      mediaUrl: 'https://cdn.example.com/photo.jpg',
      thumbnailUrl: null,
      bunnyVideoId: null,
      status: 'submitted',
      submittedAt: '2026-01-15T00:00:00Z',
      participantCode: 'ABC123',
      reviewId: null,
      rating: null,
      feedback: null,
    });
  });

  it('computes review progress correctly', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockRpcData,
      error: null,
    } as never);

    const { result } = renderHook(() => useSubmissionsForReview('cat-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.progress).toEqual({
      total: 2,
      reviewed: 1,
      pending: 1,
      percentage: 50,
    });
  });

  it('returns loading state initially', () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [],
      error: null,
    } as never);

    const { result } = renderHook(() => useSubmissionsForReview('cat-1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('does not fetch when categoryId is undefined', () => {
    const { result } = renderHook(() => useSubmissionsForReview(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});
