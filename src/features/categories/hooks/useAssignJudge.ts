// Story 3-1: Hook for assigning judge to category
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui';
import { categoriesApi } from '../api/categoriesApi';

interface AssignJudgeParams {
  categoryId: string;
  email: string;
}

/**
 * Mutation hook for assigning a judge to a category.
 * If the judge doesn't exist, creates a new judge profile via Edge Function.
 *
 * Error codes (from categoriesApi.assignJudge) are mapped to user-friendly
 * toast messages here in onError, following the pattern from useWithdrawSubmission.ts:57-66.
 */
export function useAssignJudge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, email }: AssignJudgeParams) =>
      categoriesApi.assignJudge(categoryId, email),
    onSuccess: (data) => {
      if (data.isNewJudge) {
        toast.success('Judge assigned - invite will be sent when category closes');
      } else {
        toast.success('Judge assigned');
      }
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['divisions'] });
    },
    onError: (error) => {
      const code = error instanceof Error ? error.message : '';
      const errorMessages: Record<string, string> = {
        UNAUTHORIZED: 'Your session has expired. Please sign in again.',
        FORBIDDEN: "You don't have permission to assign judges.",
        ROLE_CONFLICT: 'This email is already registered with a different account type.',
        CREATE_FAILED: 'Unable to create the judge account. Please try again.',
        EMAIL_REQUIRED: 'Please enter an email address.',
        EMAIL_INVALID: 'Please enter a valid email address.',
      };
      // JUDGE_ASSIGN_FAILED and UNKNOWN_ERROR intentionally fall through to the
      // generic message — they have no user-actionable detail to add.
      toast.error(
        errorMessages[code] ||
          'Something went wrong while assigning the judge. Please try again.'
      );
    },
  });
}
