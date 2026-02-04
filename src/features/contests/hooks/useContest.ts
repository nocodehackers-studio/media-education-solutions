import { useQuery } from '@tanstack/react-query';
import { contestsApi } from '../api/contestsApi';

/**
 * Query hook for fetching a single contest by ID
 * @param contestId Contest ID to fetch
 * @returns TanStack Query result with contest data
 */
export function useContest(contestId: string) {
  return useQuery({
    queryKey: ['contest', contestId],
    queryFn: () => contestsApi.getById(contestId),
    enabled: !!contestId,
    staleTime: 30_000,
  });
}
