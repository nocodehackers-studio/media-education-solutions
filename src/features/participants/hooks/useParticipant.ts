import { useQuery } from '@tanstack/react-query'
import { participantsApi } from '../api/participantsApi'

interface UseParticipantParams {
  participantId: string
  participantCode: string
  contestId: string
}

/**
 * Query hook for fetching participant data with code verification.
 * Uses TanStack Query for caching and consistent refetch behavior.
 */
export function useParticipant(params: UseParticipantParams | null) {
  return useQuery({
    queryKey: ['participant', params?.participantId],
    queryFn: () => {
      if (!params) return null
      return participantsApi.getParticipant(params)
    },
    enabled: !!params?.participantId && !!params?.participantCode && !!params?.contestId,
    staleTime: 30_000, // 30 seconds - follows global config
    retry: false, // Don't retry on failure (first-time user returns null)
  })
}
