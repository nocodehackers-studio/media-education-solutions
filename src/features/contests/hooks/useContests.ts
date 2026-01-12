import { useQuery } from '@tanstack/react-query';
import { contestsApi } from '../api/contestsApi';

/**
 * Query hook for fetching all contests
 * @returns TanStack Query result with contests list
 */
export function useContests() {
  return useQuery({
    queryKey: ['contests'],
    queryFn: () => contestsApi.list(),
  });
}
