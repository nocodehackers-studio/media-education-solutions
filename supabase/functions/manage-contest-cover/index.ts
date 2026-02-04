/**
 * manage-contest-cover Edge Function
 *
 * Handles upload and deletion of contest cover images and logos via Bunny Storage.
 * Admin-only. Routes by Content-Type:
 *   - multipart/form-data -> UPLOAD (file + contestId + type?)
 *   - application/json    -> DELETE ({ contestId, action: "delete", type? })
 * `type` defaults to "cover". Pass "logo" for logo operations.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log('[manage-contest-cover] Module loaded');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

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
  console.log('[manage-contest-cover] Request received:', req.method, req.url);
  console.log('[manage-contest-cover] Content-Type:', req.headers.get('Content-Type'));
  console.log('[manage-contest-cover] Authorization present:', !!req.headers.get('Authorization'));

  // CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('[manage-contest-cover] CORS preflight');
    return new Response('ok', { headers: corsHeaders });
  }

  // POST-only
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('[manage-contest-cover] === START POST ===');

    // --- Auth: verify caller is admin ---
    const authHeader = req.headers.get('Authorization');
    console.log('[manage-contest-cover] Auth header:', authHeader ? authHeader.slice(0, 30) + '...' : 'MISSING');
    if (!authHeader) {
      throw new EdgeError('UNAUTHORIZED', 401);
    }

    console.log('[manage-contest-cover] Creating supabase client...');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    console.log('[manage-contest-cover] Calling getUser...');
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    console.log('[manage-contest-cover] getUser result:', { userId: user?.id, authError: authError?.message ?? null });
    if (authError || !user) {
      throw new EdgeError('UNAUTHORIZED', 401);
    }

    console.log('[manage-contest-cover] Checking admin role...');
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('[manage-contest-cover] Profile check:', { role: profile?.role, profileError: profileError?.message ?? null });
    if (profileError || profile?.role !== 'admin') {
      throw new EdgeError('FORBIDDEN', 403);
    }

    // Service role client for DB mutations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Bunny Storage config
    const BUNNY_STORAGE_API_KEY = Deno.env.get('BUNNY_STORAGE_API_KEY');
    const BUNNY_STORAGE_ZONE = Deno.env.get('BUNNY_STORAGE_ZONE');
    const BUNNY_STORAGE_HOSTNAME =
      Deno.env.get('BUNNY_STORAGE_HOSTNAME') || 'storage.bunnycdn.com';

    if (!BUNNY_STORAGE_API_KEY || !BUNNY_STORAGE_ZONE) {
      console.error('Bunny Storage config missing');
      throw new EdgeError('BUNNY_CONFIG_MISSING', 500);
    }

    // --- Route by Content-Type ---
    const contentType = req.headers.get('Content-Type') || '';
    console.log('[manage-contest-cover] Routing by Content-Type:', contentType);

    if (contentType.includes('multipart/form-data')) {
      // ========== UPLOAD FLOW ==========
      console.log('[manage-contest-cover] Parsing FormData...');
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const contestId = formData.get('contestId') as string | null;
      const type = (formData.get('type') as string | null) || 'cover';

      if (!file || !contestId) {
        throw new EdgeError('MISSING_REQUIRED_FIELDS', 400);
      }

      const isLogo = type === 'logo';
      const storagePrefix = isLogo ? 'logos' : 'covers';
      const dbColumn = isLogo ? 'logo_url' : 'cover_image_url';
      const responseKey = isLogo ? 'logoUrl' : 'coverImageUrl';

      // Validate file size (5MB max)
      const MAX_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        throw new EdgeError('FILE_TOO_LARGE', 400);
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        throw new EdgeError('INVALID_FILE_TYPE', 400);
      }

      // Verify contest exists
      const { data: contest, error: contestError } = await supabaseAdmin
        .from('contests')
        .select('id, cover_image_url, logo_url')
        .eq('id', contestId)
        .single();

      if (contestError || !contest) {
        throw new EdgeError('CONTEST_NOT_FOUND', 404);
      }

      // Delete old image from Bunny if exists
      const oldUrl = isLogo ? contest.logo_url : contest.cover_image_url;
      if (oldUrl) {
        try {
          const cdnPrefix = `https://${BUNNY_STORAGE_ZONE}.b-cdn.net/`;
          const oldStoragePath = oldUrl.replace(cdnPrefix, '');
          const deleteResp = await fetch(
            `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE}/${oldStoragePath}`,
            {
              method: 'DELETE',
              headers: { AccessKey: BUNNY_STORAGE_API_KEY },
            }
          );
          console.log(
            `Deleted old ${type}: path=${oldStoragePath}, status=${deleteResp.status}`
          );
        } catch (e) {
          console.error(`Failed to delete old ${type}:`, e);
          // Continue — don't block the new upload
        }
      }

      // Build storage path
      const timestamp = Date.now();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${storagePrefix}/${contestId}/${timestamp}_${safeFileName}`;

      // Upload to Bunny Storage
      const uploadUrl = `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE}/${storagePath}`;
      const cdnUrl = `https://${BUNNY_STORAGE_ZONE}.b-cdn.net/${storagePath}`;

      const fileBuffer = await file.arrayBuffer();
      const bunnyResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          AccessKey: BUNNY_STORAGE_API_KEY,
          'Content-Type': file.type,
        },
        body: fileBuffer,
      });

      if (!bunnyResponse.ok) {
        const errorText = await bunnyResponse.text();
        console.error('Bunny Storage upload failed:', errorText);
        throw new EdgeError('STORAGE_UPLOAD_FAILED', 500);
      }

      // Update contest record
      const { error: updateError } = await supabaseAdmin
        .from('contests')
        .update({ [dbColumn]: cdnUrl })
        .eq('id', contestId);

      if (updateError) {
        console.error('Contest update failed:', updateError);
        throw new EdgeError('DB_UPDATE_FAILED', 500);
      }

      console.log(
        `[manage-contest-cover] Upload success: type=${type}, contest=${contestId}, path=${storagePath}`
      );

      return new Response(
        JSON.stringify({ success: true, [responseKey]: cdnUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // ========== DELETE FLOW ==========
      let contestId: string | undefined;
      let action: string | undefined;
      let type: string | undefined;
      try {
        ({ contestId, action, type } = await req.json());
      } catch {
        throw new EdgeError('INVALID_REQUEST_BODY', 400);
      }

      if (!contestId || action !== 'delete') {
        throw new EdgeError('INVALID_REQUEST_BODY', 400);
      }

      type = type || 'cover';
      const isLogo = type === 'logo';
      const dbColumn = isLogo ? 'logo_url' : 'cover_image_url';

      // Fetch contest
      const { data: contest, error: contestError } = await supabaseAdmin
        .from('contests')
        .select('id, cover_image_url, logo_url')
        .eq('id', contestId)
        .single();

      if (contestError || !contest) {
        throw new EdgeError('CONTEST_NOT_FOUND', 404);
      }

      const oldUrl = isLogo ? contest.logo_url : contest.cover_image_url;
      if (!oldUrl) {
        throw new EdgeError(isLogo ? 'NO_LOGO' : 'NO_COVER_IMAGE', 400);
      }

      // Delete from Bunny Storage
      try {
        const cdnPrefix = `https://${BUNNY_STORAGE_ZONE}.b-cdn.net/`;
        const oldStoragePath = oldUrl.replace(cdnPrefix, '');
        const deleteResp = await fetch(
          `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE}/${oldStoragePath}`,
          {
            method: 'DELETE',
            headers: { AccessKey: BUNNY_STORAGE_API_KEY },
          }
        );
        console.log(
          `Deleted ${type}: path=${oldStoragePath}, status=${deleteResp.status}`
        );
      } catch (e) {
        console.error(`Failed to delete ${type} from Bunny:`, e);
        // Continue — still clear DB reference
      }

      // Clear DB reference
      const { error: updateError } = await supabaseAdmin
        .from('contests')
        .update({ [dbColumn]: null })
        .eq('id', contestId);

      if (updateError) {
        console.error('Contest update failed:', updateError);
        throw new EdgeError('DB_UPDATE_FAILED', 500);
      }

      console.log(
        `[manage-contest-cover] Delete success: type=${type}, contest=${contestId}`
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    const code = error instanceof EdgeError ? error.code : 'UNKNOWN_ERROR';
    const status = error instanceof EdgeError ? error.httpStatus : 500;
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[manage-contest-cover] ERROR ${code}: ${detail}`);
    return new Response(JSON.stringify({ error: code, detail }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
