import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contestsApi } from '../api/contestsApi';

/**
 * Mutation hook for restoring a soft-deleted contest
 * Restores contest to draft status and clears deleted_at
 */
export function useRestoreContest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contestsApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      queryClient.invalidateQueries({ queryKey: ['deleted-contests'] });
    },
  });
}
