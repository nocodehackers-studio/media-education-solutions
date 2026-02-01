import { supabase } from '@/lib/supabase'

export interface ParticipantData {
  id: string
  name: string | null
  organizationName: string | null
  tlcName: string | null
  tlcEmail: string | null
  status: string
}

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

interface GetParticipantParams {
  participantId: string
  participantCode: string
  contestId: string
}

interface GetParticipantResponse {
  success: boolean
  participant?: ParticipantData
  error?: string
}

interface GetCategoriesResponse {
  success: boolean
  categories?: ParticipantCategory[]
  contestStatus?: string
  error?: string
}

export interface ParticipantCategoriesResult {
  categories: ParticipantCategory[]
  contestStatus: string | null
}

/**
 * Participants API - handles Edge Function calls for participant data
 */
export const participantsApi = {
  /**
   * Fetch participant data by ID with code verification
   */
  async getParticipant(params: GetParticipantParams): Promise<ParticipantData | null> {
    const { data, error } = await supabase.functions.invoke<GetParticipantResponse>(
      'get-participant',
      { body: params }
    )

    if (error || !data?.success || !data.participant) {
      return null
    }

    return data.participant
  },

  /**
   * Fetch categories for a contest with participant's submission status
   * Story 4-3: Returns only published/closed categories (draft hidden)
   * Story 6-7: Also returns contestStatus for finished contest behavior
   */
  async getCategories(params: GetParticipantParams): Promise<ParticipantCategoriesResult> {
    const { data, error } = await supabase.functions.invoke<GetCategoriesResponse>(
      'get-participant-categories',
      { body: params }
    )

    if (error || !data?.success) {
      throw new Error(data?.error || error?.message || 'Failed to fetch categories')
    }

    return {
      categories: data.categories || [],
      contestStatus: data.contestStatus ?? null,
    }
  },
}
