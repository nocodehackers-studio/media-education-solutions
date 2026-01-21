// useDeleteDivision hook - Story 2.9
// Mutation hook for deleting a division

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { divisionsApi } from '../api/divisionsApi';
import { ERROR_CODES, getErrorMessage } from '@/lib/errorCodes';

/**
 * Mutation hook for deleting a division
 * Checks if this is the last division before allowing deletion
 * @returns TanStack Query mutation for division deletion
 */
export function useDeleteDivision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      divisionId,
      contestId,
    }: {
      divisionId: string;
      contestId: string;
    }) => {
      // Check if this is the last division
      const count = await divisionsApi.getCount(contestId);
      if (count <= 1) {
        throw new Error(getErrorMessage(ERROR_CODES.DIVISION_LAST_REMAINING));
      }

      return divisionsApi.delete(divisionId);
    },
    onSuccess: (_, { contestId }) => {
      // Invalidate divisions list for this contest
      queryClient.invalidateQueries({ queryKey: ['divisions', contestId] });
      // Also invalidate categories as they may have been cascade deleted
      queryClient.invalidateQueries({ queryKey: ['categories', contestId] });
    },
  });
}
