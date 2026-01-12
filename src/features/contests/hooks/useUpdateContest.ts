import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contestsApi } from '../api/contestsApi';
import type { UpdateContestInput } from '../types/contest.schemas';

/**
 * Mutation hook for updating a contest
 * Automatically invalidates contests queries on success
 * @param contestId Contest ID to update
 * @returns TanStack Query mutation result
 */
export function useUpdateContest(contestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateContestInput) => contestsApi.update(contestId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      queryClient.invalidateQueries({ queryKey: ['contest', contestId] });
    },
  });
}
