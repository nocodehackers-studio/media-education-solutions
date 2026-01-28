// Story 4-5: Edge Function to finalize photo upload
// Called after PUT upload completes to mark submission as submitted

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface FinalizeRequest {
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
    }: FinalizeRequest = await req.json()

    if (!submissionId || !participantId || !participantCode) {
      return new Response(
        JSON.stringify({ success: false, error: 'MISSING_REQUIRED_FIELDS' }),
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

    // Verify submission exists and belongs to participant
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('submissions')
      .select('id, participant_id, media_url, status')
      .eq('id', submissionId)
      .single()

    if (submissionError || !submission) {
      console.warn(`Submission not found: ${submissionId}`)
      return new Response(
        JSON.stringify({ success: false, error: 'SUBMISSION_NOT_FOUND' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (submission.participant_id !== participantId) {
      console.warn(
        `Unauthorized finalize: ${participantId} != ${submission.participant_id}`
      )
      return new Response(
        JSON.stringify({ success: false, error: 'UNAUTHORIZED' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

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

    // Update submission to submitted (media_url already set during create)
    // For photos, thumbnail_url = media_url (same image)
    const { error: updateError } = await supabaseAdmin
      .from('submissions')
      .update({
        status: 'submitted',
        thumbnail_url: submission.media_url,
      })
      .eq('id', submissionId)

    if (updateError) {
      console.error('Submission update failed:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: 'SUBMISSION_UPDATE_FAILED' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Photo upload finalized: submission=${submissionId}`)

    return new Response(
      JSON.stringify({
        success: true,
        submissionId,
        mediaUrl: submission.media_url,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    console.error('finalize-photo-upload error:', error)
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
