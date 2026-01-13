// useUpdateCategoryStatus hook - Story 2.5
// Mutation hook for updating category status

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/categoriesApi';
import type { CategoryStatus } from '../types/category.types';

/**
 * Mutation hook for updating a category's status
 * Invalidates categories query on success
 * @param contestId Contest ID for query invalidation
 * @returns TanStack Mutation result
 */
export function useUpdateCategoryStatus(contestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      status,
    }: {
      categoryId: string;
      status: CategoryStatus;
    }) => categoriesApi.updateStatus(categoryId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', contestId] });
    },
  });
}
