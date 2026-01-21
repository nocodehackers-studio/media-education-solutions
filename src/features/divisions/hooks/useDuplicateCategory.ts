// useDuplicateCategory hook - Story 2.9
// Mutation hook for duplicating a category to multiple divisions

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { divisionsApi } from '../api/divisionsApi';

/**
 * Mutation hook for duplicating a category to one or more divisions
 * @returns TanStack Query mutation for category duplication
 */
export function useDuplicateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      targetDivisionIds,
    }: {
      categoryId: string;
      targetDivisionIds: string[];
      contestId: string;
    }) => divisionsApi.duplicateCategoryToDivisions(categoryId, targetDivisionIds),
    onSuccess: (_, { contestId, targetDivisionIds }) => {
      // Invalidate categories for this contest (general query)
      queryClient.invalidateQueries({ queryKey: ['categories', contestId] });

      // AC6: Invalidate division-scoped category queries for each target division
      // This ensures the categories tab updates for all divisions that received copies
      targetDivisionIds.forEach((divisionId) => {
        queryClient.invalidateQueries({ queryKey: ['categories', 'division', divisionId] });
      });

      // Also invalidate divisions to update category counts
      queryClient.invalidateQueries({ queryKey: ['divisions', contestId] });
    },
  });
}
