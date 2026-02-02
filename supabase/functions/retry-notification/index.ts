// Story 7-5: Edge Function to retry a failed notification email
// Reads the original notification_log entry, reconstructs a simplified email,
// sends to the SINGLE failed recipient via Brevo, updates the SAME log entry.
// No duplicate log entries created.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const MAX_RETRIES = 3;

// F1: HTML escaping to prevent XSS in email templates
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // F2: Reject non-POST methods
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Auth check: require JWT, verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!profile || profile.role !== 'admin') {
      throw new Error('Admin access required');
    }

    // Parse request
    const { logId } = await req.json();
    if (!logId || typeof logId !== 'string') {
      throw new Error('Missing or invalid logId');
    }

    // Service role client for DB operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Read the original log entry
    const { data: log, error: logError } = await supabaseAdmin
      .from('notification_logs')
      .select('*')
      .eq('id', logId)
      .single();

    if (logError || !log) {
      throw new Error('Notification log entry not found');
    }

    if (log.status === 'permanently_failed') {
      throw new Error('Cannot retry permanently failed notification');
    }

    if (log.status === 'sent') {
      throw new Error('Notification already sent successfully');
    }

    const currentRetryCount = log.retry_count || 0;

    if (currentRetryCount >= MAX_RETRIES) {
      await supabaseAdmin
        .from('notification_logs')
        .update({ status: 'permanently_failed' })
        .eq('id', logId);
      throw new Error('Max retries exceeded, marked as permanently_failed');
    }

    // F4: Optimistic lock — only update if retry_count hasn't changed since we read it
    // This prevents concurrent retries from both succeeding
    const newRetryCount = currentRetryCount + 1;

    // Build retry email based on notification type
    const { subject, htmlContent } = await buildRetryEmail(
      supabaseAdmin,
      log
    );

    // Send via Brevo
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoApiKey) throw new Error('BREVO_API_KEY not configured');

    const senderEmail =
      Deno.env.get('BREVO_SENDER_EMAIL') || 'noreply@yourdomain.com';
    const senderName =
      Deno.env.get('BREVO_SENDER_NAME') || 'Media Education Solutions';

    let emailResponse: Response;
    try {
      emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'api-key': brevoApiKey,
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: log.recipient_email }],
          subject,
          htmlContent,
        }),
      });
    } catch (fetchError) {
      // Network-level failure (DNS, connection reset) — count as a retry attempt
      const errorMsg = `Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown'}`;
      const newStatus =
        newRetryCount >= MAX_RETRIES ? 'permanently_failed' : 'failed';

      await supabaseAdmin
        .from('notification_logs')
        .update({
          retry_count: newRetryCount,
          status: newStatus,
          error_message: errorMsg,
          updated_at: new Date().toISOString(),
        })
        .eq('id', logId)
        .eq('retry_count', currentRetryCount);

      return new Response(
        JSON.stringify({ success: false, error: errorMsg, newStatus }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!emailResponse.ok) {
      let errorMsg: string;
      try {
        const errorData = await emailResponse.json();
        errorMsg = `Brevo retry error: ${JSON.stringify(errorData)}`;
      } catch {
        errorMsg = `Brevo retry error: HTTP ${emailResponse.status}`;
      }

      const newStatus =
        newRetryCount >= MAX_RETRIES ? 'permanently_failed' : 'failed';

      // F4: Optimistic lock on retry_count to prevent concurrent duplicates
      const { count } = await supabaseAdmin
        .from('notification_logs')
        .update({
          retry_count: newRetryCount,
          status: newStatus,
          error_message: errorMsg,
          updated_at: new Date().toISOString(),
        })
        .eq('id', logId)
        .eq('retry_count', currentRetryCount)
        .select('*', { count: 'exact', head: true });

      if (count === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Concurrent retry detected, please refresh' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: errorMsg, newStatus }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const brevoResult = await emailResponse.json();
    const messageId = brevoResult.messageId || null;

    // F4: Optimistic lock on retry_count to prevent concurrent duplicates
    const { count } = await supabaseAdmin
      .from('notification_logs')
      .update({
        retry_count: newRetryCount,
        status: 'sent',
        brevo_message_id: messageId,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', logId)
      .eq('retry_count', currentRetryCount)
      .select('*', { count: 'exact', head: true });

    if (count === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Concurrent retry detected, please refresh' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, messageId, retryCount: newRetryCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('retry-notification error:', message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildRetryEmail(supabaseAdmin: any, log: any) {
  const recipientEmail = log.recipient_email;

  switch (log.type) {
    case 'judge_invitation': {
      let categoryName = 'your assigned category';
      let contestName = 'the contest';

      if (log.related_category_id) {
        const { data: category } = await supabaseAdmin
          .from('categories')
          .select(
            `name, divisions!inner ( contests!inner ( name ) )`
          )
          .eq('id', log.related_category_id)
          .single();

        if (category) {
          categoryName = category.name;
          const catData = category as unknown as {
            name: string;
            divisions: { contests: { name: string } };
          };
          contestName = catData.divisions.contests.name;
        }
      }

      // F1: Escape all DB-sourced values before HTML interpolation
      const safeCategoryName = escapeHtml(categoryName);
      const safeContestName = escapeHtml(contestName);

      return {
        subject: `Reminder: You're invited to judge - ${categoryName}`,
        htmlContent: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2563eb;">Judging Invitation Reminder</h1>
                <p>Hello,</p>
                <p>This is a reminder that you have been assigned to judge submissions for:</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Contest:</strong> ${safeContestName}</p>
                  <p style="margin: 8px 0 0 0;"><strong>Category:</strong> ${safeCategoryName}</p>
                </div>
                <p>Please log in to your judging dashboard to review submissions.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 14px;">
                  This is a retry notification from Media Education Solutions.
                </p>
              </div>
            </body>
          </html>
        `,
      };
    }

    case 'judge_complete': {
      let categoryName = 'a category';
      let contestName = 'the contest';

      if (log.related_category_id) {
        const { data: category } = await supabaseAdmin
          .from('categories')
          .select(
            `name, divisions!inner ( contests!inner ( name ) )`
          )
          .eq('id', log.related_category_id)
          .single();

        if (category) {
          categoryName = category.name;
          const catData = category as unknown as {
            name: string;
            divisions: { contests: { name: string } };
          };
          contestName = catData.divisions.contests.name;
        }
      }

      const safeCategoryName = escapeHtml(categoryName);
      const safeContestName = escapeHtml(contestName);

      return {
        subject: `Judging Complete: ${categoryName} - ${contestName}`,
        htmlContent: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #16a34a;">Judging Complete</h1>
                <p>Hello,</p>
                <p>Judging has been completed for:</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Contest:</strong> ${safeContestName}</p>
                  <p style="margin: 8px 0 0 0;"><strong>Category:</strong> ${safeCategoryName}</p>
                </div>
                <p>Please log in to your admin dashboard to review the results.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 14px;">
                  This is a retry notification from Media Education Solutions.
                </p>
              </div>
            </body>
          </html>
        `,
      };
    }

    case 'tlc_results': {
      let contestName = 'the contest';

      if (log.related_contest_id) {
        const { data: contest } = await supabaseAdmin
          .from('contests')
          .select('name')
          .eq('id', log.related_contest_id)
          .single();

        if (contest) {
          contestName = contest.name;
        }
      }

      const safeContestName = escapeHtml(contestName);

      return {
        subject: `Contest Results Available: ${contestName}`,
        htmlContent: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2563eb;">Contest Results Available</h1>
                <p>Hello,</p>
                <p>The results for <strong>${safeContestName}</strong> are now available.</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;">Participants can view their individual feedback and ratings by logging in with their contest code and participant code.</p>
                </div>
                <p>Contact your participants for their individual feedback details.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 14px;">
                  This is a retry notification from Media Education Solutions.
                </p>
              </div>
            </body>
          </html>
        `,
      };
    }

    default:
      return {
        subject: `Notification Retry`,
        htmlContent: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1>Notification</h1>
                <p>Hello,</p>
                <p>This is a retry of a previous notification sent to ${escapeHtml(recipientEmail)}.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 14px;">
                  This is a retry notification from Media Education Solutions.
                </p>
              </div>
            </body>
          </html>
        `,
      };
  }
}
