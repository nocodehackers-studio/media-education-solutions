import { useMutation, useQueryClient } from '@tanstack/react-query';
import { winnersApi } from '../api/winnersApi';

export function useUpdateWinnersPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contestId, password }: { contestId: string; password: string }) =>
      winnersApi.updateWinnersPassword(contestId, password),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contest', variables.contestId] });
    },
  });
}

export function useRevokeWinnersPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contestId: string) => winnersApi.revokeWinnersPage(contestId),
    onSuccess: (_, contestId) => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      queryClient.invalidateQueries({ queryKey: ['contest', contestId] });
    },
  });
}

export function useReactivateWinnersPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contestId: string) => winnersApi.reactivateWinnersPage(contestId),
    onSuccess: (_, contestId) => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      queryClient.invalidateQueries({ queryKey: ['contest', contestId] });
    },
  });
}
