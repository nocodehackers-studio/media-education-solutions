// Story 7-4: Test for T/L/C notification trigger in generateWinnersPage
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase', () => {
  const mockEq = vi.fn();
  const mockUpdate = vi.fn(() => ({ eq: mockEq }));
  const mockInvoke = vi.fn();

  return {
    supabase: {
      from: vi.fn(() => ({ update: mockUpdate })),
      functions: { invoke: mockInvoke },
      __mocks: { mockUpdate, mockEq, mockInvoke },
    },
  };
});

import { winnersApi } from './winnersApi';
import { supabase } from '@/lib/supabase';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { mockEq, mockInvoke } = (supabase as any).__mocks;

describe('winnersApi.generateWinnersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-wire chain: from('contests').update({}).eq('id', x) → resolves {data, error}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mocks = (supabase as any).__mocks;
    mocks.mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ data: {}, error: null });
    mockInvoke.mockResolvedValue({ data: null, error: null });
  });

  it('invokes send-tlc-notification with correct contestId after status update', async () => {
    await winnersApi.generateWinnersPage('contest-123', 'secret');

    expect(mockInvoke).toHaveBeenCalledWith('send-tlc-notification', {
      body: { contestId: 'contest-123' },
    });
  });

  it('does not throw when notification invoke returns an error (non-blocking)', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('Edge Function failed') });

    await expect(
      winnersApi.generateWinnersPage('contest-123', 'secret')
    ).resolves.toBeUndefined();

    expect(mockInvoke).toHaveBeenCalled();
  });

  it('throws when contest status update fails', async () => {
    mockEq.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    await expect(
      winnersApi.generateWinnersPage('contest-123', 'secret')
    ).rejects.toThrow('Failed to generate winners page: DB error');

    expect(mockInvoke).not.toHaveBeenCalled();
  });
});
