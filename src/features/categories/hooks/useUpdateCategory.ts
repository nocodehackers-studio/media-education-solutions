// useUpdateCategory hook - Story 2.5
// Mutation hook for updating a category

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/categoriesApi';
import type { UpdateCategoryInput } from '../types/category.schemas';

/**
 * Mutation hook for updating a category
 * Invalidates categories query on success
 * @param contestId Contest ID for query invalidation
 * @returns TanStack Mutation result
 */
export function useUpdateCategory(contestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      input,
    }: {
      categoryId: string;
      input: UpdateCategoryInput;
    }) => categoriesApi.update(categoryId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', contestId] });
    },
  });
}
