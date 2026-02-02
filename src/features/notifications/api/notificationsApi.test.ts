import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationsApi } from './notificationsApi';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('notificationsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendNotification', () => {
    it('returns success response when Edge Function succeeds', async () => {
      const mockResponse = {
        success: true,
        messageId: 'brevo-123',
        notificationLogId: 'log-456',
      };
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await notificationsApi.sendNotification({
        to: 'judge@test.com',
        type: 'judge_invitation',
        params: { contestName: 'Test Contest' },
        subject: 'You are invited',
        htmlContent: '<p>Hello</p>',
      });

      expect(result).toEqual(mockResponse);
      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'send-notification',
        {
          body: {
            to: 'judge@test.com',
            type: 'judge_invitation',
            params: { contestName: 'Test Contest' },
            subject: 'You are invited',
            htmlContent: '<p>Hello</p>',
          },
        }
      );
    });

    it('returns graceful error when Edge Function fails', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: 'Function invocation failed', name: 'FunctionsError' },
      });

      const result = await notificationsApi.sendNotification({
        to: 'judge@test.com',
        type: 'judge_invitation',
        params: {},
        subject: 'Test',
        htmlContent: '<p>Test</p>',
      });

      expect(result).toEqual({
        success: false,
        error: 'Function invocation failed',
      });
    });
  });

  describe('getNotificationLogs', () => {
    const mockDbRows = [
      {
        id: 'log-1',
        type: 'judge_invitation',
        recipient_email: 'judge@test.com',
        recipient_id: 'user-1',
        related_contest_id: 'contest-1',
        related_category_id: 'cat-1',
        brevo_message_id: 'brevo-1',
        status: 'sent',
        error_message: null,
        retry_count: 0,
        created_at: '2026-02-01T00:00:00Z',
        updated_at: '2026-02-01T00:00:00Z',
      },
    ];

    it('returns transformed logs without filter', async () => {
      const mockLimit = vi.fn().mockResolvedValue({
        data: mockDbRows,
        error: null,
      });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      const result = await notificationsApi.getNotificationLogs();

      expect(supabase.from).toHaveBeenCalledWith('notification_logs');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'log-1',
        type: 'judge_invitation',
        recipientEmail: 'judge@test.com',
        recipientId: 'user-1',
        relatedContestId: 'contest-1',
        relatedCategoryId: 'cat-1',
        brevoMessageId: 'brevo-1',
        status: 'sent',
        errorMessage: null,
        retryCount: 0,
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: '2026-02-01T00:00:00Z',
      });
    });

    it('filters by contestId when provided', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        data: mockDbRows,
        error: null,
      });
      const mockLimit = vi.fn().mockReturnValue({ eq: mockEq });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      await notificationsApi.getNotificationLogs('contest-1');

      expect(mockEq).toHaveBeenCalledWith('related_contest_id', 'contest-1');
    });

    it('throws on database error', async () => {
      const mockLimit = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never);

      await expect(
        notificationsApi.getNotificationLogs()
      ).rejects.toEqual({ message: 'DB error' });
    });
  });
});
