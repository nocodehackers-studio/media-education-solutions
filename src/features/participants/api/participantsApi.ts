import { supabase } from '@/lib/supabase'

export interface ParticipantData {
  id: string
  name: string | null
  organizationName: string | null
  tlcName: string | null
  tlcEmail: string | null
  status: string
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
}
