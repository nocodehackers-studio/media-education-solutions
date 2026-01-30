// Story 4-6: Edge Function to fetch submission data for preview
// Validates participant ownership, returns submission + category info
// Returns libraryId for video embed URL construction

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
        },
        libraryId: BUNNY_STREAM_LIBRARY_ID,
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
