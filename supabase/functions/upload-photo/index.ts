// Story 4-5 QA Fix: Secure photo upload via server-side proxy
// SECURITY: Bunny credentials never leave the server
// Client sends file to this function, we upload to Bunny server-side

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
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
    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const contestId = formData.get('contestId') as string | null
    const categoryId = formData.get('categoryId') as string | null
    const participantId = formData.get('participantId') as string | null
    const participantCode = formData.get('participantCode') as string | null
    const studentName = formData.get('studentName') as string | null
    const tlcName = formData.get('tlcName') as string | null
    const tlcEmail = formData.get('tlcEmail') as string | null
    const groupMemberNames = formData.get('groupMemberNames') as string | null

    // Validate required fields
    if (!file || !contestId || !categoryId || !participantId || !participantCode || !studentName || !tlcName || !tlcEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'MISSING_REQUIRED_FIELDS' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tlcEmail)) {
      return new Response(
        JSON.stringify({ success: false, error: 'INVALID_EMAIL' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate file size (10MB max for photos)
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
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
    if (!validTypes.includes(file.type)) {
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

    // Load Bunny Storage config early (needed for both old media cleanup and new upload)
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

    // Check if participant already has a submission for this category
    const { data: existingSubmission } = await supabaseAdmin
      .from('submissions')
      .select('id, status, media_url')
      .eq('participant_id', participantId)
      .eq('category_id', categoryId)
      .single()

    let submissionId: string

    if (existingSubmission) {
      // Story 4-7: Delete old photo from Bunny Storage before replacing
      if (existingSubmission.media_url) {
        try {
          const cdnPrefix = `https://${BUNNY_STORAGE_ZONE}.b-cdn.net/`
          const oldStoragePath = existingSubmission.media_url.replace(cdnPrefix, '')
          const deleteResp = await fetch(
            `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE}/${oldStoragePath}`,
            {
              method: 'DELETE',
              headers: { AccessKey: BUNNY_STORAGE_API_KEY },
            }
          )
          console.log(`Deleted old Bunny photo: path=${oldStoragePath}, status=${deleteResp.status}`)
        } catch (e) {
          console.error('Failed to delete old Bunny photo:', e)
          // Continue — don't block the new upload
        }
      }

      // Allow re-upload (replacement)
      submissionId = existingSubmission.id
      const { error: resetError } = await supabaseAdmin
        .from('submissions')
        .update({
          status: 'uploading',
          submitted_at: new Date().toISOString(),
          media_url: null,
          thumbnail_url: null,
          student_name: studentName,
          tlc_name: tlcName,
          tlc_email: tlcEmail,
          group_member_names: groupMemberNames || null,
        })
        .eq('id', submissionId)

      if (resetError) {
        console.error('Submission reset failed:', resetError)
        return new Response(
          JSON.stringify({ success: false, error: 'SUBMISSION_RESET_FAILED' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
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
          student_name: studentName,
          tlc_name: tlcName,
          tlc_email: tlcEmail,
          group_member_names: groupMemberNames || null,
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

    // Generate unique filename to prevent collisions
    const timestamp = Date.now()
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `${contestId}/${categoryId}/${participantCode}/${timestamp}_${safeFileName}`

    // Bunny Storage upload URL
    const uploadUrl = `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE}/${storagePath}`

    // CDN URL for retrieval
    const cdnUrl = `https://${BUNNY_STORAGE_ZONE}.b-cdn.net/${storagePath}`

    // Upload file to Bunny Storage (server-side)
    const fileBuffer = await file.arrayBuffer()
    const bunnyResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        AccessKey: BUNNY_STORAGE_API_KEY,
        'Content-Type': file.type,
      },
      body: fileBuffer,
    })

    if (!bunnyResponse.ok) {
      const errorText = await bunnyResponse.text()
      console.error('Bunny Storage upload failed:', errorText)
      return new Response(
        JSON.stringify({ success: false, error: 'STORAGE_UPLOAD_FAILED' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Update submission with media_url and auto-confirm (photos don't need a preview step)
    const { error: updateError } = await supabaseAdmin
      .from('submissions')
      .update({
        status: 'submitted',
        media_url: cdnUrl,
        thumbnail_url: cdnUrl, // For photos, thumbnail = full image
      })
      .eq('id', submissionId)

    if (updateError) {
      console.error('Submission update failed:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: 'SUBMISSION_UPDATE_FAILED' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(
      `Photo uploaded successfully: submission=${submissionId}, path=${storagePath}`
    )

    return new Response(
      JSON.stringify({
        success: true,
        submissionId,
        mediaUrl: cdnUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    console.error('upload-photo error:', error)
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
