import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contestsApi } from '../api/contestsApi';

/**
 * Hook to generate new participant codes for a contest
 * @param contestId Contest ID
 */
export function useGenerateCodes(contestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (count: number = 50) =>
      contestsApi.generateParticipantCodes(contestId, count),
    onSuccess: () => {
      // Invalidate all filter variants
      queryClient.invalidateQueries({
        queryKey: ['participant-codes', contestId],
      });
    },
  });
}
