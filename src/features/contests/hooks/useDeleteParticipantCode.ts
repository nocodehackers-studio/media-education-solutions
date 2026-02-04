import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contestsApi } from '../api/contestsApi';

export function useDeleteParticipantCode(contestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (participantId: string) =>
      contestsApi.deleteParticipantCode(participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['participant-codes', contestId],
      });
    },
  });
}
