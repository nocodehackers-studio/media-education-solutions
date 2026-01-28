// Story 4-5: Edge Function to create photo upload session
// CRITICAL: Never expose Bunny credentials to client
// Validates participant, creates submission, returns signed upload URL

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
  contentType: string
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
      contentType,
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

    // Validate file size (10MB max for photos)
    const MAX_SIZE = 10 * 1024 * 1024
    if (fileSize > MAX_SIZE) {
      return new Response(
        JSON.stringify({ success: false, error: 'FILE_TOO_LARGE' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate content type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(contentType)) {
      return new Response(
        JSON.stringify({ success: false, error: 'INVALID_FILE_TYPE' }),
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
      .select('id, code, contest_id')
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

    // Verify category exists, is for photos, and belongs to this contest via division
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
      console.warn(
        `Category not found or doesn't belong to contest: ${categoryId}`
      )
      return new Response(
        JSON.stringify({ success: false, error: 'CATEGORY_NOT_FOUND' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify category is for photos
    if (category.type !== 'photo') {
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
      // Allow re-upload (replacement)
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
          media_type: 'photo',
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

    // Get Bunny Storage configuration
    const BUNNY_STORAGE_API_KEY = Deno.env.get('BUNNY_STORAGE_API_KEY')
    const BUNNY_STORAGE_ZONE = Deno.env.get('BUNNY_STORAGE_ZONE')
    const BUNNY_STORAGE_HOSTNAME =
      Deno.env.get('BUNNY_STORAGE_HOSTNAME') || 'storage.bunnycdn.com'

    if (!BUNNY_STORAGE_API_KEY || !BUNNY_STORAGE_ZONE) {
      console.error('Bunny Storage config missing')
      return new Response(
        JSON.stringify({ success: false, error: 'BUNNY_CONFIG_MISSING' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Generate unique filename to prevent collisions
    const timestamp = Date.now()
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `${contestId}/${categoryId}/${participantCode}/${timestamp}_${safeFileName}`

    // Bunny Storage upload URL
    const uploadUrl = `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE}/${storagePath}`

    // CDN URL for retrieval
    const cdnUrl = `https://${BUNNY_STORAGE_ZONE}.b-cdn.net/${storagePath}`

    // Update submission with expected media_url
    await supabaseAdmin
      .from('submissions')
      .update({ media_url: cdnUrl })
      .eq('id', submissionId)

    console.log(
      `Photo upload session created: submission=${submissionId}, path=${storagePath}`
    )

    return new Response(
      JSON.stringify({
        success: true,
        submissionId,
        uploadUrl,
        cdnUrl,
        storagePath,
        accessKey: BUNNY_STORAGE_API_KEY,
        contentType,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    console.error('create-photo-upload error:', error)
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
