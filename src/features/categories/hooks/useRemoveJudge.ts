// Story 3-1: Hook for removing judge from category
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/categoriesApi';

/**
 * Mutation hook for removing a judge from a category
 * Note: Any existing reviews by the judge remain in the database
 * @param contestId Contest ID for cache invalidation
 * @returns TanStack mutation
 */
export function useRemoveJudge(contestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => categoriesApi.removeJudge(categoryId),
    onSuccess: () => {
      // Invalidate all category queries for this contest
      queryClient.invalidateQueries({ queryKey: ['categories', contestId] });
      // Also invalidate division-level queries
      queryClient.invalidateQueries({ queryKey: ['divisions'] });
    },
  });
}
