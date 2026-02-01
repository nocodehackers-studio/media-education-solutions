// Story 6-4: Disqualify submission mutation hook
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminSubmissionsApi } from '../api/adminSubmissionsApi'

export function useDisqualifySubmission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (submissionId: string) =>
      adminSubmissionsApi.disqualifySubmission(submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'submissions'] })
      toast.success('Submission disqualified')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
