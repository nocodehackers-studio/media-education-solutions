// Story 4-6: Hook to confirm a submission (uploaded → submitted)

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface ConfirmSubmissionParams {
  submissionId: string
  participantId: string
  participantCode: string
}

interface ConfirmSubmissionResponse {
  success: boolean
  submissionId?: string
  error?: string
}

export function useConfirmSubmission() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (params: ConfirmSubmissionParams) => {
      const { data, error } = await supabase.functions.invoke<ConfirmSubmissionResponse>(
        'confirm-submission',
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
        throw new Error(code || 'Failed to confirm submission')
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to confirm submission')
      }

      return data
    },
    onSuccess: () => {
      toast.success('Your submission has been received!')
      queryClient.invalidateQueries({ queryKey: ['participant-categories'] })
      navigate('/participant/categories')
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to confirm submission'
      if (message === 'ALREADY_CONFIRMED') {
        toast.info('This submission has already been confirmed.')
        navigate('/participant/categories')
      } else {
        toast.error(message)
      }
    },
  })
}
