// Story 7-1: Centralized email notification Edge Function
// Accepts any notification type, sends via Brevo API v3, logs to notification_logs
// Follows patterns from send-judge-invitation and notify-admin-category-complete
// CANONICAL TYPE SOURCE: src/features/notifications/types/notification.types.ts
// Keep types below in sync with the frontend canonical definitions (F8)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// Basic email format validation (F1)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type NotificationType =
  | 'judge_invitation'
  | 'judge_complete'
  | 'tlc_results'
  | 'contest_status';

interface SendNotificationRequest {
  to: string;
  type: NotificationType;
  params?: Record<string, string | number>;
  subject: string;
  htmlContent: string;
  recipientId?: string;
  relatedContestId?: string;
  relatedCategoryId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Hoisted so catch block can update log on pre-send failures (F3)
  let logEntryId: string | undefined;

  try {
    // Auth check: require JWT, verify admin or judge role
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
    if (!profile || !['admin', 'judge'].includes(profile.role)) {
      throw new Error('Insufficient permissions');
    }

    // Parse request
    const body: SendNotificationRequest = await req.json();
    const {
      to,
      type,
      subject,
      htmlContent,
      recipientId,
      relatedContestId,
      relatedCategoryId,
    } = body;

    if (!to || !type || !subject || !htmlContent) {
      throw new Error('Missing required fields: to, type, subject, htmlContent');
    }

    // F1: Validate email format
    if (!EMAIL_REGEX.test(to)) {
      throw new Error('Invalid email format');
    }

    // Create pending log entry
    const { data: logEntry } = await supabaseAdmin
      .from('notification_logs')
      .insert({
        type,
        recipient_email: to,
        recipient_id: recipientId || null,
        related_contest_id: relatedContestId || null,
        related_category_id: relatedCategoryId || null,
        status: 'pending',
      })
      .select('id')
      .single();

    logEntryId = logEntry?.id;

    // Send via Brevo API v3
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoApiKey) throw new Error('BREVO_API_KEY not configured');

    const senderEmail =
      Deno.env.get('BREVO_SENDER_EMAIL') || 'noreply@yourdomain.com';
    const senderName =
      Deno.env.get('BREVO_SENDER_NAME') || 'Media Education Solutions';

    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      const errorMsg = `Brevo API error: ${JSON.stringify(errorData)}`;

      // Update log to failed
      if (logEntryId) {
        await supabaseAdmin
          .from('notification_logs')
          .update({
            status: 'failed',
            error_message: errorMsg,
          })
          .eq('id', logEntryId);
      }

      console.error(errorMsg);
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMsg,
          notificationLogId: logEntryId,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const brevoResult = await emailResponse.json();
    const messageId = brevoResult.messageId || null;

    // Update log to sent
    if (logEntryId) {
      await supabaseAdmin
        .from('notification_logs')
        .update({
          status: 'sent',
          brevo_message_id: messageId,
        })
        .eq('id', logEntryId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId,
        notificationLogId: logEntryId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('send-notification error:', message);

    // F3: Update pending log to failed on pre-send exceptions
    if (logEntryId) {
      await supabaseAdmin
        .from('notification_logs')
        .update({
          status: 'failed',
          error_message: message,
        })
        .eq('id', logEntryId)
        .catch((e: unknown) =>
          console.error('Failed to update log entry:', e)
        );
    }

    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
