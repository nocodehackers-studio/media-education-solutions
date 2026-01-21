import { useQuery } from '@tanstack/react-query';
import { contestsApi } from '../api/contestsApi';

/**
 * Hook to fetch dashboard statistics
 * Returns total contests, active contests, total participants, and total submissions
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => contestsApi.getStats(),
    staleTime: 30_000, // 30 seconds - stats don't need to be real-time
  });
}
