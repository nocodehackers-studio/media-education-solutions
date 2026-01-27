// Story 4-4: Edge Function to create video upload session
// CRITICAL: Never expose Bunny credentials to client
// Validates participant, creates submission, returns signed TUS URL

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface UploadRequest {
  contestId: string
  categoryId: string
  participantId: string
  participantCode: string
  fileName: string
  fileSize: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'METHOD_NOT_ALLOWED' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    const {
      contestId,
      categoryId,
      participantId,
      participantCode,
      fileName,
      fileSize,
    }: UploadRequest = await req.json()

    // Validate required fields
    if (
      !contestId ||
      !categoryId ||
      !participantId ||
      !participantCode ||
      !fileName
    ) {
      return new Response(
        JSON.stringify({ success: false, error: 'MISSING_REQUIRED_FIELDS' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate file size (500MB max)
    const MAX_SIZE = 500 * 1024 * 1024
    if (fileSize > MAX_SIZE) {
      return new Response(
        JSON.stringify({ success: false, error: 'FILE_TOO_LARGE' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

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
        JSON.stringify({ success: false, error: 'INVALID_PARTICIPANT' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // QA Fix #2: Verify category belongs to contest via division join
    const { data: category, error: categoryError } = await supabaseAdmin
      .from('categories')
      .select(`
        id, type, status, deadline, division_id,
        divisions!inner ( id, contest_id )
      `)
      .eq('id', categoryId)
      .eq('divisions.contest_id', contestId)
      .single()

    if (categoryError || !category) {
      console.warn(`Category not found or doesn't belong to contest: ${categoryId}`)
      return new Response(
        JSON.stringify({ success: false, error: 'CATEGORY_NOT_FOUND' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify category is for videos
    if (category.type !== 'video') {
      return new Response(
        JSON.stringify({ success: false, error: 'CATEGORY_TYPE_MISMATCH' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify category status is published
    if (category.status !== 'published') {
      return new Response(
        JSON.stringify({ success: false, error: 'CATEGORY_CLOSED' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify deadline has not passed
    if (new Date(category.deadline) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: 'DEADLINE_PASSED' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if participant already has a submission for this category
    const { data: existingSubmission } = await supabaseAdmin
      .from('submissions')
      .select('id, status')
      .eq('participant_id', participantId)
      .eq('category_id', categoryId)
      .single()

    let submissionId: string

    if (existingSubmission) {
      // Allow re-upload if previous upload failed or is being replaced
      submissionId = existingSubmission.id
      await supabaseAdmin
        .from('submissions')
        .update({ status: 'uploading', submitted_at: new Date().toISOString() })
        .eq('id', submissionId)
    } else {
      // Create new submission record
      const { data: newSubmission, error: insertError } = await supabaseAdmin
        .from('submissions')
        .insert({
          participant_id: participantId,
          category_id: categoryId,
          media_type: 'video',
          status: 'uploading',
          submitted_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (insertError || !newSubmission) {
        console.error('Submission create failed:', insertError)
        return new Response(
          JSON.stringify({ success: false, error: 'SUBMISSION_CREATE_FAILED' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      submissionId = newSubmission.id
    }

    // Generate Bunny Stream TUS upload URL
    const BUNNY_STREAM_API_KEY = Deno.env.get('BUNNY_STREAM_API_KEY')
    const BUNNY_STREAM_LIBRARY_ID = Deno.env.get('BUNNY_STREAM_LIBRARY_ID')

    if (!BUNNY_STREAM_API_KEY || !BUNNY_STREAM_LIBRARY_ID) {
      console.error('Bunny config missing')
      return new Response(
        JSON.stringify({ success: false, error: 'BUNNY_CONFIG_MISSING' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create video in Bunny Stream
    const createVideoResponse = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos`,
      {
        method: 'POST',
        headers: {
          AccessKey: BUNNY_STREAM_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: fileName,
          collectionId: contestId, // Organize by contest
        }),
      }
    )

    if (!createVideoResponse.ok) {
      const errorText = await createVideoResponse.text()
      console.error('Bunny video create failed:', errorText)
      return new Response(
        JSON.stringify({ success: false, error: 'BUNNY_VIDEO_CREATE_FAILED' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const videoData = await createVideoResponse.json()
    const bunnyVideoId = videoData.guid

    // Update submission with bunny_video_id
    await supabaseAdmin
      .from('submissions')
      .update({ bunny_video_id: bunnyVideoId })
      .eq('id', submissionId)

    // Generate TUS authorization signature
    const expirationTime = Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
    const authorizationSignature = await generateTusSignature(
      BUNNY_STREAM_LIBRARY_ID,
      BUNNY_STREAM_API_KEY,
      bunnyVideoId,
      expirationTime
    )

    console.log(
      `Upload session created: submission=${submissionId}, video=${bunnyVideoId}`
    )

    return new Response(
      JSON.stringify({
        success: true,
        submissionId,
        bunnyVideoId,
        uploadUrl: 'https://video.bunnycdn.com/tusupload',
        libraryId: BUNNY_STREAM_LIBRARY_ID,
        authorizationSignature,
        expirationTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    console.error('create-video-upload error:', error)
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

// F4 Fix: Generate TUS authorization signature for Bunny Stream
// Uses pipe delimiter to prevent potential value collisions
async function generateTusSignature(
  libraryId: string,
  apiKey: string,
  videoId: string,
  expirationTime: number
): Promise<string> {
  const encoder = new TextEncoder()
  // Use pipe delimiter between values to prevent collision edge cases
  const data = encoder.encode(
    `${libraryId}|${apiKey}|${expirationTime}|${videoId}`
  )
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
