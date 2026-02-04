// Story 7-4: Edge Function to send T/L/C notification emails when contest finishes
// Deduplicates T/L/C emails across all participants in a contest
// Logs each send attempt in notification_logs

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// F3: HTML escaping to prevent injection in email templates
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// F2: Basic email format validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const { contestId } = await req.json();
    // F10: Validate contestId is a non-empty string
    if (!contestId || typeof contestId !== 'string') {
      throw new Error('Missing or invalid contestId');
    }

    // Service role client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // F8: Get contest details, check notify_tlc flag AND status
    const { data: contest, error: contestError } = await supabaseAdmin
      .from('contests')
      .select('id, name, notify_tlc, status')
      .eq('id', contestId)
      .single();

    if (contestError || !contest) {
      throw new Error('Contest not found');
    }

    // F8: Only send notifications for finished contests
    if (contest.status !== 'finished') {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'Contest is not finished' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!contest.notify_tlc) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'T/L/C notifications disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all submissions with T/L/C emails for this contest (via category→division→contest join)
    const { data: submissionsWithTlc } = await supabaseAdmin
      .from('submissions')
      .select('tlc_email, tlc_name, categories!inner(divisions!inner(contest_id))')
      .eq('categories.divisions.contest_id', contestId)
      .eq('status', 'submitted')
      .not('tlc_email', 'is', null);

    if (!submissionsWithTlc || submissionsWithTlc.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No T/L/C emails found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deduplicate by email (case-insensitive), skip invalid emails (F2)
    const uniqueEmails = new Map<string, string>(); // email -> name
    for (const s of submissionsWithTlc) {
      const email = (s.tlc_email as string).toLowerCase().trim();
      if (!isValidEmail(email)) continue; // F2: skip malformed emails
      if (!uniqueEmails.has(email)) {
        uniqueEmails.set(email, (s.tlc_name as string) || '');
      }
    }

    if (uniqueEmails.size === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No valid T/L/C emails found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send emails via Brevo
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY not configured');
    }

    const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL') || 'noreply@yourdomain.com';
    const senderName = Deno.env.get('BREVO_SENDER_NAME') || 'Media Education Solutions';

    let sentCount = 0;
    let failedCount = 0;

    for (const [email, name] of uniqueEmails) {
      const subject = `Contest Results Available: ${escapeHtml(contest.name)}`;
      const htmlContent = buildTlcEmailHtml(name, contest.name);

      try {
        const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'api-key': brevoApiKey,
          },
          body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: [{ email, name: name || email }],
            subject,
            htmlContent,
          }),
        });

        // F5: Read Brevo error body for better diagnostics
        let brevoResult = null;
        let errorMessage: string | null = null;
        if (emailResponse.ok) {
          brevoResult = await emailResponse.json();
        } else {
          try {
            const errBody = await emailResponse.json();
            errorMessage = errBody?.message || `Brevo HTTP ${emailResponse.status}`;
          } catch {
            errorMessage = `Brevo HTTP ${emailResponse.status}`;
          }
        }

        const { error: logError } = await supabaseAdmin.from('notification_logs').insert({
          type: 'tlc_results',
          recipient_email: email,
          related_contest_id: contestId,
          brevo_message_id: brevoResult?.messageId || null,
          status: emailResponse.ok ? 'sent' : 'failed',
          error_message: errorMessage,
        });
        if (logError) {
          console.error('Failed to log notification:', logError.message);
        }

        if (emailResponse.ok) sentCount++;
        else failedCount++;
      } catch (err) {
        failedCount++;
        // F9: Guard notification_logs insert in catch block
        try {
          await supabaseAdmin.from('notification_logs').insert({
            type: 'tlc_results',
            recipient_email: email,
            related_contest_id: contestId,
            status: 'failed',
            error_message: err instanceof Error ? err.message : 'Unknown error',
          });
        } catch (logErr) {
          console.error('Failed to log notification error:', logErr);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, failed: failedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('send-tlc-notification error:', message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// F3: HTML-escaped email template
function buildTlcEmailHtml(name: string, contestName: string): string {
  const safeName = escapeHtml(name);
  const safeContestName = escapeHtml(contestName);
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Contest Results Available</h1>
          <p>Hello${safeName ? ` ${safeName}` : ''},</p>
          <p>The results for <strong>${safeContestName}</strong> are now available.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;">Participants can view their individual feedback and ratings by logging in with their contest code and participant code.</p>
          </div>
          <p>Contact your participants for their individual feedback details.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">This is an automated notification from Media Education Solutions.</p>
        </div>
      </body>
    </html>
  `;
}
