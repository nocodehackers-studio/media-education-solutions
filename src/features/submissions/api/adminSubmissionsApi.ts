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
        status, submitted_at, created_at,
        participants!inner(id, code, name, organization_name, tlc_name, tlc_email),
        categories!inner(
          id, name, type, assigned_judge_id,
          divisions!inner(contest_id),
          assigned_judge:profiles!assigned_judge_id(first_name, last_name)
        ),
        reviews(id, judge_id, rating, feedback, updated_at,
          judge:profiles!judge_id(first_name, last_name)
        ),
        rankings(rank)
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
      throw new Error(`Failed to fetch submissions: ${error.message}`)
    }

    return (data as unknown as AdminSubmissionRow[]).map(transformAdminSubmission)
  },
}
