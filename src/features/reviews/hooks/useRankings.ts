// useRankings hook - Story 5.5
// TanStack Query hook for fetching judge's rankings for a category

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts';
import { rankingsApi } from '../api/rankingsApi';

export function useRankings(categoryId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['rankings', categoryId],
    queryFn: () => {
      if (!categoryId || !user) throw new Error('Category ID and user required');
      return rankingsApi.getRankings(categoryId, user.id);
    },
    enabled: !!categoryId && !!user,
  });
}
