import { useQuery } from '@tanstack/react-query';
import { contestsApi } from '../api/contestsApi';

/**
 * Hook to fetch recent contests ordered by creation date
 * @param limit Maximum number of contests to return (default 5)
 */
export function useRecentContests(limit: number = 5) {
  return useQuery({
    queryKey: ['recent-contests', limit],
    queryFn: () => contestsApi.listRecentContests(limit),
  });
}
