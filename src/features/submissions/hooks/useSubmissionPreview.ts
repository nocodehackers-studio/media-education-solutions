// Story 4-6: Hook to fetch submission data for preview page

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

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
}

interface GetSubmissionResponse {
  success: boolean
  submission?: SubmissionPreviewData
  libraryId?: string | null
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
      }
    },
    enabled: !!submissionId && !!participantId && !!participantCode,
  })
}
