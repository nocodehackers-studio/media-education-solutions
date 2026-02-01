// Story 4-3: Hook for fetching participant's contest categories
// Story 6-7: Extended to return contestStatus for finished contest behavior
import { useQuery } from '@tanstack/react-query'
import { participantsApi, type ParticipantCategoriesResult } from '../api/participantsApi'

interface UseParticipantCategoriesParams {
  contestId: string
  participantId: string
  participantCode: string
}

/**
 * Query hook for fetching categories available to a participant.
 * Returns only published/closed categories with submission status.
 * Story 6-7: Also returns contestStatus for finished contest behavior.
 */
export function useParticipantCategories({
  contestId,
  participantId,
  participantCode,
}: UseParticipantCategoriesParams) {
  return useQuery<ParticipantCategoriesResult, Error>({
    queryKey: ['participant-categories', contestId, participantId],
    queryFn: () =>
      participantsApi.getCategories({ contestId, participantId, participantCode }),
    enabled: !!contestId && !!participantId && !!participantCode,
  })
}
