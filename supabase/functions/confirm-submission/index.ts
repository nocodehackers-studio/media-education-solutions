// Story 4-6: Edge Function to confirm a submission
// Validates participant owns submission AND status is 'uploaded'
// Uses atomic update to prevent TOCTOU race conditions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface ConfirmRequest {
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
    }: ConfirmRequest = await req.json()

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
      console.warn('Invalid UUID format in confirm request')
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

    // Get category_id from submission for status checks
    const { data: submission, error: submissionLookupError } = await supabaseAdmin
      .from('submissions')
      .select('category_id')
      .eq('id', submissionId)
      .eq('participant_id', participantId)
      .single()

    if (submissionLookupError || !submission) {
      return new Response(
        JSON.stringify({ success: false, error: 'SUBMISSION_NOT_FOUND' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify contest and category are accepting submissions
    const { data: catData, error: catError } = await supabaseAdmin
      .from('categories')
      .select('status, divisions!inner(contests!inner(status))')
      .eq('id', submission.category_id)
      .single()

    if (catError || !catData) {
      return new Response(
        JSON.stringify({ success: false, error: 'CATEGORY_NOT_FOUND' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Extract contest status from the joined data (single() ensures one result)
    const divisions = (catData as Record<string, unknown>).divisions as Record<string, unknown> | null
    const contests = divisions?.contests as Record<string, unknown> | null
    const contestStatus = contests?.status as string | undefined

    if (!contestStatus) {
      console.warn('Could not resolve contest status from category join')
      return new Response(
        JSON.stringify({ success: false, error: 'CONTEST_NOT_FOUND' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (contestStatus !== 'published') {
      console.warn(`Contest not accepting submissions (status: ${contestStatus})`)
      return new Response(
        JSON.stringify({ success: false, error: 'CONTEST_NOT_ACCEPTING' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (catData.status !== 'published') {
      console.warn(`Category not accepting submissions (status: ${catData.status})`)
      return new Response(
        JSON.stringify({ success: false, error: 'CATEGORY_NOT_ACCEPTING' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // F1: Atomic check-and-update — ownership + status validated in WHERE clause
    // F7: Set submitted_at to actual confirmation time
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('submissions')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .eq('participant_id', participantId)
      .eq('status', 'uploaded')
      .select('id')

    if (updateError) {
      console.error('Submission confirm failed:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: 'CONFIRM_FAILED' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // No rows updated — either not found, wrong owner, or wrong status
    if (!updated || updated.length === 0) {
      // Check why: does submission exist?
      const { data: existing } = await supabaseAdmin
        .from('submissions')
        .select('status, participant_id')
        .eq('id', submissionId)
        .single()

      if (!existing) {
        return new Response(
          JSON.stringify({ success: false, error: 'SUBMISSION_NOT_FOUND' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      if (existing.participant_id !== participantId) {
        return new Response(
          JSON.stringify({ success: false, error: 'UNAUTHORIZED' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Status mismatch
      return new Response(
        JSON.stringify({
          success: false,
          error: existing.status === 'submitted'
            ? 'ALREADY_CONFIRMED'
            : 'INVALID_STATUS',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Submission confirmed: ${submissionId}`)

    return new Response(
      JSON.stringify({ success: true, submissionId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    console.error('confirm-submission error:', error)
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
