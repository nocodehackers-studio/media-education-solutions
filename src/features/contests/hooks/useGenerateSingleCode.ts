import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contestsApi } from '../api/contestsApi';

/**
 * Hook to generate a single participant code with organization name
 * Per change proposal 1.3: Single code generation with organization name
 * @param contestId Contest ID
 */
export function useGenerateSingleCode(contestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (organizationName: string) =>
      contestsApi.generateSingleCode(contestId, organizationName),
    onSuccess: () => {
      // Invalidate all filter variants
      queryClient.invalidateQueries({
        queryKey: ['participant-codes', contestId],
      });
    },
  });
}
