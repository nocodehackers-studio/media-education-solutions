// Story 4-7: Hook to withdraw (hard delete) a submission

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface WithdrawSubmissionParams {
  submissionId: string
  participantId: string
  participantCode: string
}

interface WithdrawSubmissionResponse {
  success: boolean
  error?: string
}

export function useWithdrawSubmission(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (params: WithdrawSubmissionParams) => {
      const { data, error } = await supabase.functions.invoke<WithdrawSubmissionResponse>(
        'withdraw-submission',
        { body: params }
      )

      if (error) {
        // Non-2xx: Supabase puts raw Response in error.context, not in data
        let code = ''
        try {
          const ctx = (error as unknown as { context?: Response }).context
          if (ctx instanceof Response) {
            const body = await ctx.json()
            code = body?.error ?? ''
          }
        } catch {
          // Response parsing failed
        }
        throw new Error(code || 'Failed to withdraw submission')
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to withdraw submission')
      }

      return data
    },
    onSuccess: async () => {
      toast.success('Submission withdrawn')
      await queryClient.refetchQueries({ queryKey: ['participant-categories'] })
      queryClient.invalidateQueries({ queryKey: ['submission-preview'] })
      if (options?.onSuccess) {
        options.onSuccess()
      } else {
        navigate('/participant/categories')
      }
    },
    onError: (error) => {
      const code = error instanceof Error ? error.message : ''
      const errorMessages: Record<string, string> = {
        DEADLINE_PASSED: 'Deadline has passed — submission is locked',
        CATEGORY_CLOSED: 'This category is no longer accepting changes',
        INVALID_PARTICIPANT: 'Session expired. Please log in again.',
        SUBMISSION_NOT_FOUND: 'Submission not found. It may have already been removed.',
        UNAUTHORIZED: 'You do not have permission to withdraw this submission.',
      }
      toast.error(errorMessages[code] || 'Failed to withdraw submission')
    },
  })
}
