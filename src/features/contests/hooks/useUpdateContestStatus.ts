import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contestsApi } from '../api/contestsApi';
import type { ContestStatus } from '../types/contest.types';

/**
 * Mutation hook for updating a contest's status
 * Automatically invalidates contests queries on success
 * @returns TanStack Query mutation result
 */
export function useUpdateContestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContestStatus }) =>
      contestsApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      queryClient.invalidateQueries({ queryKey: ['contest', variables.id] });
    },
  });
}
