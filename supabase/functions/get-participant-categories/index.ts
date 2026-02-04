// Story 4-3: Edge Function to fetch categories with submission status for participants
// Uses service role to bypass RLS
// Returns only published/closed categories (draft hidden per AC3)
// Story 6-7: Added contestStatus and noSubmission flag for finished contests

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface CategoryRequest {
  contestId: string
  participantId: string
  participantCode: string
}

interface CategoryResponse {
  id: string
  name: string
  type: 'video' | 'photo'
  deadline: string
  status: 'published' | 'closed'
  description: string | null
  rules: string | null
  hasSubmitted: boolean
  submissionStatus: 'uploaded' | 'submitted' | null
  submissionId: string | null
  noSubmission?: boolean
  hasFeedback?: boolean
}

interface DivisionResponse {
  id: string
  name: string
  displayOrder: number
  categories: CategoryResponse[]
}

interface ContestInfoResponse {
  name: string
  description: string | null
  rules: string | null
  coverImageUrl: string | null
  logoUrl: string | null
}

interface GetCategoriesResponse {
  success: boolean
  categories?: CategoryResponse[]
  divisions?: DivisionResponse[]
  contest?: ContestInfoResponse
  contestStatus?: string
  acceptingSubmissions?: boolean
  submissionsAvailable?: boolean  // F5: Flag if submissions table was accessible
  error?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'METHOD_NOT_ALLOWED' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { contestId, participantId, participantCode }: CategoryRequest =
      await req.json()

