// Story 4-3: Hook for fetching participant's contest categories
import { useQuery } from '@tanstack/react-query'
import { participantsApi, type ParticipantCategory } from '../api/participantsApi'

interface UseParticipantCategoriesParams {
  contestId: string
  participantId: string
  participantCode: string
}

/**
 * Query hook for fetching categories available to a participant.
 * Returns only published/closed categories with submission status.
 */
export function useParticipantCategories({
  contestId,
  participantId,
  participantCode,
}: UseParticipantCategoriesParams) {
  return useQuery<ParticipantCategory[], Error>({
    queryKey: ['participant-categories', contestId, participantId],
    queryFn: () =>
      participantsApi.getCategories({ contestId, participantId, participantCode }),
    enabled: !!contestId && !!participantId && !!participantCode,
  })
}
