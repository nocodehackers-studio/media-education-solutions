// useMarkCategoryComplete hook - Story 5-6
// TanStack mutation hook for marking a category as complete

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts';
import { categoriesApi } from '../api/categoriesApi';

export function useMarkCategoryComplete() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (categoryId: string) =>
      categoriesApi.markCategoryComplete(categoryId),
    onSuccess: (_data, categoryId) => {
      // Invalidate judge dashboard categories (refreshes judgingCompletedAt)
      queryClient.invalidateQueries({ queryKey: ['categories', 'judge', user?.id] });
      // Invalidate rankings cache for read-only enforcement
      queryClient.invalidateQueries({ queryKey: ['rankings', categoryId] });
    },
  });
}
