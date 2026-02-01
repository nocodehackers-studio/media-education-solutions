// Story 6-6: Edge Function to return public contest metadata
// Returns ONLY name + cover image + enabled status — NO password, NO winners data
// Safe for initial page load before password validation

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface MetadataRequest {
  contestCode: string
}

interface MetadataResponse {
  success: boolean
  name?: string
  coverImageUrl?: string | null
  winnersPageEnabled?: boolean
  error?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { contestCode }: MetadataRequest = await req.json()

    if (!contestCode) {
      return new Response(
        JSON.stringify({ success: false, error: 'MISSING_INPUT' } satisfies MetadataResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Only return public metadata for finished contests
    const { data: contest, error: contestError } = await supabaseAdmin
      .from('contests')
      .select('name, cover_image_url, status, winners_page_enabled')
      .eq('contest_code', contestCode.trim().toUpperCase())
      .eq('status', 'finished')
      .single()

    if (contestError || !contest) {
      return new Response(
        JSON.stringify({ success: false, error: 'CONTEST_NOT_FOUND' } satisfies MetadataResponse),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        name: contest.name,
        coverImageUrl: contest.cover_image_url,
        winnersPageEnabled: contest.winners_page_enabled,
      } satisfies MetadataResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    console.error('Metadata fetch error:', error)
    return new Response(
      JSON.stringify({ success: false, error: message } satisfies MetadataResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
