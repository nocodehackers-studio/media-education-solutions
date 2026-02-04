// Story 4-6: Hook to fetch submission data for preview page
// Story 6-7: Extended with review feedback and contestStatus

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { type ParticipantFeedback } from '@/features/participants'

export interface SubmissionPreviewData {
  id: string
  mediaType: 'video' | 'photo'
  mediaUrl: string | null
  bunnyVideoId: string | null
  thumbnailUrl: string | null
  status: 'uploading' | 'uploaded' | 'submitted' | 'disqualified'
  submittedAt: string
  categoryId: string
  categoryName: string
  categoryType: 'video' | 'photo'
  categoryDeadline: string | null
  categoryStatus: 'draft' | 'published' | 'closed' | null
  isLocked: boolean
  contestStatus: string | null
  review: ParticipantFeedback | null
  studentName: string | null
  tlcName: string | null
  tlcEmail: string | null
  groupMemberNames: string | null
}

interface GetSubmissionResponse {
  success: boolean
  submission?: SubmissionPreviewData
  libraryId?: string | null
  videoReady?: boolean
  error?: string
}

interface UseSubmissionPreviewParams {
  submissionId: string | undefined
  participantId: string
  participantCode: string
}

export function useSubmissionPreview({
  submissionId,
  participantId,
  participantCode,
}: UseSubmissionPreviewParams) {
  return useQuery({
    queryKey: ['submission-preview', submissionId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<GetSubmissionResponse>(
        'get-submission',
        {
          body: {
            submissionId,
            participantId,
            participantCode,
          },
        }
      )

      if (error || !data?.success || !data.submission) {
        throw new Error(data?.error || error?.message || 'Failed to fetch submission')
      }

      return {
        submission: data.submission,
        libraryId: data.libraryId ?? null,
        videoReady: data.videoReady ?? true,
      }
    },
    enabled: !!submissionId && !!participantId && !!participantCode,
    // Auto-poll every 30s — the component stops polling once videoReady is true
    refetchInterval: (query) => {
      const videoReady = query.state.data?.videoReady
      if (videoReady === false) return 30_000
      return false
    },
  })
}
