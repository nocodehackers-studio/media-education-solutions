// useUpdateCategoryStatus hook - Story 2.5, Story 3-2
// Mutation hook for updating category status
// Story 3-2: Now sends judge invitation email when closing a category

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui';
import { categoriesApi } from '../api/categoriesApi';
import type { CategoryStatus } from '../types/category.types';

interface UpdateStatusResult {
  success: boolean;
  warning?: 'NO_JUDGE_ASSIGNED';
}

/**
 * Mutation hook for updating a category's status
 * Story 3-2: When closing a category, sends judge invitation email
 * Invalidates categories query on success
 * @param contestId Contest ID for query invalidation
 * @returns TanStack Mutation result
 */
export function useUpdateCategoryStatus(contestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      categoryId,
      status,
    }: {
      categoryId: string;
      status: CategoryStatus;
    }): Promise<UpdateStatusResult> => {
      // Update status first
      await categoriesApi.updateStatus(categoryId, status);

      // If closing, try to send judge invitation (Story 3-2)
      if (status === 'closed') {
        const result = await categoriesApi.sendJudgeInvitation(categoryId);

        if (!result.success) {
          if (result.error === 'NO_JUDGE_ASSIGNED') {
            // Return warning for toast display (AC3)
            return { success: true, warning: 'NO_JUDGE_ASSIGNED' };
          }
          // ALREADY_INVITED is not an error - just means no email needed (AC4)
          if (result.error !== 'ALREADY_INVITED') {
            console.error('Failed to send invitation:', result.error);
          }
        }
      }

      return { success: true };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['categories', contestId] });
      queryClient.invalidateQueries({ queryKey: ['divisions'] });

      // Show warning toast if no judge assigned on close (AC3)
      if (result?.warning === 'NO_JUDGE_ASSIGNED') {
        toast.warning('Category closed without judge assigned');
      }
    },
  });
}
