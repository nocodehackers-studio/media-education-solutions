import { useMutation, useQueryClient } from '@tanstack/react-query';
import { winnersApi } from '../api/winnersApi';

export function useApproveCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => winnersApi.approveCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['winners', 'approval-status'] });
    },
  });
}

export function useUnapproveCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => winnersApi.unapproveCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['winners', 'approval-status'] });
    },
  });
}
