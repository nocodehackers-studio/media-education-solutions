// useCreateDivision hook - Story 2.9
// Mutation hook for creating a division

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { divisionsApi } from '../api/divisionsApi';
import type { CreateDivisionInput } from '../types/division.schemas';

/**
 * Mutation hook for creating a new division
 * @returns TanStack Query mutation for division creation
 */
export function useCreateDivision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contestId,
      input,
    }: {
      contestId: string;
      input: CreateDivisionInput;
    }) => divisionsApi.create(contestId, input),
    onSuccess: (_, { contestId }) => {
      // Invalidate divisions list for this contest
      queryClient.invalidateQueries({ queryKey: ['divisions', contestId] });
    },
  });
}
