// useCreateCategory hook - Story 2.5
// Mutation hook for creating a category

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/categoriesApi';
import type { CreateCategoryInput } from '../types/category.schemas';

/**
 * Mutation hook for creating a new category
 * Invalidates categories query on success
 * @param contestId Contest ID to create category in
 * @returns TanStack Mutation result
 */
export function useCreateCategory(contestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCategoryInput) =>
      categoriesApi.create(contestId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', contestId] });
    },
  });
}