    if (!contestId || !participantId || !participantCode) {
      console.warn('Get categories failed: missing required fields')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'MISSING_REQUIRED_FIELDS',
        } satisfies GetCategoriesResponse),
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

    // F10: Validate UUID format before queries
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(contestId) || !uuidRegex.test(participantId)) {
      console.warn('Invalid UUID format in request')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_UUID_FORMAT',
        } satisfies GetCategoriesResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify participant belongs to contest
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('participants')
      .select('id, status')
      .eq('id', participantId)
      .eq('code', participantCode.toUpperCase())
      .eq('contest_id', contestId)
      .single()

    if (participantError || !participant) {
      console.warn(`Invalid participant: ${participantId}`)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_PARTICIPANT',
        } satisfies GetCategoriesResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // F1: Check participant status - reject banned/inactive participants
    const blockedStatuses = ['banned', 'inactive', 'revoked']
    if (blockedStatuses.includes(participant.status)) {
      console.warn(`Participant ${participantId} denied: status=${participant.status}`)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'PARTICIPANT_INACTIVE',
        } satisfies GetCategoriesResponse),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Story 6-7: Fetch contest status + contest info for participant landing
    const { data: contest, error: contestStatusError } = await supabaseAdmin
      .from('contests')
      .select('status, name, description, rules, cover_image_url, logo_url')
      .eq('id', contestId)
      .single()

    if (contestStatusError) {
      console.warn(`Failed to fetch contest status for ${contestId}:`, contestStatusError.message)
    }

    const contestStatus = contest?.status as string | undefined

    // Enforce contest status: draft/deleted are completely inaccessible
    const allowedStatuses = ['published', 'closed', 'reviewed', 'finished']
    if (!contestStatus || !allowedStatuses.includes(contestStatus)) {
      console.warn(`Contest not available: ${contestId} (status: ${contestStatus})`)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'CONTEST_NOT_AVAILABLE',
        } satisfies GetCategoriesResponse),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Fetch divisions for this contest (include name and display_order for grouping)
    const { data: divisions, error: divisionsError } = await supabaseAdmin
      .from('divisions')
      .select('id, name, display_order')
      .eq('contest_id', contestId)
      .order('display_order', { ascending: true })

    if (divisionsError) {
      throw divisionsError
    }

    const divisionIds = divisions?.map((d) => d.id) || []

    if (divisionIds.length === 0) {
      console.log(`No divisions for contest ${contestId}`)
      return new Response(
        JSON.stringify({
          success: true,
          categories: [],
          divisions: [],
          contest: contest ? {
            name: contest.name,
            description: contest.description ?? null,
            rules: contest.rules ?? null,
            coverImageUrl: contest.cover_image_url ?? null,
            logoUrl: contest.logo_url ?? null,
          } : undefined,
          contestStatus: contestStatus ?? null,
          acceptingSubmissions: contestStatus === 'published',
        } satisfies GetCategoriesResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch categories (published/closed only - AC3: hide draft)
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select('id, name, type, deadline, status, description, rules, division_id')
      .in('division_id', divisionIds)
      .in('status', ['published', 'closed'])
      .order('deadline', { ascending: true })

    if (categoriesError) {
      throw categoriesError
    }

    // Check submissions for this participant (table may not exist yet)
    const submissionMap: Record<string, { status: string; id: string; hasFeedback: boolean }> = {}
    let submissionsAvailable = true
    try {
      const categoryIds = categories?.map((c) => c.id) || []
      if (categoryIds.length > 0) {
        const { data: submissions } = await supabaseAdmin
          .from('submissions')
          .select('id, category_id, status, feedback, score')
          .eq('participant_id', participantId)
          .in('category_id', categoryIds)

        if (submissions) {
          submissions.forEach((s) => {
            submissionMap[s.category_id] = {
              status: s.status,
              id: s.id,
              hasFeedback: s.feedback != null || s.score != null,
            }
          })
        }
      }
    } catch {
      // F5: Flag that submissions table not available - hasSubmitted may be unreliable
      submissionsAvailable = false
      console.log('Submissions table not available yet')
    }

    // Transform to response format
    // Note: Submissions with status 'uploading' are incomplete (upload failed or in progress).
    // Treat them as if no submission exists so the participant can retry via "Submit" button.
    const result: CategoryResponse[] =
      categories?.map((cat) => {
        const sub = submissionMap[cat.id]
        const hasCompletedSubmission = !!sub && sub.status !== 'uploading'
        const subStatus = hasCompletedSubmission
          ? (sub.status as 'uploaded' | 'submitted')
          : undefined
        return {
          id: cat.id,
          name: cat.name,
          type: cat.type as 'video' | 'photo',
          deadline: cat.deadline,
          status: cat.status as 'published' | 'closed',
          description: cat.description,
          rules: cat.rules ?? null,
          hasSubmitted: hasCompletedSubmission,
          submissionStatus: subStatus ?? null,
          submissionId: hasCompletedSubmission ? sub.id : null,
          // Story 6-7: Flag categories with no submission when contest is finished
          ...(contestStatus === 'finished' && !hasCompletedSubmission ? { noSubmission: true } : {}),
          // hasFeedback: true if participant has a submission with feedback or score
          ...(hasCompletedSubmission && sub.hasFeedback ? { hasFeedback: true } : {}),
        }
      }) || []

    // Group categories by division, ordered by division display_order
    const divisionMap = new Map<string, CategoryResponse[]>()
    for (const cat of result) {
      const rawCat = categories?.find((c) => c.id === cat.id)
      const divId = rawCat?.division_id as string
      if (!divisionMap.has(divId)) {
        divisionMap.set(divId, [])
      }
      divisionMap.get(divId)!.push(cat)
    }

    const divisionsResponse: DivisionResponse[] = (divisions ?? []).map((div) => ({
      id: div.id,
      name: div.name,
      displayOrder: div.display_order,
      categories: divisionMap.get(div.id) || [],
    })).filter((d) => d.categories.length > 0)

    console.log(
      `Fetched ${result.length} categories in ${divisionsResponse.length} divisions for participant ${participantId}`
    )

    return new Response(
      JSON.stringify({
        success: true,
        categories: result,
        divisions: divisionsResponse,
        contest: contest ? {
          name: contest.name,
          description: contest.description ?? null,
          rules: contest.rules ?? null,
          coverImageUrl: contest.cover_image_url ?? null,
          logoUrl: contest.logo_url ?? null,
        } : undefined,
        contestStatus: contestStatus ?? null,
        acceptingSubmissions: contestStatus === 'published',
        submissionsAvailable,  // F5: Indicate if hasSubmitted is reliable
      } satisfies GetCategoriesResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    console.error('Get categories error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      } satisfies GetCategoriesResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
