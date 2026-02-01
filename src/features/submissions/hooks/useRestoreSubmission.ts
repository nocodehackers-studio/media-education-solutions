// Story 6-4: Restore submission mutation hook
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminSubmissionsApi } from '../api/adminSubmissionsApi'

export function useRestoreSubmission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (submissionId: string) =>
      adminSubmissionsApi.restoreSubmission(submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'submissions'] })
      toast.success('Submission restored')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
