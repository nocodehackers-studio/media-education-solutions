import { useQuery } from '@tanstack/react-query';
import { winnersApi } from '../api/winnersApi';

export function useCategoryApprovalStatus(contestId: string) {
  return useQuery({
    queryKey: ['winners', 'approval-status', contestId],
    queryFn: () => winnersApi.getCategoryApprovalStatus(contestId),
    enabled: !!contestId,
  });
}
