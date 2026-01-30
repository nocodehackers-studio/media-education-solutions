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

export function useWithdrawSubmission() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (params: WithdrawSubmissionParams) => {
      const { data, error } = await supabase.functions.invoke<WithdrawSubmissionResponse>(
        'withdraw-submission',
        { body: params }
      )

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Failed to withdraw submission')
      }

      return data
    },
    onSuccess: () => {
      toast.success('Submission withdrawn')
      queryClient.invalidateQueries({ queryKey: ['participant-categories'] })
      queryClient.invalidateQueries({ queryKey: ['submission-preview'] })
      navigate('/participant/categories')
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to withdraw submission'
      if (message === 'DEADLINE_PASSED') {
        toast.error('Deadline has passed — submission is locked')
      } else if (message === 'CATEGORY_CLOSED') {
        toast.error('This category is no longer accepting changes')
      } else {
        toast.error(message)
      }
    },
  })
}
