import { useMutation, useQueryClient } from '@tanstack/react-query';
import { winnersApi } from '../api/winnersApi';

export function useGenerateWinnersPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contestId, password }: { contestId: string; password: string }) =>
      winnersApi.generateWinnersPage(contestId, password),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      queryClient.invalidateQueries({ queryKey: ['contest', variables.contestId] });
    },
  });
}
