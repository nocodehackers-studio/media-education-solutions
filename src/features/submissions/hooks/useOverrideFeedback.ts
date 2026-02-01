// Story 6-3: Override feedback mutation hook
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminSubmissionsApi } from '../api/adminSubmissionsApi'

export function useOverrideFeedback() {
  const queryClient = useQueryClient()

  const overrideMutation = useMutation({
    mutationFn: ({ reviewId, feedback }: { reviewId: string; feedback: string }) =>
      adminSubmissionsApi.overrideFeedback(reviewId, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'submissions'] })
    },
  })

  const clearMutation = useMutation({
    mutationFn: (reviewId: string) =>
      adminSubmissionsApi.clearFeedbackOverride(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'submissions'] })
    },
  })

  return { overrideMutation, clearMutation }
}
