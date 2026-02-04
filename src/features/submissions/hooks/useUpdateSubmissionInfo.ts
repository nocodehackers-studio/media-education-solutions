import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface UpdateSubmissionInfoParams {
  submissionId: string
  participantId: string
  participantCode: string
  studentName: string
  tlcName: string
  tlcEmail: string
  groupMemberNames?: string
}

interface UpdateSubmissionInfoResponse {
  success: boolean
  error?: string
}

export function useUpdateSubmissionInfo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: UpdateSubmissionInfoParams) => {
      const { data, error } = await supabase.functions.invoke<UpdateSubmissionInfoResponse>(
        'update-submission-info',
        { body: params }
      )

      if (error) {
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
        throw new Error(code || 'Failed to update submission info')
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to update submission info')
      }

      return data
    },
    onSuccess: (_data, variables) => {
      toast.success('Submission details updated')
      queryClient.invalidateQueries({ queryKey: ['submission-preview', variables.submissionId] })
    },
    onError: (error) => {
      const code = error instanceof Error ? error.message : ''
      const errorMessages: Record<string, string> = {
        DEADLINE_PASSED: 'Deadline has passed — submission is locked',
        CATEGORY_CLOSED: 'This category is no longer accepting changes',
        INVALID_PARTICIPANT: 'Session expired. Please log in again.',
        SUBMISSION_NOT_FOUND: 'Submission not found.',
        UNAUTHORIZED: 'You do not have permission to edit this submission.',
        INVALID_EMAIL: 'Please enter a valid email address.',
        FIELD_TOO_LONG: 'One or more fields exceed the maximum length.',
      }
      toast.error(errorMessages[code] || 'Failed to update submission info')
    },
  })
}
