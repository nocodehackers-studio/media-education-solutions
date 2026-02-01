import { useQuery } from '@tanstack/react-query';
import { winnersApi } from '../api/winnersApi';

export function useEffectiveWinners(contestId: string) {
  return useQuery({
    queryKey: ['winners', 'effective', contestId],
    queryFn: () => winnersApi.getEffectiveWinners(contestId),
    enabled: !!contestId,
  });
}
