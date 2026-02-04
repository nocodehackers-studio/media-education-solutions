import { useCategories } from '@/features/categories';
import { useParticipantCodes } from './useParticipantCodes';
import { useAdminSubmissions } from '@/features/submissions';

/**
 * Composes existing hooks to derive contest detail page stats.
 * No new DB queries — reuses cached TanStack Query data.
 */
export function useContestDetailStats(contestId: string) {
  const { data: categories, isLoading: categoriesLoading } = useCategories(contestId);
  const { data: codes, isLoading: codesLoading } = useParticipantCodes(contestId);
  const { data: submissions, isLoading: submissionsLoading } = useAdminSubmissions(contestId);

  const categoryCount = categories?.length ?? 0;
  const categoriesJudged = categories?.filter((c) => c.judgingCompletedAt !== null).length ?? 0;
  const judgingProgressPercent = categoryCount > 0 ? Math.round((categoriesJudged / categoryCount) * 100) : 0;

  const codesTotal = codes?.length ?? 0;
  const codesUsed = codes?.filter((c) => c.status === 'used').length ?? 0;

  const totalSubmissions = submissions?.length ?? 0;

  return {
    totalSubmissions,
    categoryCount,
    codesUsed,
    codesTotal,
    judgingProgressPercent,
    categoriesJudged,
    isLoading: categoriesLoading || codesLoading || submissionsLoading,
  };
}
