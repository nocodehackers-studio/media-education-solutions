// useCategoriesByJudge hook - Story 3-4
// Query hook for fetching categories assigned to a judge

import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '../api/categoriesApi';

/**
 * Query hook for fetching all categories assigned to a judge
 * Includes contest/division context and submission count
 * @param judgeId Judge's user ID
 * @returns TanStack Query result with categories list
 */
export function useCategoriesByJudge(judgeId: string | undefined) {
  return useQuery({
    queryKey: ['categories', 'judge', judgeId],
    queryFn: () => {
      if (!judgeId) throw new Error('Judge ID required');
      return categoriesApi.listByJudge(judgeId);
    },
    enabled: !!judgeId,
  });
}
