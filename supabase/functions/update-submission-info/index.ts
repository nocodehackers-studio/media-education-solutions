// Edge Function to update submission PII (student name, TLC info, group members)
// Allows editing info without re-uploading media

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface UpdateSubmissionInfoRequest {
  submissionId: string
  participantId: string
  participantCode: string
  studentName: string
  tlcName: string
  tlcEmail: string
  groupMemberNames?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'METHOD_NOT_ALLOWED' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const {
      submissionId,
      participantId,
      participantCode,
      studentName,
      tlcName,
      tlcEmail,
      groupMemberNames,
    }: UpdateSubmissionInfoRequest = await req.json()

    // Validate required fields
    if (!submissionId || !participantId || !participantCode || !studentName || !tlcName || !tlcEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'MISSING_REQUIRED_FIELDS' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate UUID format
    if (!uuidRegex.test(submissionId) || !uuidRegex.test(participantId)) {
      return new Response(
        JSON.stringify({ success: false, error: 'INVALID_UUID_FORMAT' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate email format
    if (!emailRegex.test(tlcEmail)) {
      return new Response(
        JSON.stringify({ success: false, error: 'INVALID_EMAIL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate field lengths
    if (studentName.length > 255 || tlcName.length > 255 || tlcEmail.length > 255) {
      return new Response(
        JSON.stringify({ success: false, error: 'FIELD_TOO_LONG' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (groupMemberNames && groupMemberNames.length > 1000) {
      return new Response(
        JSON.stringify({ success: false, error: 'FIELD_TOO_LONG' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify participant ownership (same pattern as get-submission)
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
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch submission with ownership check + category join for lock detection
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('submissions')
      .select(`
        id, category_id,
        categories ( deadline, status )
      `)
      .eq('id', submissionId)
      .eq('participant_id', participantId)
      .single()

    if (submissionError || !submission) {
      const { data: exists } = await supabaseAdmin
        .from('submissions')
        .select('id')
        .eq('id', submissionId)
        .single()

      if (!exists) {
        return new Response(
          JSON.stringify({ success: false, error: 'SUBMISSION_NOT_FOUND' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: false, error: 'UNAUTHORIZED' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check lock state (deadline passed or category closed)
    const category = submission.categories as unknown as {
      deadline: string
      status: string
    }

    const isLocked =
      category?.status === 'closed' ||
      (category?.deadline ? new Date(category.deadline) < new Date() : false)

    if (isLocked) {
      const errorCode = category?.status === 'closed' ? 'CATEGORY_CLOSED' : 'DEADLINE_PASSED'
      return new Response(
        JSON.stringify({ success: false, error: errorCode }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update submission info
    const { error: updateError } = await supabaseAdmin
      .from('submissions')
      .update({
        student_name: studentName,
        tlc_name: tlcName,
        tlc_email: tlcEmail,
        group_member_names: groupMemberNames || null,
      })
      .eq('id', submissionId)

    if (updateError) {
      console.error('Failed to update submission info:', updateError.message)
      throw updateError
    }

    console.log(`Updated submission info for ${submissionId} by participant ${participantId}`)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    console.error('update-submission-info error:', error)
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
