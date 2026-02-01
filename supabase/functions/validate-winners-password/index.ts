// Story 6-6: Edge Function to validate winners page password and return winners data
// CRITICAL: Uses service role to bypass RLS (public page has no auth context)
// Returns winners data ONLY after successful password validation

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface WinnersRequest {
  contestCode: string
  password: string
}

interface EffectiveWinner {
  rank: number
  submissionId: string
  participantName: string
  institution: string
  categoryName: string
  mediaType: string
  mediaUrl: string
  thumbnailUrl: string | null
  vacant: boolean
}

interface CategoryWinners {
  categoryId: string
  categoryName: string
  divisionName: string
  winners: EffectiveWinner[]
}

interface WinnersResponse {
  success: boolean
  error?: string
  contestName?: string
  winners?: CategoryWinners[]
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { contestCode, password }: WinnersRequest = await req.json()

    if (!contestCode || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'MISSING_INPUT' } satisfies WinnersResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1. Find contest by code
    const { data: contest, error: contestError } = await supabaseAdmin
      .from('contests')
      .select('id, name, contest_code, cover_image_url, status, winners_page_password, winners_page_enabled')
      .eq('contest_code', contestCode.trim().toUpperCase())
      .single()

    if (contestError || !contest) {
      return new Response(
        JSON.stringify({ success: false, error: 'CONTEST_NOT_FOUND' } satisfies WinnersResponse),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Check contest is finished
    if (contest.status !== 'finished') {
      return new Response(
        JSON.stringify({ success: false, error: 'CONTEST_NOT_FOUND' } satisfies WinnersResponse),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Check winners page enabled
    if (!contest.winners_page_enabled) {
      return new Response(
        JSON.stringify({ success: false, error: 'WINNERS_NOT_AVAILABLE' } satisfies WinnersResponse),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Compare password (plaintext comparison per Story 6.5 decision)
    if (contest.winners_page_password !== password) {
      return new Response(
        JSON.stringify({ success: false, error: 'INCORRECT_PASSWORD' } satisfies WinnersResponse),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Fetch effective winners (mirrors winnersApi.getEffectiveWinners)
    // Categories linked via divisions: categories.division_id → divisions.contest_id
    const { data: categories, error: catError } = await supabaseAdmin
      .from('categories')
      .select('id, name, type, divisions!inner(name, contest_id)')
      .eq('divisions.contest_id', contest.id)
      .eq('approved_for_winners', true)

    if (catError) {
      console.error('Failed to fetch categories:', catError)
      return new Response(
        JSON.stringify({ success: false, error: 'SERVER_ERROR' } satisfies WinnersResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!categories || categories.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          contestName: contest.name,
          winners: [],
        } satisfies WinnersResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const categoryIds = categories.map((c: Record<string, unknown>) => c.id as string)

    // 7. Get rankings for these categories (top 3 only)
    const { data: rankings, error: rankError } = await supabaseAdmin
      .from('rankings')
      .select('id, rank, category_id, submission_id, admin_ranking_override')
      .in('category_id', categoryIds)
      .lte('rank', 3)
      .order('rank')

    if (rankError) {
      console.error('Failed to fetch rankings:', rankError)
      return new Response(
        JSON.stringify({ success: false, error: 'SERVER_ERROR' } satisfies WinnersResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!rankings || rankings.length === 0) {
      const emptyResult: CategoryWinners[] = categories.map((cat: Record<string, unknown>) => ({
        categoryId: cat.id as string,
        categoryName: cat.name as string,
        divisionName: ((cat as Record<string, unknown>).divisions as Record<string, unknown>).name as string,
        winners: [],
      }))

      return new Response(
        JSON.stringify({
          success: true,
          contestName: contest.name,
          winners: emptyResult,
        } satisfies WinnersResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 8. Collect all submission IDs (both regular and override)
    const submissionIds = new Set<string>()
    for (const r of rankings) {
      if (r.admin_ranking_override) submissionIds.add(r.admin_ranking_override)
      if (r.submission_id) submissionIds.add(r.submission_id)
    }

    // 9. Fetch submission details with participant info
    const { data: submissions, error: subError } = await supabaseAdmin
      .from('submissions')
      .select('id, media_url, thumbnail_url, media_type, status, participant_id, participants!inner(name, organization_name)')
      .in('id', Array.from(submissionIds))

    if (subError) {
      console.error('Failed to fetch submissions:', subError)
      return new Response(
        JSON.stringify({ success: false, error: 'SERVER_ERROR' } satisfies WinnersResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build submissions map
    const submissionMap = new Map<string, Record<string, unknown>>()
    for (const s of (submissions || [])) {
      submissionMap.set(s.id, s as unknown as Record<string, unknown>)
    }

    // 10. Build CategoryWinners array
    const categoryWinners: CategoryWinners[] = []

    for (const cat of categories) {
      const catRankings = (rankings as Record<string, unknown>[])
        .filter((r) => r.category_id === cat.id)
        .sort((a, b) => (a.rank as number) - (b.rank as number))

      const winners: EffectiveWinner[] = []

      for (const ranking of catRankings) {
        // Admin override takes precedence
        const effectiveId = (ranking.admin_ranking_override || ranking.submission_id) as string
        const sub = submissionMap.get(effectiveId)

        // Vacant marker for disqualified/missing submissions
        if (!sub || (sub.status as string) === 'disqualified') {
          winners.push({
            rank: ranking.rank as number,
            submissionId: '',
            participantName: '',
            institution: '',
            categoryName: cat.name as string,
            mediaType: '',
            mediaUrl: '',
            thumbnailUrl: null,
            vacant: true,
          })
          continue
        }

        const participant = sub.participants as Record<string, unknown>

        winners.push({
          rank: ranking.rank as number,
          submissionId: effectiveId,
          participantName: (participant?.name as string) || 'Unknown',
          institution: (participant?.organization_name as string) || '',
          categoryName: cat.name as string,
          mediaType: sub.media_type as string,
          mediaUrl: sub.media_url as string,
          thumbnailUrl: (sub.thumbnail_url as string) || null,
          vacant: false,
        })
      }

      categoryWinners.push({
        categoryId: cat.id as string,
        categoryName: cat.name as string,
        divisionName: ((cat as Record<string, unknown>).divisions as Record<string, unknown>).name as string,
        winners,
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        contestName: contest.name,
        winners: categoryWinners,
      } satisfies WinnersResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Winners validation error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'SERVER_ERROR' } satisfies WinnersResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
