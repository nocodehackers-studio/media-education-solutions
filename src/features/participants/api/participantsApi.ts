import { supabase } from '@/lib/supabase'

export interface ParticipantCategory {
  id: string
  name: string
  type: 'video' | 'photo'
  deadline: string
  status: 'published' | 'closed'
  description: string | null
  hasSubmitted: boolean
  submissionStatus: 'uploaded' | 'submitted' | null
  submissionId: string | null
  noSubmission?: boolean
}

export interface ParticipantDivision {
  id: string
  name: string
  displayOrder: number
  categories: ParticipantCategory[]
}

interface GetCategoriesParams {
  participantId: string
  participantCode: string
  contestId: string
}

interface GetCategoriesResponse {
  success: boolean
  categories?: ParticipantCategory[]
  divisions?: ParticipantDivision[]
  contestStatus?: string
  error?: string
}

export interface ParticipantCategoriesResult {
  categories: ParticipantCategory[]
  divisions: ParticipantDivision[]
  contestStatus: string | null
}

/**
 * Participants API - handles Edge Function calls for participant data
 */
export const participantsApi = {
  /**
   * Fetch categories for a contest with participant's submission status
   * Story 4-3: Returns only published/closed categories (draft hidden)
   * Story 6-7: Also returns contestStatus for finished contest behavior
   */
  async getCategories(params: GetCategoriesParams): Promise<ParticipantCategoriesResult> {
    const { data, error } = await supabase.functions.invoke<GetCategoriesResponse>(
      'get-participant-categories',
      { body: params }
    )

    if (error || !data?.success) {
      throw new Error(data?.error || error?.message || 'Failed to fetch categories')
    }

    const categories = data.categories || []

    // Parse divisions from response, falling back to wrapping flat categories
    // in a single unnamed division for backward compat
    const divisions: ParticipantDivision[] = data.divisions?.length
      ? data.divisions
      : categories.length > 0
        ? [{ id: 'default', name: 'Categories', displayOrder: 0, categories }]
        : []

    return {
      categories,
      divisions,
      contestStatus: data.contestStatus ?? null,
    }
  },
}
