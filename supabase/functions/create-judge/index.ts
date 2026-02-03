/**
 * create-judge Edge Function
 *
 * Creates or identifies a judge user account by email.
 * Called by admins when assigning a judge to a category.
 *
 * Flow:
 *   1. Verify caller has a valid auth token (-> 401 UNAUTHORIZED)
 *   2. Verify caller has admin role (-> 403 FORBIDDEN)
 *   3. Validate email input (-> 422 EMAIL_REQUIRED, EMAIL_INVALID)
 *   4. Look up existing profile by email (service role, bypasses RLS):
 *      - If exists as judge -> return { judgeId, isExisting: true }
 *      - If exists with different role -> 409 ROLE_CONFLICT
 *   5. Create new auth user; handle_new_user trigger auto-creates profile with role='judge'
 *      - On failure -> 500 CREATE_FAILED
 *
 * Error codes: UNAUTHORIZED, FORBIDDEN, EMAIL_REQUIRED, EMAIL_INVALID,
 *              ROLE_CONFLICT, CREATE_FAILED, UNKNOWN_ERROR
 *
 * Related: send-judge-invitation is a separate function triggered on category close.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

/** Typed error with an error code and HTTP status for structured responses. */
class EdgeError extends Error {
  constructor(
    public code: string,
    public httpStatus: number
  ) {
    super(code);
    this.name = 'EdgeError';
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // F5: Reject non-POST methods
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('[create-judge] === START ===');

    // Verify caller is authenticated admin
    const authHeader = req.headers.get('Authorization');
    console.log('[create-judge] Auth header present:', !!authHeader);
    if (!authHeader) {
      throw new EdgeError('UNAUTHORIZED', 401);
    }

    // Create client with user's auth context to verify permissions
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify caller is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    console.log('[create-judge] Auth check:', {
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message ?? null,
    });
    if (authError || !user) {
      throw new EdgeError('UNAUTHORIZED', 401);
    }

    // Verify caller is admin (F1: authenticated but wrong role = FORBIDDEN, not UNAUTHORIZED)
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('[create-judge] Profile check:', {
      role: profile?.role,
      profileError: profileError?.message ?? null,
    });
    if (profileError || profile?.role !== 'admin') {
      throw new EdgeError('FORBIDDEN', 403);
    }

    // Parse request body (F13: catch malformed JSON)
    let email: string | undefined;
    try {
      ({ email } = await req.json());
    } catch {
      throw new EdgeError('INVALID_REQUEST_BODY', 400);
    }
    console.log('[create-judge] Requested email:', email);
    if (!email) {
      throw new EdgeError('EMAIL_REQUIRED', 422);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new EdgeError('EMAIL_INVALID', 422);
    }

    // Use service role client for admin operations (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Look up existing profile by email (service role bypasses RLS)
    console.log('[create-judge] Looking up existing profile:', email.toLowerCase());
    const { data: existingProfiles, error: profileLookupError } =
      await supabaseAdmin
        .from('profiles')
        .select('id, role')
        .eq('email', email.toLowerCase())
        .limit(1);

    console.log('[create-judge] Profile lookup result:', {
      count: existingProfiles?.length ?? 0,
      error: profileLookupError?.message ?? null,
    });
    if (profileLookupError) {
      throw new EdgeError('CREATE_FAILED', 500);
    }

    if (existingProfiles && existingProfiles.length > 0) {
      const existingProfile = existingProfiles[0];
      console.log('[create-judge] Existing profile found:', {
        id: existingProfile.id,
        role: existingProfile.role,
      });
      if (existingProfile.role === 'judge') {
        // Already a judge, return their ID
        console.log('[create-judge] Returning existing judge');
        return new Response(
          JSON.stringify({ judgeId: existingProfile.id, isExisting: true }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } else {
        // User exists but not as judge (e.g., admin) - don't convert
        throw new EdgeError('ROLE_CONFLICT', 409);
      }
    }

    // No profile found — create new auth user
    // handle_new_user trigger auto-creates profile with role='judge'
    console.log('[create-judge] Creating new auth user:', email.toLowerCase());
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        email_confirm: true, // Mark email as confirmed (no verification needed)
        user_metadata: { invited_as: 'judge' }, // Note: role is forced in trigger, not from metadata
      });

    console.log('[create-judge] Create user result:', {
      userId: newUser?.user?.id,
      createError: createError?.message ?? null,
    });
    if (createError) {
      throw new EdgeError('CREATE_FAILED', 500);
    }

    console.log('[create-judge] === SUCCESS (new judge) ===');
    return new Response(
      JSON.stringify({ judgeId: newUser.user.id, isExisting: false }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    // F9: Use semantic HTTP status codes from EdgeError, fallback 500
    const code = error instanceof EdgeError ? error.code : 'UNKNOWN_ERROR';
    const status = error instanceof EdgeError ? error.httpStatus : 500;
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[create-judge] ERROR ${code}: ${detail}`);
    return new Response(JSON.stringify({ error: code, detail }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
