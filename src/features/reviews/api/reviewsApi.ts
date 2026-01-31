// Reviews API - Story 5.1
// Supabase RPC operations for judge review dashboard

import { supabase } from '@/lib/supabase';
import { ERROR_CODES, getErrorMessage } from '@/lib/errorCodes';
import { transformSubmissionForReview } from '../types/review.types';
import type { SubmissionForReview, SubmissionForReviewRow } from '../types/review.types';

export const reviewsApi = {
  /**
   * Fetch all submissions for review in a category
   * Uses SECURITY DEFINER RPC to ensure anonymous judging
   * @param categoryId Category ID to fetch submissions for
   * @returns Submissions with review status for the current judge
   */
  async getSubmissionsForReview(categoryId: string): Promise<SubmissionForReview[]> {
    // @ts-expect-error RPC function created by migration, not yet in generated Supabase types
    const { data, error } = await supabase.rpc('get_submissions_for_review', {
      p_category_id: categoryId,
    });

    if (error) {
      const isAuthError = error.message?.includes('Not authorized');
      const code = isAuthError ? ERROR_CODES.AUTH_UNAUTHORIZED : ERROR_CODES.SERVER_ERROR;
      throw new Error(getErrorMessage(code));
    }

    return ((data ?? []) as SubmissionForReviewRow[]).map(transformSubmissionForReview);
  },
};
