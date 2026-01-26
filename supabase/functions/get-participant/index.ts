// Story 4-2: Edge Function to fetch participant data for pre-filling form
// CRITICAL: Uses service role to bypass RLS (participants are public codes)
// Validates code + contestId match before returning

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface GetRequest {
  participantId: string
  participantCode: string
  contestId: string
}

interface GetResponse {
  success: boolean
  participant?: {
    id: string
    name: string | null
    organizationName: string | null
    tlcName: string | null
    tlcEmail: string | null
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
    const { participantId, participantCode, contestId }: GetRequest =
      await req.json()

    if (!participantId || !participantCode || !contestId) {
      console.warn('Get participant failed: missing verification data')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'MISSING_VERIFICATION_DATA',
        } satisfies GetResponse),
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

    // Fetch participant with code verification
    const { data, error } = await supabaseAdmin
      .from('participants')
      .select('id, name, organization_name, tlc_name, tlc_email, status')
      .eq('id', participantId)
      .eq('code', participantCode.toUpperCase())
      .eq('contest_id', contestId)
      .single()

    if (error || !data) {
      console.warn(`Participant not found: ${participantId}`)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'NOT_FOUND',
        } satisfies GetResponse),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Participant ${participantId} fetched successfully`)
    const response: GetResponse = {
      success: true,
      participant: {
        id: data.id,
        name: data.name,
        organizationName: data.organization_name,
        tlcName: data.tlc_name,
        tlcEmail: data.tlc_email,
        status: data.status,
      },
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    console.error('Get participant error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      } satisfies GetResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
