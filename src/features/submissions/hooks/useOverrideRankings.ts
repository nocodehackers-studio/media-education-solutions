// Story 6-3: Override rankings mutation hook
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminSubmissionsApi } from '../api/adminSubmissionsApi'

export function useOverrideRankings() {
  const queryClient = useQueryClient()

  const overrideMutation = useMutation({
    mutationFn: ({
      categoryId,
      overrides,
    }: {
      categoryId: string
      overrides: { rankingId: string; overrideSubmissionId: string }[]
    }) => adminSubmissionsApi.overrideRankings(categoryId, overrides),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'submissions'] })
    },
  })

  const clearMutation = useMutation({
    mutationFn: (categoryId: string) =>
      adminSubmissionsApi.clearRankingOverrides(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'submissions'] })
    },
  })

  return { overrideMutation, clearMutation }
}
