import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import type {
  SendNotificationRequest,
  SendNotificationResponse,
  NotificationLog,
} from '../types/notification.types';

type NotificationLogRow =
  Database['public']['Tables']['notification_logs']['Row'];

export const notificationsApi = {
  async sendNotification(
    request: SendNotificationRequest
  ): Promise<SendNotificationResponse> {
    const { data, error } = await supabase.functions.invoke(
      'send-notification',
      {
        body: request,
      }
    );
    if (error) return { success: false, error: error.message };
    return data as SendNotificationResponse;
  },

  async getNotificationLogs(contestId?: string): Promise<NotificationLog[]> {
    let query = supabase
      .from('notification_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (contestId) {
      query = query.eq('related_contest_id', contestId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(transformNotificationLog);
  },
};

function transformNotificationLog(row: NotificationLogRow): NotificationLog {
  return {
    id: row.id,
    type: row.type as NotificationLog['type'],
    recipientEmail: row.recipient_email,
    recipientId: row.recipient_id,
    relatedContestId: row.related_contest_id,
    relatedCategoryId: row.related_category_id,
    brevoMessageId: row.brevo_message_id,
    status: row.status as NotificationLog['status'],
    errorMessage: row.error_message,
    retryCount: row.retry_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
