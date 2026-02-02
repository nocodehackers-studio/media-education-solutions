// Story 7-5: TanStack Query hook for notification logs
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../api/notificationsApi';
import type { NotificationType } from '../types/notification.types';

export function useNotificationLogs(
  contestId?: string,
  type?: NotificationType
) {
  return useQuery({
    queryKey: ['notification-logs', contestId, type],
    queryFn: () => notificationsApi.getNotificationLogs(contestId, type),
    enabled: !!contestId,
  });
}
