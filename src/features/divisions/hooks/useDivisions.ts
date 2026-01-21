// useDivisions hook - Story 2.9
// Query hook for fetching divisions by contest

import { useQuery } from '@tanstack/react-query';
import { divisionsApi } from '../api/divisionsApi';

/**
 * Query hook for fetching all divisions for a contest
 * @param contestId Contest ID to filter by
 * @returns TanStack Query result with divisions list
 */
export function useDivisions(contestId: string) {
  return useQuery({
    queryKey: ['divisions', contestId],
    queryFn: () => divisionsApi.listByContest(contestId),
    enabled: !!contestId,
  });
}
