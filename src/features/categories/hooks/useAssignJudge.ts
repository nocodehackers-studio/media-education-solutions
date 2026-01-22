// Story 3-1: Hook for assigning judge to category
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/categoriesApi';

interface AssignJudgeParams {
  categoryId: string;
  email: string;
}

/**
 * Mutation hook for assigning a judge to a category
 * If the judge doesn't exist, creates a new judge profile via Edge Function
 * @param contestId Contest ID for cache invalidation
 * @returns TanStack mutation with isNewJudge result
 */
export function useAssignJudge(contestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, email }: AssignJudgeParams) =>
      categoriesApi.assignJudge(categoryId, email),
    onSuccess: () => {
      // Invalidate all category queries for this contest
      queryClient.invalidateQueries({ queryKey: ['categories', contestId] });
      // Also invalidate division-level queries
      queryClient.invalidateQueries({ queryKey: ['divisions'] });
    },
  });
}
