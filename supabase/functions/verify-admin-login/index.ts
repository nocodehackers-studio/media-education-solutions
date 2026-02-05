// Edge Function: verify-admin-login
// Verifies Cloudflare Turnstile token, then performs server-side
// signInWithPassword and returns session tokens + profile to client.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface LoginRequest {
  email: string
  password: string
  turnstileToken: string
}

interface LoginResponse {
  success: boolean
  access_token?: string
  refresh_token?: string
  user?: {
    id: string
    email: string
    role: 'admin' | 'judge'
    first_name: string | null
    last_name: string | null
  }
  error?: string
}

function errorResponse(code: string, status: number): Response {
  return new Response(
    JSON.stringify({ success: false, error: code } satisfies LoginResponse),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, turnstileToken }: LoginRequest = await req.json()

    // Step 1: Validate required fields
    if (!email || !password || !turnstileToken) {
      console.warn('Login failed: missing fields')
      return errorResponse('MISSING_FIELDS', 400)
    }

    // Step 2: Verify Turnstile token
    const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY')
    if (!turnstileSecret) {
      console.error('TURNSTILE_SECRET_KEY is not configured')
      return errorResponse('SERVER_ERROR', 500)
    }
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    const turnstileBody = new URLSearchParams({
      secret: turnstileSecret,
      response: turnstileToken,
    })
    if (clientIp) turnstileBody.set('remoteip', clientIp)
    const turnstileRes = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: turnstileBody,
      },
    )
    const turnstileResult = await turnstileRes.json()
    if (!turnstileResult.success) {
      console.warn('Turnstile verification failed')
      return errorResponse('TURNSTILE_FAILED', 400)
    }

    // Step 3: Sign in with anon key client (respects auth rate limiting)
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const { data: authData, error: authError } =
      await supabaseAuth.auth.signInWithPassword({ email, password })

    // Step 4: Map auth errors
    if (authError || !authData.session) {
      const msg = authError?.message?.toLowerCase() ?? ''
      if (msg.includes('invalid login credentials') || msg.includes('invalid password')) {
        console.warn('Login failed: invalid credentials')
        return errorResponse('AUTH_INVALID_CREDENTIALS', 401)
      }
      if (msg.includes('email not confirmed')) {
        console.warn('Login failed: email not confirmed')
        return errorResponse('EMAIL_NOT_CONFIRMED', 401)
      }
      console.error('Login failed:', authError?.message)
      return errorResponse('SERVER_ERROR', 500)
    }

    // Step 5: Fetch profile using service role (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, first_name, last_name')
      .eq('id', authData.user.id)
      .single()

    // Step 6: No profile = reject
    if (!profile) {
      console.warn('Login failed: no profile found for', authData.user.id)
      return errorResponse('AUTH_INVALID_CREDENTIALS', 401)
    }

    // Step 7: Return success with session tokens + profile
    console.log(`Login success: ${profile.email} (${profile.role})`)
    return new Response(
      JSON.stringify({
        success: true,
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        user: profile,
      } satisfies LoginResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    console.error('Login error:', error)
    return new Response(
      JSON.stringify({ success: false, error: message } satisfies LoginResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
