// Story 7-5: TanStack mutation hook for retrying failed notifications
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notificationsApi';

export function useRetryNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (logId: string) => notificationsApi.retryNotification(logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
    },
  });
}
