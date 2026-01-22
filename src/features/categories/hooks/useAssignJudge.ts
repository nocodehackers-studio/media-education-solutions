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
 * @returns TanStack mutation with isNewJudge result
 */
export function useAssignJudge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, email }: AssignJudgeParams) =>
      categoriesApi.assignJudge(categoryId, email),
    onSuccess: () => {
      // Invalidate ALL category queries (covers both contest-level and division-level)
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      // Also invalidate division queries in case they include category counts
      queryClient.invalidateQueries({ queryKey: ['divisions'] });
    },
  });
}
