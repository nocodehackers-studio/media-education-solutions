// useResendJudgeInvitation hook - Story 7-2
// Mutation hook for manually resending judge invitation email

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/categoriesApi';

/**
 * Mutation hook for resending a judge invitation email
 * Invalidates categories query on success to refresh invited_at timestamp
 * @param contestId Contest ID for query invalidation
 * @returns TanStack Mutation result
 */
export function useResendJudgeInvitation(contestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) =>
      categoriesApi.resendJudgeInvitation(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', contestId] });
      queryClient.invalidateQueries({ queryKey: ['divisions'] });
    },
  });
}
