// useCreateCategory hook - Story 2.5, updated for Story 2.9
// Mutation hook for creating a category

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/categoriesApi';
import type { CreateCategoryInput } from '../types/category.schemas';

/**
 * Mutation hook for creating a new category
 * Story 2-9: Categories now belong to divisions
 * Invalidates categories queries on success
 * @param divisionId Division ID to create category in
 * @param contestId Contest ID (for query invalidation)
 * @returns TanStack Mutation result
 */
export function useCreateCategory(divisionId: string, contestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCategoryInput) =>
      categoriesApi.create(divisionId, input),
    onSuccess: () => {
      // Invalidate both contest-level and division-level queries
      queryClient.invalidateQueries({ queryKey: ['categories', contestId] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'division', divisionId] });
      // Also invalidate divisions to update category counts
      queryClient.invalidateQueries({ queryKey: ['divisions', contestId] });
    },
  });
}
