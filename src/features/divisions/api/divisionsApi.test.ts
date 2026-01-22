// divisionsApi Unit Tests - Story 2.9
// Tests CRUD operations and error handling

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { divisionsApi } from './divisionsApi';
import { supabase } from '@/lib/supabase';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('divisionsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listByContest', () => {
    it('returns transformed divisions with category counts', async () => {
      const mockData = [
        {
          id: 'div-1',
          contest_id: 'contest-1',
          name: 'High School',
          display_order: 0,
          created_at: '2026-01-21T00:00:00Z',
          category_count: [{ count: 3 }],
        },
        {
          id: 'div-2',
          contest_id: 'contest-1',
          name: 'Teachers',
          display_order: 1,
          created_at: '2026-01-21T00:00:00Z',
          category_count: [{ count: 5 }],
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      const result = await divisionsApi.listByContest('contest-1');

      expect(supabase.from).toHaveBeenCalledWith('divisions');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'div-1',
        contestId: 'contest-1',
        name: 'High School',
        displayOrder: 0,
        createdAt: '2026-01-21T00:00:00Z',
        categoryCount: 3,
      });
      expect(result[1].categoryCount).toBe(5);
    });

    it('throws error when query fails', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      await expect(divisionsApi.listByContest('contest-1')).rejects.toThrow();
    });

    it('returns empty array when no divisions exist', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      const result = await divisionsApi.listByContest('contest-1');

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('returns transformed division', async () => {
      const mockData = {
        id: 'div-1',
        contest_id: 'contest-1',
        name: 'General',
        display_order: 0,
        created_at: '2026-01-21T00:00:00Z',
      };

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      const result = await divisionsApi.getById('div-1');

      expect(result).toEqual({
        id: 'div-1',
        contestId: 'contest-1',
        name: 'General',
        displayOrder: 0,
        createdAt: '2026-01-21T00:00:00Z',
        categoryCount: undefined,
      });
    });

    it('throws error when division not found', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
          }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      await expect(divisionsApi.getById('non-existent')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('creates division with auto-incrementing display order', async () => {
      // Mock for getting existing divisions
      const mockSelectOrder = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [{ display_order: 2 }],
              error: null,
            }),
          }),
        }),
      });

      const mockInsertData = {
        id: 'new-div',
        contest_id: 'contest-1',
        name: 'Teen',
        display_order: 3,
        created_at: '2026-01-21T00:00:00Z',
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockInsertData, error: null }),
        }),
      });

      // Chain mock calls
      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: mockSelectOrder } as never;
        }
        return { insert: mockInsert } as never;
      });

      const result = await divisionsApi.create('contest-1', { name: 'Teen' });

      expect(result.name).toBe('Teen');
      expect(result.displayOrder).toBe(3);
    });

    it('creates first division with display order 0', async () => {
      const mockSelectOrder = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      const mockInsertData = {
        id: 'first-div',
        contest_id: 'contest-1',
        name: 'General',
        display_order: 0,
        created_at: '2026-01-21T00:00:00Z',
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockInsertData, error: null }),
        }),
      });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: mockSelectOrder } as never;
        }
        return { insert: mockInsert } as never;
      });

      const result = await divisionsApi.create('contest-1', { name: 'General' });

      expect(result.displayOrder).toBe(0);
    });

    it('throws error when creation fails', async () => {
      const mockSelectOrder = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Insert failed' },
          }),
        }),
      });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: mockSelectOrder } as never;
        }
        return { insert: mockInsert } as never;
      });

      await expect(
        divisionsApi.create('contest-1', { name: 'Test' })
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('updates division name', async () => {
      const mockUpdateData = {
        id: 'div-1',
        contest_id: 'contest-1',
        name: 'Updated Name',
        display_order: 0,
        created_at: '2026-01-21T00:00:00Z',
      };

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockUpdateData, error: null }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never);

      const result = await divisionsApi.update('div-1', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
    });

    it('updates division display order', async () => {
      const mockUpdateData = {
        id: 'div-1',
        contest_id: 'contest-1',
        name: 'Test',
        display_order: 5,
        created_at: '2026-01-21T00:00:00Z',
      };

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockUpdateData, error: null }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never);

      const result = await divisionsApi.update('div-1', {
        name: 'Test',
        displayOrder: 5,
      });

      expect(result.displayOrder).toBe(5);
    });

    it('throws error when update fails', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Update failed' },
            }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never);

      await expect(
        divisionsApi.update('div-1', { name: 'Test' })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('deletes division successfully', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never);

      await expect(divisionsApi.delete('div-1')).resolves.toBeUndefined();
    });

    it('throws error when delete fails', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never);

      await expect(divisionsApi.delete('div-1')).rejects.toThrow();
    });
  });

  describe('getCount', () => {
    it('returns division count for contest', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: 3, error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      const result = await divisionsApi.getCount('contest-1');

      expect(result).toBe(3);
    });

    it('returns 0 when no divisions exist', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      const result = await divisionsApi.getCount('contest-1');

      expect(result).toBe(0);
    });

    it('returns 0 when count is null', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: null, error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

      const result = await divisionsApi.getCount('contest-1');

      expect(result).toBe(0);
    });
  });

  describe('duplicateCategoryToDivisions', () => {
    it('duplicates category to multiple divisions', async () => {
      const mockSourceCategory = {
        id: 'cat-1',
        division_id: 'div-1',
        name: 'Best Video',
        type: 'video',
        description: 'Best video submission',
        rules: 'Some rules',
        deadline: '2026-12-31',
        status: 'draft',
      };

      const mockInsertedCategories = [
        { ...mockSourceCategory, id: 'cat-2', division_id: 'div-2' },
        { ...mockSourceCategory, id: 'cat-3', division_id: 'div-3' },
      ];

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Fetch source category
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockSourceCategory,
                  error: null,
                }),
              }),
            }),
          } as never;
        }
        // Insert duplicates
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: mockInsertedCategories,
              error: null,
            }),
          }),
        } as never;
      });

      const result = await divisionsApi.duplicateCategoryToDivisions('cat-1', [
        'div-2',
        'div-3',
      ]);

      expect(result).toBe(2);
    });

    it('throws error when source category not found', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      } as never);

      await expect(
        divisionsApi.duplicateCategoryToDivisions('non-existent', ['div-1'])
      ).rejects.toThrow();
    });

    it('throws error when insert fails', async () => {
      const mockSourceCategory = {
        id: 'cat-1',
        division_id: 'div-1',
        name: 'Best Video',
        type: 'video',
        description: null,
        rules: null,
        deadline: null,
        status: 'draft',
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockSourceCategory,
                  error: null,
                }),
              }),
            }),
          } as never;
        }
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Insert failed' },
            }),
          }),
        } as never;
      });

      await expect(
        divisionsApi.duplicateCategoryToDivisions('cat-1', ['div-2'])
      ).rejects.toThrow();
    });
  });
});
