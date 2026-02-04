import { useQuery } from '@tanstack/react-query';
import { contestsApi } from '../api/contestsApi';

/**
 * Query hook for fetching soft-deleted contests
 * Used by the Trash section on the contests page
 */
export function useDeletedContests() {
  return useQuery({
    queryKey: ['deleted-contests'],
    queryFn: () => contestsApi.listDeleted(),
  });
}
