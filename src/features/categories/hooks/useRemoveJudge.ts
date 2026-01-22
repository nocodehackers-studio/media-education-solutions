// Story 3-1: Hook for removing judge from category
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/categoriesApi';

/**
 * Mutation hook for removing a judge from a category
 * Note: Any existing reviews by the judge remain in the database
 * @returns TanStack mutation
 */
export function useRemoveJudge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => categoriesApi.removeJudge(categoryId),
    onSuccess: () => {
      // Invalidate ALL category queries (covers both contest-level and division-level)
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      // Also invalidate division queries in case they include category counts
      queryClient.invalidateQueries({ queryKey: ['divisions'] });
    },
  });
}
