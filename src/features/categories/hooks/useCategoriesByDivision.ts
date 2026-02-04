// useCategoriesByDivision hook - Story 2.9
// Query hook for fetching categories by division

import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '../api/categoriesApi';

/**
 * Query hook for fetching all categories for a division
 * @param divisionId Division ID to filter by
 * @returns TanStack Query result with categories list
 */
export function useCategoriesByDivision(divisionId: string) {
  return useQuery({
    queryKey: ['categories', 'division', divisionId],
    queryFn: () => categoriesApi.listByDivision(divisionId),
    enabled: !!divisionId,
  });
}
