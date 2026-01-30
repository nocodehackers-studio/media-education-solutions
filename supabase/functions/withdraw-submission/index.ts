// Story 4-7: Edge Function to withdraw (hard delete) a submission
// Deletes submission record from DB and media from Bunny (Stream or Storage)
// CRITICAL: If Bunny delete fails, still delete DB record (orphaned files acceptable)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface WithdrawRequest {
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
    }: WithdrawRequest = await req.json()

    if (!submissionId || !participantId || !participantCode) {
      return new Response(
        JSON.stringify({ success: false, error: 'MISSING_REQUIRED_FIELDS' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!uuidRegex.test(submissionId) || !uuidRegex.test(participantId)) {
      console.warn('Invalid UUID format in withdraw request')
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

    // Fetch submission with ownership check + category join for deadline/status
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('submissions')
      .select(`
        id, media_type, media_url, bunny_video_id, participant_id,
        category_id,
        categories ( status, deadline )
      `)
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

    // Verify ownership
    if (submission.participant_id !== participantId) {
      console.warn(`Unauthorized withdraw: ${participantId} does not own ${submissionId}`)
      return new Response(
        JSON.stringify({ success: false, error: 'UNAUTHORIZED' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const category = submission.categories as unknown as {
      status: string
      deadline: string
    }

    // Check category is not closed
    if (category?.status === 'closed') {
      return new Response(
        JSON.stringify({ success: false, error: 'CATEGORY_CLOSED' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check deadline has not passed
    if (category?.deadline && new Date(category.deadline) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: 'DEADLINE_PASSED' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Delete media from Bunny (best-effort — don't block withdrawal on failure)
    if (submission.media_type === 'video' && submission.bunny_video_id) {
      try {
        const BUNNY_STREAM_API_KEY = Deno.env.get('BUNNY_STREAM_API_KEY')
        const BUNNY_STREAM_LIBRARY_ID = Deno.env.get('BUNNY_STREAM_LIBRARY_ID')
        if (BUNNY_STREAM_API_KEY && BUNNY_STREAM_LIBRARY_ID) {
          const resp = await fetch(
            `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${submission.bunny_video_id}`,
            {
              method: 'DELETE',
              headers: { AccessKey: BUNNY_STREAM_API_KEY },
            }
          )
          console.log(`Bunny Stream delete: video=${submission.bunny_video_id}, status=${resp.status}`)
        }
      } catch (e) {
        console.error('Failed to delete Bunny Stream video:', e)
      }
    } else if (submission.media_type === 'photo' && submission.media_url) {
      try {
        const BUNNY_STORAGE_API_KEY = Deno.env.get('BUNNY_STORAGE_API_KEY')
        const BUNNY_STORAGE_ZONE = Deno.env.get('BUNNY_STORAGE_ZONE')
        const BUNNY_STORAGE_HOSTNAME =
          Deno.env.get('BUNNY_STORAGE_HOSTNAME') || 'storage.bunnycdn.com'
        if (BUNNY_STORAGE_API_KEY && BUNNY_STORAGE_ZONE) {
          const cdnPrefix = `https://${BUNNY_STORAGE_ZONE}.b-cdn.net/`
          const storagePath = submission.media_url.replace(cdnPrefix, '')
          const resp = await fetch(
            `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE}/${storagePath}`,
            {
              method: 'DELETE',
              headers: { AccessKey: BUNNY_STORAGE_API_KEY },
            }
          )
          console.log(`Bunny Storage delete: path=${storagePath}, status=${resp.status}`)
        }
      } catch (e) {
        console.error('Failed to delete Bunny Storage photo:', e)
      }
    }

    // Hard delete submission record from database
    const { error: deleteError } = await supabaseAdmin
      .from('submissions')
      .delete()
      .eq('id', submissionId)
      .eq('participant_id', participantId)

    if (deleteError) {
      console.error('Submission delete failed:', deleteError)
      return new Response(
        JSON.stringify({ success: false, error: 'DELETE_FAILED' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Submission withdrawn: ${submissionId} by participant ${participantId}`)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    console.error('withdraw-submission error:', error)
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
