// Story 4-1: Edge Function to validate participant codes
// CRITICAL: Uses service role to bypass RLS (participants are public codes)
// Returns participant and contest data for session creation

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface ValidationRequest {
  contestCode: string
  participantCode: string
}

interface ValidationResponse {
  success: boolean
  participantId?: string
  contestId?: string
  contestName?: string
  participantData?: {
    organizationName: string | null
    status: string
  }
  error?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { contestCode, participantCode }: ValidationRequest = await req.json()

    if (!contestCode || !participantCode) {
      console.warn('Validation failed: missing codes')
      return new Response(
        JSON.stringify({ success: false, error: 'MISSING_CODES' } satisfies ValidationResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Normalize codes (uppercase, trim)
    const normalizedContestCode = contestCode.trim().toUpperCase()
    const normalizedParticipantCode = participantCode.trim().toUpperCase()

    // Use service role to bypass RLS (participants are public codes)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1. Find contest by code
    const { data: contest, error: contestError } = await supabaseAdmin
      .from('contests')
      .select('id, name, status, contest_code')
      .eq('contest_code', normalizedContestCode)
      .single()

    if (contestError || !contest) {
      console.warn(`Contest not found: ${normalizedContestCode}`)
      return new Response(
        JSON.stringify({ success: false, error: 'CONTEST_NOT_FOUND' } satisfies ValidationResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Check contest status - must be 'published' or 'finished' (finished allows feedback viewing)
    if (!['published', 'finished'].includes(contest.status)) {
      console.warn(`Contest not accepting: ${contest.id} (status: ${contest.status})`)
      return new Response(
        JSON.stringify({ success: false, error: 'CONTEST_NOT_ACCEPTING' } satisfies ValidationResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Find participant by code within this contest
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('participants')
      .select('id, code, status, organization_name')
      .eq('contest_id', contest.id)
      .eq('code', normalizedParticipantCode)
      .single()

    if (participantError || !participant) {
      console.warn(`Invalid participant code for contest ${contest.id}`)
      return new Response(
        JSON.stringify({ success: false, error: 'INVALID_PARTICIPANT_CODE' } satisfies ValidationResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Check participant status - reject banned/inactive participants
    // Valid statuses: 'unused' (new code), 'active' (in use), 'used' (submitted)
    const blockedStatuses = ['banned', 'inactive', 'revoked']
    if (blockedStatuses.includes(participant.status)) {
      console.warn(`Participant ${participant.id} denied: status=${participant.status}`)
      return new Response(
        JSON.stringify({ success: false, error: 'PARTICIPANT_INACTIVE' } satisfies ValidationResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Mark participant code as used (idempotent for already-used codes)
    if (participant.status === 'unused') {
      await supabaseAdmin
        .from('participants')
        .update({ status: 'used' })
        .eq('id', participant.id)
    }

    // 6. Success - return participant and contest data
    console.log(`Participant ${participant.id} validated for contest ${contest.id}`)
    const response: ValidationResponse = {
      success: true,
      participantId: participant.id,
      contestId: contest.id,
      contestName: contest.name,
      participantData: {
        organizationName: participant.organization_name,
        status: participant.status,
      },
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    console.error('Validation error:', error)
    return new Response(
      JSON.stringify({ success: false, error: message } satisfies ValidationResponse),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
