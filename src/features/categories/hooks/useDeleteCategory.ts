// useDeleteCategory hook - Story 2.5
// Mutation hook for deleting a category

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/categoriesApi';

/**
 * Mutation hook for deleting a category
 * Invalidates categories query on success
 * @param contestId Contest ID for query invalidation
 * @returns TanStack Mutation result
 */
export function useDeleteCategory(contestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => categoriesApi.delete(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', contestId] });
    },
  });
}
