// useUpdateDivision hook - Story 2.9
// Mutation hook for updating a division

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { divisionsApi } from '../api/divisionsApi';
import type { UpdateDivisionInput } from '../types/division.schemas';

/**
 * Mutation hook for updating a division
 * @returns TanStack Query mutation for division update
 */
export function useUpdateDivision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      divisionId,
      input,
    }: {
      divisionId: string;
      contestId: string;
      input: UpdateDivisionInput;
    }) => divisionsApi.update(divisionId, input),
    onSuccess: (_, { contestId }) => {
      // Invalidate divisions list for this contest
      queryClient.invalidateQueries({ queryKey: ['divisions', contestId] });
    },
  });
}
