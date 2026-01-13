// useCategory hook - Story 2.5
// Query hook for fetching a single category

import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '../api/categoriesApi';

/**
 * Query hook for fetching a single category by ID
 * @param categoryId Category ID
 * @returns TanStack Query result with category
 */
export function useCategory(categoryId: string) {
  return useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => categoriesApi.getById(categoryId),
    enabled: !!categoryId,
  });
}
