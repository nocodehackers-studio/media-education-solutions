// useCategories hook - Story 2.5
// Query hook for fetching categories by contest

import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '../api/categoriesApi';

/**
 * Query hook for fetching all categories for a contest
 * @param contestId Contest ID to filter by
 * @returns TanStack Query result with categories list
 */
export function useCategories(contestId: string) {
  return useQuery({
    queryKey: ['categories', contestId],
    queryFn: () => categoriesApi.listByContest(contestId),
    enabled: !!contestId,
  });
}
