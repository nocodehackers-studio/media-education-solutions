// useUpsertReview hook - Story 5.2 (AC3)
// Mutation hook for upserting judge reviews via Supabase RLS

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts';

interface UpsertReviewParams {
  submissionId: string;
  rating?: number | null;
  feedback?: string | null;
}

export function useUpsertReview(categoryId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ submissionId, rating, feedback }: UpsertReviewParams) => {
      if (!user) throw new Error('Not authenticated');

      // reviews table created by migration, not yet in generated Supabase types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from as any)('reviews')
        .upsert(
          {
            submission_id: submissionId,
            judge_id: user.id,
            rating: rating ?? null,
            feedback: feedback ?? null,
          },
          { onConflict: 'submission_id,judge_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['submissions-for-review', categoryId],
      });
    },
  });
}
