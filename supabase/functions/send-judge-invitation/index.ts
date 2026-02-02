// Story 3-2 & 3-3: Edge Function to send judge invitation emails
// Story 7-2: Added notification_logs logging for delivery tracking
// CRITICAL: Uses service role to update invited_at timestamp and generate invite links
// Uses Brevo API for transactional email delivery
// Story 3-3: Generate Supabase invite link for password setup flow

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  categoryId: string;
  contestId: string;
  judgeEmail: string;
  judgeName?: string;
  categoryName: string;
  contestName: string;
  submissionCount: number;
  categoryDeadline?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Hoisted for catch block access (notification logging on failure)
  let categoryId: string | undefined;
  let contestId: string | undefined;
  let judgeEmail: string | undefined;
  let judgeProfileId: string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let supabaseAdmin: any;
  let brevoErrorLogged = false;

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
    const body: InvitationRequest = await req.json();
    categoryId = body.categoryId;
    contestId = body.contestId;
    judgeEmail = body.judgeEmail;
    const { judgeName, categoryName, contestName, submissionCount, categoryDeadline } = body;

    // Validate required fields
    if (!categoryId || !judgeEmail || !categoryName || !contestName) {
      throw new Error('Missing required fields');
    }

    // Create service role client for admin operations (needed for profile check and invite link)
    supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify judge email exists in profiles with role='judge'
    // This prevents generating invite links for non-existent or non-judge users
    const { data: judgeProfile, error: judgeProfileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('email', judgeEmail)
      .single();

    if (judgeProfileError || !judgeProfile) {
      throw new Error(`No judge profile found for email: ${judgeEmail}`);
    }

    if (judgeProfile.role !== 'judge') {
      throw new Error(`User ${judgeEmail} is not a judge (role: ${judgeProfile.role})`);
    }

    judgeProfileId = judgeProfile.id;

    // Get Brevo API key
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY not configured');
    }

    // Build app URL
    const appUrl = Deno.env.get('APP_URL') || 'https://yourapp.com';

    // Story 3-3: Generate invite link for password setup flow
    // This creates a one-time use link that logs the judge in and redirects to /set-password
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email: judgeEmail,
        options: {
          redirectTo: `${appUrl}/set-password`,
        },
      });

    if (linkError) {
      console.error('Failed to generate invite link:', linkError);
      throw new Error(`Failed to generate invite link: ${linkError.message}`);
    }

    // Use the generated invite link for the CTA button
    const setupLink = linkData.properties.action_link;

    // Send email via Brevo
    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify({
        sender: {
          name: 'Media Education Solutions',
          email: Deno.env.get('BREVO_SENDER_EMAIL') || 'noreply@yourdomain.com',
        },
        to: [
          {
            email: judgeEmail,
            name: judgeName || judgeEmail,
          },
        ],
        subject: `You're invited to judge: ${categoryName}`,
        htmlContent: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2563eb;">You're Invited to Judge!</h1>

                <p>Hello${judgeName ? ` ${judgeName}` : ''},</p>

                <p>You have been assigned to judge submissions in the following category:</p>

                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Contest:</strong> ${contestName}</p>
                  <p style="margin: 8px 0 0 0;"><strong>Category:</strong> ${categoryName}</p>
                  <p style="margin: 8px 0 0 0;"><strong>Submissions to Review:</strong> ${submissionCount}</p>${categoryDeadline ? `
                  <p style="margin: 8px 0 0 0;"><strong>Judging Deadline:</strong> ${new Date(categoryDeadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
                </div>

                <p>The submission deadline has passed and the category is now ready for judging.</p>

                <p style="margin: 30px 0;">
                  <a href="${setupLink}"
                     style="background-color: #2563eb; color: white; padding: 12px 24px;
                            text-decoration: none; border-radius: 6px; display: inline-block;">
                    Set Password & Start Judging
                  </a>
                </p>

                <p>Click the button above to set your password and access your judging dashboard. This link is valid for a limited time.</p>

                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

                <p style="color: #6b7280; font-size: 14px;">
                  If you have any questions, please contact the contest administrator.
                </p>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      let errorMsg: string;
      try {
        const errorData = await emailResponse.json();
        errorMsg = `Brevo API error: ${JSON.stringify(errorData)}`;
      } catch {
        errorMsg = `Brevo API error: HTTP ${emailResponse.status} ${emailResponse.statusText}`;
      }

      // Log failed send to notification_logs
      await supabaseAdmin.from('notification_logs').insert({
        type: 'judge_invitation',
        recipient_email: judgeEmail,
        recipient_id: judgeProfileId,
        related_contest_id: contestId,
        related_category_id: categoryId,
        status: 'failed',
        error_message: errorMsg,
      });
      brevoErrorLogged = true;

      throw new Error(errorMsg);
    }

    const brevoResult = await emailResponse.json();
    const messageId = brevoResult.messageId || null;

    // Log successful send to notification_logs
    const { error: logError } = await supabaseAdmin.from('notification_logs').insert({
      type: 'judge_invitation',
      recipient_email: judgeEmail,
      recipient_id: judgeProfileId,
      related_contest_id: contestId,
      related_category_id: categoryId,
      brevo_message_id: messageId,
      status: 'sent',
    });
    if (logError) {
      console.error('Failed to log notification:', logError);
    }

    // Update invited_at timestamp on category (supabaseAdmin already created above)
    const { error: updateError } = await supabaseAdmin
      .from('categories')
      .update({ invited_at: new Date().toISOString() })
      .eq('id', categoryId);

    if (updateError) {
      console.error('Failed to update invited_at:', updateError);
      // Don't throw - email was sent successfully
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Invitation sent', messageId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('send-judge-invitation error:', message);

    // Log failure if not already logged in Brevo error path and we have enough context
    if (!brevoErrorLogged && supabaseAdmin && categoryId) {
      try {
        await supabaseAdmin.from('notification_logs').insert({
          type: 'judge_invitation',
          recipient_email: judgeEmail || 'unknown',
          recipient_id: judgeProfileId || null,
          related_contest_id: contestId,
          related_category_id: categoryId,
          status: 'failed',
          error_message: message,
        });
      } catch (logError) {
        console.error('Failed to log notification error:', logError);
      }
    }

    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
