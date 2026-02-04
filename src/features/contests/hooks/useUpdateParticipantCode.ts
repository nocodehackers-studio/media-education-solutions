import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contestsApi } from '../api/contestsApi';

export function useUpdateParticipantCode(contestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ participantId, organizationName }: { participantId: string; organizationName: string }) =>
      contestsApi.updateParticipantCode(participantId, organizationName),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['participant-codes', contestId],
      });
    },
  });
}
