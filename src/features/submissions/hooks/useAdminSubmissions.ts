// Story 6-1: Admin submissions query hook

import { useQuery } from '@tanstack/react-query'
import { adminSubmissionsApi } from '../api/adminSubmissionsApi'
import type { AdminSubmissionFilters } from '../types/adminSubmission.types'

export function useAdminSubmissions(contestId: string, filters?: AdminSubmissionFilters) {
  return useQuery({
    queryKey: ['admin', 'submissions', contestId, filters],
    queryFn: () => adminSubmissionsApi.getContestSubmissions(contestId, filters),
    enabled: !!contestId,
    placeholderData: (previousData) => previousData,
  })
}
