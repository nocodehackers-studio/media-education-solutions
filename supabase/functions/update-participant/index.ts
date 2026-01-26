// Story 4-2: Edge Function to update participant info
// CRITICAL: Uses service role to bypass RLS (participants are public codes)
// Validates participant code matches before updating

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface UpdateRequest {
  participantId: string
  participantCode: string // For verification
  contestId: string // For verification
  name: string
  organizationName: string
  tlcName: string
  tlcEmail: string
}

interface UpdateResponse {
  success: boolean
  participant?: {
    id: string
    name: string
    organizationName: string
    tlcName: string
    tlcEmail: string
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
    const {
      participantId,
      participantCode,
      contestId,
      name,
      organizationName,
      tlcName,
      tlcEmail,
    }: UpdateRequest = await req.json()

    // Validate required verification fields
    if (!participantId || !participantCode || !contestId) {
      console.warn('Update failed: missing verification data')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'MISSING_VERIFICATION_DATA',
        } satisfies UpdateResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate required form fields
    if (!name || !organizationName || !tlcName || !tlcEmail) {
      console.warn('Update failed: missing required fields')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'MISSING_REQUIRED_FIELDS',
        } satisfies UpdateResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify participant exists and code matches (security check)
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('participants')
      .select('id, code, contest_id')
      .eq('id', participantId)
      .eq('code', participantCode.toUpperCase())
      .eq('contest_id', contestId)
      .single()

    if (fetchError || !existing) {
      console.warn(`Participant not found: ${participantId}`)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'PARTICIPANT_NOT_FOUND',
        } satisfies UpdateResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Update participant record
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('participants')
      .update({
        name: name.trim(),
        organization_name: organizationName.trim(),
        tlc_name: tlcName.trim(),
        tlc_email: tlcEmail.trim().toLowerCase(),
        status: 'used', // Mark as used once info is filled
      })
      .eq('id', participantId)
      .select()
      .single()

    if (updateError) {
      console.error('Update failed:', updateError)
      return new Response(
        JSON.stringify({
          success: false,
          error: `UPDATE_FAILED: ${updateError.message}`,
        } satisfies UpdateResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Participant ${participantId} updated successfully`)
    const response: UpdateResponse = {
      success: true,
      participant: {
        id: updated.id,
        name: updated.name,
        organizationName: updated.organization_name,
        tlcName: updated.tlc_name,
        tlcEmail: updated.tlc_email,
        status: updated.status,
      },
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    console.error('Update participant error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      } satisfies UpdateResponse),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
