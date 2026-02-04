// Story 4-6: Edge Function to fetch submission data for preview
// Validates participant ownership, returns submission + category info
// Returns libraryId for video embed URL construction
// Story 6-7: Extended to include review feedback when contest is finished

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getRatingTierLabel(rating: number): string {
  if (!Number.isFinite(rating) || rating < 1 || rating > 10) return 'Unknown'
  if (rating <= 2) return 'Developing Skills'
  if (rating <= 4) return 'Emerging Producer'
  if (rating <= 6) return 'Proficient Creator'
  if (rating <= 8) return 'Advanced Producer'
  return 'Master Creator'
}

interface GetSubmissionRequest {
  submissionId: string
  participantId: string
  participantCode: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'METHOD_NOT_ALLOWED' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    const {
      submissionId,
      participantId,
      participantCode,
    }: GetSubmissionRequest = await req.json()

    if (!submissionId || !participantId || !participantCode) {
      return new Response(
        JSON.stringify({ success: false, error: 'MISSING_REQUIRED_FIELDS' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // F2: Validate UUID format before queries
    if (!uuidRegex.test(submissionId) || !uuidRegex.test(participantId)) {
      console.warn('Invalid UUID format in get-submission request')
      return new Response(
        JSON.stringify({ success: false, error: 'INVALID_UUID_FORMAT' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify participant code
    const { data: participant } = await supabaseAdmin
      .from('participants')
      .select('id')
      .eq('id', participantId)
      .eq('code', participantCode.toUpperCase())
      .single()

    if (!participant) {
      console.warn(`Invalid participant code for: ${participantId}`)
      return new Response(
        JSON.stringify({ success: false, error: 'INVALID_PARTICIPANT' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // F3: Single query — fetch submission with ownership check + category join
    // Story 4-7: Include deadline and status for lock detection
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('submissions')
      .select(`
        id, media_type, media_url, bunny_video_id, thumbnail_url,
        status, submitted_at, category_id,
        student_name, tlc_name, tlc_email, group_member_names,
        categories ( name, type, deadline, status )
      `)
      .eq('id', submissionId)
      .eq('participant_id', participantId)
      .single()

    if (submissionError || !submission) {
      // Distinguish not-found from unauthorized
      const { data: exists } = await supabaseAdmin
        .from('submissions')
        .select('id')
        .eq('id', submissionId)
        .single()

      if (!exists) {
        console.warn(`Submission not found: ${submissionId}`)
        return new Response(
          JSON.stringify({ success: false, error: 'SUBMISSION_NOT_FOUND' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      console.warn(`Unauthorized access: ${participantId} does not own ${submissionId}`)
      return new Response(
        JSON.stringify({ success: false, error: 'UNAUTHORIZED' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get library ID for video embed URL construction
    const BUNNY_STREAM_LIBRARY_ID = submission.media_type === 'video'
      ? Deno.env.get('BUNNY_STREAM_LIBRARY_ID') ?? null
      : null

    // Check Bunny encoding status for video submissions
    let videoReady = submission.media_type !== 'video' // photos are always "ready"
    if (submission.media_type === 'video' && submission.bunny_video_id && BUNNY_STREAM_LIBRARY_ID) {
      const BUNNY_STREAM_API_KEY = Deno.env.get('BUNNY_STREAM_API_KEY')
      if (BUNNY_STREAM_API_KEY) {
        try {
          const bunnyRes = await fetch(
            `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${submission.bunny_video_id}`,
            { headers: { AccessKey: BUNNY_STREAM_API_KEY } }
          )
          if (bunnyRes.ok) {
            const videoData = await bunnyRes.json()
            // Bunny status 4 = finished encoding
            videoReady = videoData.status === 4
          }
        } catch (e) {
          console.warn('Failed to check Bunny video status:', e)
          // Default to showing iframe if we can't check
          videoReady = true
        }
      }
    }

    const category = submission.categories as unknown as {
      name: string
      type: string
      deadline: string
      status: string
    }

    // Story 4-7: Compute lock state — deadline passed OR category closed
    const isLocked =
      category?.status === 'closed' ||
      (category?.deadline ? new Date(category.deadline) < new Date() : false)

    // Story 6-7: Get contest status via category → division → contest (sequential for resilience)
    let contestStatus: string | undefined
    const { data: catDiv, error: catDivError } = await supabaseAdmin
      .from('categories')
      .select('division_id')
      .eq('id', submission.category_id)
      .single()

    if (catDivError || !catDiv?.division_id) {
      console.warn(`Could not resolve division for category ${submission.category_id}`)
    } else {
      const { data: divContest, error: divContestError } = await supabaseAdmin
        .from('divisions')
        .select('contest_id')
        .eq('id', catDiv.division_id)
        .single()

      if (divContestError || !divContest?.contest_id) {
        console.warn(`Could not resolve contest for division ${catDiv.division_id}`)
      } else {
        const { data: contestData, error: contestError } = await supabaseAdmin
          .from('contests')
          .select('status')
          .eq('id', divContest.contest_id)
          .single()

        if (contestError || !contestData) {
          console.warn(`Could not fetch contest status for ${divContest.contest_id}`)
        } else {
          contestStatus = contestData.status
        }
      }
    }

    // Story 6-7: If contest is finished, fetch review with effective feedback
    let review = null
    if (contestStatus === 'finished') {
      const { data: reviewRows } = await supabaseAdmin
        .from('reviews')
        .select('rating, feedback, admin_feedback_override')
        .eq('submission_id', submission.id)
        .limit(1)

      const reviewData = reviewRows?.[0] ?? null

      if (reviewData && reviewData.rating != null) {
        const effectiveFeedback = reviewData.admin_feedback_override ?? reviewData.feedback
        review = {
          rating: reviewData.rating,
          ratingTierLabel: getRatingTierLabel(reviewData.rating),
          feedback: effectiveFeedback || '',
        }
      }
    }

    console.log(`Fetched submission: ${submissionId} for participant ${participantId}`)

    return new Response(
      JSON.stringify({
        success: true,
        submission: {
          id: submission.id,
          mediaType: submission.media_type,
          mediaUrl: submission.media_url,
          bunnyVideoId: submission.bunny_video_id,
          thumbnailUrl: submission.thumbnail_url,
          status: submission.status,
          submittedAt: submission.submitted_at,
          categoryId: submission.category_id,
          categoryName: category?.name ?? null,
          categoryType: category?.type ?? null,
          categoryDeadline: category?.deadline ?? null,
          categoryStatus: category?.status ?? null,
          isLocked,
          contestStatus: contestStatus ?? null,
          review,
          studentName: (submission as Record<string, unknown>).student_name ?? null,
          tlcName: (submission as Record<string, unknown>).tlc_name ?? null,
          tlcEmail: (submission as Record<string, unknown>).tlc_email ?? null,
          groupMemberNames: (submission as Record<string, unknown>).group_member_names ?? null,
        },
        libraryId: BUNNY_STREAM_LIBRARY_ID,
        videoReady,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    console.error('get-submission error:', error)
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
