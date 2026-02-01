import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, createElement } from 'react';
import { useGenerateWinnersPage } from './useGenerateWinnersPage';

vi.mock('../api/winnersApi', () => ({
  winnersApi: {
    generateWinnersPage: vi.fn(),
  },
}));

import { winnersApi } from '../api/winnersApi';

const mockGenerate = vi.mocked(winnersApi.generateWinnersPage);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useGenerateWinnersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls winnersApi.generateWinnersPage with contestId and password', async () => {
    mockGenerate.mockResolvedValue(undefined);
    const { result } = renderHook(() => useGenerateWinnersPage(), { wrapper: createWrapper() });

    result.current.mutate({ contestId: 'contest-1', password: 'secret123' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGenerate).toHaveBeenCalledWith('contest-1', 'secret123');
  });

  it('handles generation error', async () => {
    mockGenerate.mockRejectedValue(new Error('generation failed'));
    const { result } = renderHook(() => useGenerateWinnersPage(), { wrapper: createWrapper() });

    result.current.mutate({ contestId: 'contest-1', password: 'test' });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
