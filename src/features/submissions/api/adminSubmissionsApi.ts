// Story 6-1: Admin submissions API
// Fetches all submissions with full participant PII for admin view

import { supabase } from '@/lib/supabase'
import type { AdminSubmissionFilters, AdminSubmissionRow } from '../types/adminSubmission.types'
import { transformAdminSubmission } from '../types/adminSubmission.types'
import type { AdminSubmission } from '../types/adminSubmission.types'

export const adminSubmissionsApi = {
  async getContestSubmissions(
    contestId: string,
    filters?: AdminSubmissionFilters
  ): Promise<AdminSubmission[]> {
    let query = supabase
      .from('submissions')
      .select(`
        id, media_type, media_url, bunny_video_id, thumbnail_url,
        status, submitted_at, created_at, disqualified_at, restored_at,
        participants!inner(id, code, name, organization_name, tlc_name, tlc_email),
        categories!inner(
          id, name, type, assigned_judge_id,
          divisions!inner(contest_id),
          assigned_judge:profiles!assigned_judge_id(first_name, last_name)
        ),
        reviews(id, judge_id, rating, feedback, updated_at,
          admin_feedback_override, admin_feedback_override_at,
          judge:profiles!judge_id(first_name, last_name)
        ),
        rankings(id, rank, submission_id, admin_ranking_override, admin_ranking_override_at)
      `)
      .eq('categories.divisions.contest_id', contestId)
      .order('submitted_at', { ascending: false })

    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status as 'submitted' | 'disqualified')
    }
    if (filters?.mediaType) {
      query = query.eq('media_type', filters.mediaType as 'video' | 'photo')
    }

    const { data, error } = await query

    if (error) {
      console.error('[adminSubmissionsApi] getContestSubmissions failed', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      throw new Error(`Failed to fetch submissions: ${error.message}`)
    }

    return (data as unknown as AdminSubmissionRow[]).map(transformAdminSubmission)
  },

  async overrideFeedback(reviewId: string, feedbackOverride: string): Promise<void> {
    // reviews table not in generated Supabase types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from as any)('reviews')
      .update({
        admin_feedback_override: feedbackOverride,
        admin_feedback_override_at: new Date().toISOString(),
      })
      .eq('id', reviewId)

    if (error) throw new Error(`Failed to save feedback override: ${error.message}`)
  },

  async clearFeedbackOverride(reviewId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from as any)('reviews')
      .update({
        admin_feedback_override: null,
        admin_feedback_override_at: null,
      })
      .eq('id', reviewId)

    if (error) throw new Error(`Failed to clear feedback override: ${error.message}`)
  },

  async overrideRankings(
    _categoryId: string,
    overrides: { rankingId: string; overrideSubmissionId: string }[]
  ): Promise<void> {
    for (const override of overrides) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from as any)('rankings')
        .update({
          admin_ranking_override: override.overrideSubmissionId,
          admin_ranking_override_at: new Date().toISOString(),
        })
        .eq('id', override.rankingId)

      if (error) throw new Error(`Failed to save ranking override: ${error.message}`)
    }
  },

  async clearRankingOverrides(categoryId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from as any)('rankings')
      .update({
        admin_ranking_override: null,
        admin_ranking_override_at: null,
      })
      .eq('category_id', categoryId)

    if (error) throw new Error(`Failed to clear ranking overrides: ${error.message}`)
  },

  async disqualifySubmission(submissionId: string): Promise<void> {
    const { data, error } = await supabase
      .from('submissions')
      .update({
        status: 'disqualified',
        disqualified_at: new Date().toISOString(),
        restored_at: null,
      } as Record<string, unknown>)
      .eq('id', submissionId)
      .select('id')

    if (error) throw new Error(`Failed to disqualify submission: ${error.message}`)
    if (!data || data.length === 0) throw new Error('Failed to disqualify submission: no matching submission found')
  },

  async restoreSubmission(submissionId: string): Promise<void> {
    const { data, error } = await supabase
      .from('submissions')
      .update({
        status: 'submitted',
        restored_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('id', submissionId)
      .select('id')

    if (error) throw new Error(`Failed to restore submission: ${error.message}`)
    if (!data || data.length === 0) throw new Error('Failed to restore submission: no matching submission found')
  },
}
