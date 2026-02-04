// Purge soft-deleted contests after 90-day retention period
// Called by pg_cron daily — deletes Bunny media then hard-deletes DB records
// Auth: service_role_key (not called from frontend)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface SubmissionMedia {
  id: string
  media_type: string
  media_url: string | null
  bunny_video_id: string | null
  thumbnail_url: string | null
}

async function deleteBunnyVideo(videoId: string): Promise<void> {
  const apiKey = Deno.env.get('BUNNY_STREAM_API_KEY')
  const libraryId = Deno.env.get('BUNNY_STREAM_LIBRARY_ID')
  if (!apiKey || !libraryId) return

  try {
    const resp = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
      { method: 'DELETE', headers: { AccessKey: apiKey } }
    )
    console.log(`Bunny Stream delete: video=${videoId}, status=${resp.status}`)
  } catch (e) {
    console.error(`Failed to delete Bunny Stream video ${videoId}:`, e)
  }
}

async function deleteBunnyStorageFile(cdnUrl: string): Promise<void> {
  const apiKey = Deno.env.get('BUNNY_STORAGE_API_KEY')
  const zone = Deno.env.get('BUNNY_STORAGE_ZONE')
  const hostname = Deno.env.get('BUNNY_STORAGE_HOSTNAME') || 'storage.bunnycdn.com'
  if (!apiKey || !zone) return

  const cdnPrefix = `https://${zone}.b-cdn.net/`
  if (!cdnUrl.startsWith(cdnPrefix)) return

  const storagePath = cdnUrl.replace(cdnPrefix, '')

  try {
    const resp = await fetch(
      `https://${hostname}/${zone}/${storagePath}`,
      { method: 'DELETE', headers: { AccessKey: apiKey } }
    )
    console.log(`Bunny Storage delete: path=${storagePath}, status=${resp.status}`)
  } catch (e) {
    console.error(`Failed to delete Bunny Storage file ${storagePath}:`, e)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Find contests soft-deleted more than 90 days ago
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 90)

    const { data: contests, error: fetchError } = await supabaseAdmin
      .from('contests')
      .select('id, name, cover_image_url, logo_url')
      .eq('status', 'deleted')
      .lt('deleted_at', cutoffDate.toISOString())

    if (fetchError) {
      console.error('Failed to fetch expired contests:', fetchError)
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!contests || contests.length === 0) {
      console.log('No expired contests to purge')
      return new Response(
        JSON.stringify({ success: true, purged: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${contests.length} contest(s) to purge`)
    let purgedCount = 0

    for (const contest of contests) {
      console.log(`Purging contest: ${contest.name} (${contest.id})`)

      // 1. Get all submissions for this contest (via participants)
      const { data: submissions } = await supabaseAdmin
        .from('submissions')
        .select('id, media_type, media_url, bunny_video_id, thumbnail_url, participants!inner(contest_id)')
        .eq('participants.contest_id', contest.id) as { data: SubmissionMedia[] | null; error: unknown }

      // 2. Delete submission media from Bunny (best-effort)
      if (submissions && submissions.length > 0) {
        console.log(`  Deleting media for ${submissions.length} submission(s)`)

        for (const sub of submissions) {
          // Delete video from Bunny Stream
          if (sub.media_type === 'video' && sub.bunny_video_id) {
            await deleteBunnyVideo(sub.bunny_video_id)
          }

          // Delete photo from Bunny Storage
          if (sub.media_type === 'photo' && sub.media_url) {
            await deleteBunnyStorageFile(sub.media_url)
          }

          // Delete thumbnail from Bunny Storage
          if (sub.thumbnail_url) {
            await deleteBunnyStorageFile(sub.thumbnail_url)
          }
        }
      }

      // 3. Delete contest cover image from Bunny Storage
      if (contest.cover_image_url) {
        await deleteBunnyStorageFile(contest.cover_image_url)
      }

      // 4. Delete contest logo from Bunny Storage
      if (contest.logo_url) {
        await deleteBunnyStorageFile(contest.logo_url)
      }

      // 5. Hard-delete contest (cascades to participants, divisions, categories,
      //    submissions, reviews, rankings via ON DELETE CASCADE)
      const { error: deleteError } = await supabaseAdmin
        .from('contests')
        .delete()
        .eq('id', contest.id)

      if (deleteError) {
        console.error(`  Failed to delete contest ${contest.id}:`, deleteError)
        continue
      }

      console.log(`  Contest purged: ${contest.name}`)
      purgedCount++
    }

    console.log(`Purge complete: ${purgedCount}/${contests.length} contest(s) purged`)

    return new Response(
      JSON.stringify({ success: true, purged: purgedCount, total: contests.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('purge-deleted-contests error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'SERVER_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
