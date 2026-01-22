// Story 3-1: Edge Function to create judge profiles
// CRITICAL: Uses service role to create auth user
// The handle_new_user trigger will auto-create profile with role='judge'

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify caller is authenticated admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
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
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify caller is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      throw new Error('Admin access required');
    }

    // Parse request body
    const { email } = await req.json();
    if (!email) {
      throw new Error('Email is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Use service role client to create user (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if user already exists with this email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      // User exists - check if they're already a judge
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, role')
        .eq('id', existingUser.id)
        .single();

      if (existingProfile?.role === 'judge') {
        // Already a judge, return their ID
        return new Response(
          JSON.stringify({ judgeId: existingUser.id, isExisting: true }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } else {
        // User exists but not as judge (e.g., admin) - don't convert
        throw new Error('User exists with a different role');
      }
    }

    // Create new auth user (trigger will auto-create profile with role='judge')
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        email_confirm: true, // Mark email as confirmed (no verification needed)
        user_metadata: { invited_as: 'judge' }, // Note: role is forced in trigger, not from metadata
      });

    if (createError) {
      throw createError;
    }

    return new Response(
      JSON.stringify({ judgeId: newUser.user.id, isExisting: false }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
