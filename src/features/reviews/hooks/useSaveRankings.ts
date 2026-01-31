// useSaveRankings hook - Story 5.5
// TanStack mutation hook for persisting judge's top 3 rankings

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts';
import { rankingsApi } from '../api/rankingsApi';

export function useSaveRankings(categoryId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (rankings: { rank: number; submissionId: string }[]) => {
      if (!user) throw new Error('Not authenticated');
      if (!categoryId) throw new Error('Category ID required');
      return rankingsApi.saveRankings(categoryId, user.id, rankings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['rankings', categoryId],
      });
    },
  });
}
