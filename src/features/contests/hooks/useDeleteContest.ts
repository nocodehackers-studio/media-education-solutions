import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contestsApi } from '../api/contestsApi';

/**
 * Mutation hook for deleting a contest
 * Automatically invalidates contests query on success
 * @returns TanStack Query mutation result
 */
export function useDeleteContest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contestsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
    },
  });
}
