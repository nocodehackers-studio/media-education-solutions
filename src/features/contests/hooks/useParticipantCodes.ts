import { useQuery } from '@tanstack/react-query';
import { contestsApi } from '../api/contestsApi';

/**
 * Hook to fetch participant codes for a contest
 * @param contestId Contest ID
 * @param filter Filter by status: 'all', 'used', or 'unused'
 */
export function useParticipantCodes(
  contestId: string,
  filter: 'all' | 'used' | 'unused' = 'all'
) {
  return useQuery({
    queryKey: ['participant-codes', contestId, filter],
    queryFn: () => contestsApi.listParticipantCodes(contestId, filter),
    enabled: !!contestId,
    staleTime: 30_000,
  });
}
