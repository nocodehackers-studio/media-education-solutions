// Edge Function: close-expired-categories
// Called by pg_cron every minute to close published categories past their deadline
// Sends judge invitation emails via Brevo for categories with assigned judges

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// F6: No CORS needed — this is a server-to-server endpoint called by pg_cron
const responseHeaders = { 'Content-Type': 'application/json' };

// F4: Time guard — abort processing if we approach the next cron invocation
const MAX_PROCESSING_MS = 50_000; // 50s out of 60s cron interval

interface ExpiredCategory {
  id: string;
  name: string;
  deadline: string;
  assigned_judge_id: string | null;
  invited_at: string | null;
  profiles: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  divisions: {
    contest_id: string;
    contests: {
      id: string;
      name: string;
      timezone: string;
    };
  };
}

// F1: HTML escape to prevent injection in email templates
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// F5: Safe timezone formatting with fallback
function formatDeadline(deadline: string, timezone: string): string {
  try {
    return new Date(deadline).toLocaleString('en-US', {
      timeZone: timezone || 'America/New_York',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return new Date(deadline).toISOString();
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204 });
  }

  try {
    const startTime = Date.now();
    console.log('[close-expired-categories] === START ===');

    // Auth handled by Supabase Gateway (requires valid JWT to reach Edge Functions)
    // Use service_role for admin operations (same pattern as purge-deleted-contests)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Query expired published categories
    const { data: expired, error: queryError } = await supabase
      .from('categories')
      .select(`
        id, name, deadline, assigned_judge_id, invited_at,
        profiles:assigned_judge_id (id, email, first_name, last_name),
        divisions!inner (
          contest_id,
          contests!inner (id, name, timezone)
        )
      `)
      .eq('status', 'published')
      .lte('deadline', new Date().toISOString())
      .order('deadline', { ascending: true })
      .limit(50);

    if (queryError) {
      console.error('[close-expired-categories] Query error:', queryError);
      throw new Error(`Query failed: ${queryError.message}`);
    }

    if (!expired || expired.length === 0) {
      console.log('[close-expired-categories] No expired categories found');
      return new Response(
        JSON.stringify({ closedCount: 0, invitationsSent: 0, invitationsSkipped: 0, invitationErrors: 0, errors: [], hasMore: false }),
        { headers: responseHeaders }
      );
    }

    console.log(`[close-expired-categories] Found ${expired.length} expired categories`);

    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    const appUrl = Deno.env.get('APP_URL') || 'https://media-education-solutions-nocodehackers.vercel.app';
    const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL') || 'noreply@yourdomain.com';

    let closedCount = 0;
    let invitationsSent = 0;
    let invitationsSkipped = 0;
    let invitationErrors = 0;
    let abortedEarly = false;
    const errors: { categoryId: string; error: string }[] = [];

    for (const cat of expired as unknown as ExpiredCategory[]) {
      // F4: Time guard — stop processing if approaching cron interval limit
      if (Date.now() - startTime > MAX_PROCESSING_MS) {
        console.warn('[close-expired-categories] Time limit reached, deferring remaining categories to next cron run');
        abortedEarly = true;
        break;
      }

      try {
        // Atomically close — only if still published (idempotency guard)
        const { data: closed } = await supabase
          .from('categories')
          .update({ status: 'closed' })
          .eq('id', cat.id)
          .eq('status', 'published')
          .select('id')
          .single();

        if (!closed) {
          console.log(`[close-expired-categories] Category ${cat.id} already closed by another process`);
          continue;
        }

        closedCount++;
        console.log(`[close-expired-categories] Closed category: ${cat.id} (${cat.name})`);

        // Handle judge invitation
        if (!cat.assigned_judge_id || !cat.profiles) {
          console.warn(`[close-expired-categories] Category ${cat.id} closed without assigned judge — skipping invitation`);
          invitationsSkipped++;
          continue;
        }

        if (cat.invited_at !== null) {
          console.log(`[close-expired-categories] Category ${cat.id} judge already invited — skipping`);
          invitationsSkipped++;
          continue;
        }

        // Atomically claim the invitation (prevents duplicate emails)
        const { data: claimed } = await supabase
          .from('categories')
          .update({ invited_at: new Date().toISOString() })
          .eq('id', cat.id)
          .is('invited_at', null)
          .select('id')
          .single();

        if (!claimed) {
          console.log(`[close-expired-categories] Category ${cat.id} invitation already claimed`);
          invitationsSkipped++;
          continue;
        }

        // Send judge invitation
        try {
          const judgeEmail = cat.profiles.email;
          const judgeName = [cat.profiles.first_name, cat.profiles.last_name]
            .filter(Boolean)
            .join(' ') || undefined;
          const contestName = cat.divisions.contests.name;
          const contestTimezone = cat.divisions.contests.timezone;
          const contestId = cat.divisions.contest_id;

          // F1: Escape all user-controlled strings for email HTML
          const safeCategoryName = escapeHtml(cat.name);
          const safeContestName = escapeHtml(contestName);
          const safeJudgeName = judgeName ? escapeHtml(judgeName) : undefined;

          // Get submission count
          const { count: submissionCount } = await supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', cat.id);

          // Generate magic link
          const { data: linkData, error: linkError } =
            await supabase.auth.admin.generateLink({
              type: 'magiclink',
              email: judgeEmail,
              options: {
                redirectTo: `${appUrl}/set-password`,
              },
            });

          if (linkError) {
            throw new Error(`Failed to generate magic link: ${linkError.message}`);
          }

          const setupLink = linkData.properties.action_link;

          // Send via Brevo
          if (!brevoApiKey) {
            throw new Error('BREVO_API_KEY not configured');
          }

          // F5: Safe deadline formatting
          const formattedDeadline = formatDeadline(cat.deadline, contestTimezone);

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
                email: senderEmail,
              },
              to: [{ email: judgeEmail, name: judgeName || judgeEmail }],
              subject: `You're invited to judge: ${cat.name}`,
              htmlContent: `
                <html>
                  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                      <h1 style="color: #2563eb;">You're Invited to Judge!</h1>
                      <p>Hello${safeJudgeName ? ` ${safeJudgeName}` : ''},</p>
                      <p>You have been assigned to judge submissions in the following category:</p>
                      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Contest:</strong> ${safeContestName}</p>
                        <p style="margin: 8px 0 0 0;"><strong>Category:</strong> ${safeCategoryName}</p>
                        <p style="margin: 8px 0 0 0;"><strong>Submissions to Review:</strong> ${submissionCount ?? 0}</p>
                        <p style="margin: 8px 0 0 0;"><strong>Judging Deadline:</strong> ${formattedDeadline}</p>
                      </div>
                      <p>The submission deadline has passed and the category is now ready for judging.</p>
                      <p style="margin: 30px 0;">
                        <a href="${setupLink}"
                           style="background-color: #2563eb; color: white; padding: 12px 24px;
                                  text-decoration: none; border-radius: 6px; display: inline-block;">
                          Set Password &amp; Start Judging
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
              errorMsg = `Brevo API error: HTTP ${emailResponse.status}`;
            }
            throw new Error(errorMsg);
          }

          const brevoResult = await emailResponse.json();
          const messageId = brevoResult.messageId || null;

          // Log successful send
          await supabase.from('notification_logs').insert({
            type: 'judge_invitation',
            recipient_email: judgeEmail,
            recipient_id: cat.profiles.id,
            related_contest_id: contestId,
            related_category_id: cat.id,
            brevo_message_id: messageId,
            status: 'sent',
          });

          invitationsSent++;
          console.log(`[close-expired-categories] Invitation sent to ${judgeEmail} for category ${cat.id}`);
        } catch (inviteError) {
          const msg = inviteError instanceof Error ? inviteError.message : 'Unknown invitation error';
          console.error(`[close-expired-categories] Invitation failed for category ${cat.id}:`, msg);

          // Reset invited_at so it retries on next cron run
          await supabase.from('categories').update({ invited_at: null }).eq('id', cat.id);

          // Log failed send
          await supabase.from('notification_logs').insert({
            type: 'judge_invitation',
            recipient_email: cat.profiles?.email || 'unknown',
            recipient_id: cat.profiles?.id || null,
            related_contest_id: cat.divisions.contest_id,
            related_category_id: cat.id,
            status: 'failed',
            error_message: msg,
          });

          invitationErrors++;
          errors.push({ categoryId: cat.id, error: msg });
        }
      } catch (catError) {
        const msg = catError instanceof Error ? catError.message : 'Unknown error';
        console.error(`[close-expired-categories] Failed to process category ${cat.id}:`, msg);
        errors.push({ categoryId: cat.id, error: msg });
      }
    }

    // F4: Signal whether more categories may be pending
    const hasMore = abortedEarly || expired.length === 50;

    console.log(`[close-expired-categories] === DONE === closed=${closedCount} sent=${invitationsSent} skipped=${invitationsSkipped} errors=${invitationErrors} hasMore=${hasMore} elapsed=${Date.now() - startTime}ms`);

    return new Response(
      JSON.stringify({ closedCount, invitationsSent, invitationsSkipped, invitationErrors, errors, hasMore }),
      { headers: responseHeaders }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[close-expired-categories] FATAL:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: responseHeaders }
    );
  }
});
