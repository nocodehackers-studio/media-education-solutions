// Story 3-5: useJudgeProgress hook
// Query hook for fetching review progress for a category

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface JudgeProgress {
  reviewed: number;
  total: number;
}

/**
 * Fetches review progress for a category
 * Returns submission count and review count
 * NOTE: Reviews table created in Epic 5 - returns 0 reviewed until then
 */
export function useJudgeProgress(categoryId: string) {
  return useQuery({
    queryKey: ['judge-progress', categoryId],
    queryFn: async (): Promise<JudgeProgress | null> => {
      // Get total submissions for category
      const { count: totalSubmissions, error: submissionError } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);

      if (submissionError) {
        // Table might not exist yet or no access - return gracefully
        console.warn('Could not fetch submissions:', submissionError.message);
        return null;
      }

      // Get reviewed count (reviews table - Epic 5)
      // For now, return 0 reviewed since table doesn't exist
      // Once reviews table exists:
      // const { count: reviewed } = await supabase
      //   .from('reviews')
      //   .select('*', { count: 'exact', head: true })
      //   .eq('category_id', categoryId);

      return {
        reviewed: 0, // TODO: Update once reviews table exists
        total: totalSubmissions ?? 0,
      };
    },
    enabled: !!categoryId,
  });
}
