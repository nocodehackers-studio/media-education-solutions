import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contestsApi } from '../api/contestsApi';
import type { CreateContestInput } from '../types/contest.schemas';

/**
 * Mutation hook for creating a new contest
 * Automatically invalidates contests query on success
 * @returns TanStack Query mutation result
 */
export function useCreateContest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateContestInput) => contestsApi.create(input),
    onSuccess: () => {
      // Invalidate and refetch contests list
      queryClient.invalidateQueries({ queryKey: ['contests'] });
    },
  });
}
