import { useQuery } from '@tanstack/react-query';
import { contestsApi } from '../api/contestsApi';

/**
 * Hook to fetch active contests (status = 'published')
 */
export function useActiveContests() {
  return useQuery({
    queryKey: ['active-contests'],
    queryFn: () => contestsApi.listActiveContests(),
  });
}
