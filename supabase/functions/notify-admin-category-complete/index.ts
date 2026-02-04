// Story 5-6 + Story 7-3: Edge Function to notify admins when a judge completes a category
// Follows send-judge-invitation pattern: CORS, JWT auth, service role client, Brevo API
// Story 7-3: Added notification_logs + all-judging-complete summary email

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface NotifyRequest {
  categoryId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create client with user's auth context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify caller is authenticated judge
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { categoryId }: NotifyRequest = await req.json();
    if (!categoryId) {
      throw new Error('Missing categoryId');
    }

    // Create service role client for admin queries
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Fetch category details with contest context (join through divisions -> contests)
    const { data: category, error: categoryError } = await supabaseAdmin
      .from('categories')
      .select(
        `
        id,
        name,
        judging_completed_at,
        divisions!inner (
          name,
          contests!inner (
            id,
            name
          )
        )
      `
      )
      .eq('id', categoryId)
      .single();

    if (categoryError || !category) {
      throw new Error('Category not found');
    }

    // Type assertion for nested join
    const categoryData = category as unknown as {
      id: string;
      name: string;
      judging_completed_at: string | null;
      divisions: {
        name: string;
        contests: {
          id: string;
          name: string;
        };
      };
    };

    const contestId = categoryData.divisions.contests.id;
    const contestName = categoryData.divisions.contests.name;

    // Fetch judge profile
    const { data: judgeProfile, error: judgeError } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single();

    if (judgeError || !judgeProfile) {
      throw new Error('Judge profile not found');
    }

    const judgeName = judgeProfile.first_name
      ? `${judgeProfile.first_name} ${judgeProfile.last_name || ''}`.trim()
      : judgeProfile.email;

    // Fetch all admin emails
    const { data: admins, error: adminsError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, first_name')
      .eq('role', 'admin');

    if (adminsError || !admins || admins.length === 0) {
      throw new Error('No admin users found');
    }

    // Get Brevo API key
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY not configured');
    }

    const appUrl = Deno.env.get('APP_URL') || 'https://media-education-solutions-nocodehackers.vercel.app';
    const senderName = 'Media Education Solutions';
    const senderEmail =
      Deno.env.get('BREVO_SENDER_EMAIL') || 'noreply@yourdomain.com';
    // Enforce completion state - reject if category not actually completed (Review F2)
    if (!categoryData.judging_completed_at) {
      throw new Error('Category judging not yet completed');
    }

    const completedAt = new Date(categoryData.judging_completed_at).toLocaleString();

    // Send individual category-complete email to each admin via Brevo
    for (const admin of admins) {
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
          to: [
            {
              email: admin.email,
              name: admin.first_name || admin.email,
            },
          ],
          subject: `Judge completed: ${categoryData.name} - ${contestName}`,
          htmlContent: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="color: #16a34a;">Judging Complete!</h1>

                  <p>Hello${admin.first_name ? ` ${admin.first_name}` : ''},</p>

                  <p><strong>${judgeName}</strong> has completed judging for:</p>

                  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Contest:</strong> ${contestName}</p>
                    <p style="margin: 8px 0 0 0;"><strong>Category:</strong> ${categoryData.name}</p>
                    <p style="margin: 8px 0 0 0;"><strong>Completed at:</strong> ${completedAt}</p>
                  </div>

                  <p style="margin: 30px 0;">
                    <a href="${appUrl}/admin/dashboard"
                       style="background-color: #16a34a; color: white; padding: 12px 24px;
                              text-decoration: none; border-radius: 6px; display: inline-block;">
                      View Results
                    </a>
                  </p>

                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

                  <p style="color: #6b7280; font-size: 14px;">
                    This is an automated notification from Media Education Solutions.
                  </p>
                </div>
              </body>
            </html>
          `,
        }),
      });

      // Log notification attempt to notification_logs (Story 7-3)
      let messageId: string | null = null;
      let errorMsg: string | null = null;

      if (emailResponse.ok) {
        try {
          const responseData = await emailResponse.json();
          messageId = responseData.messageId || null;
        } catch {
          // Response parsing OK - messageId may not be present
        }
      } else {
        try {
          const errorData = await emailResponse.json();
          errorMsg = `Brevo send failed: ${JSON.stringify(errorData)}`;
        } catch {
          errorMsg = `Brevo send failed: HTTP ${emailResponse.status}`;
        }
        console.error(
          `Failed to send email to ${admin.email}:`,
          errorMsg
        );
      }

      const { error: logError } = await supabaseAdmin.from('notification_logs').insert({
        type: 'judge_complete',
        recipient_email: admin.email,
        recipient_id: admin.id,
        related_contest_id: contestId,
        related_category_id: categoryId,
        brevo_message_id: messageId,
        status: emailResponse.ok ? 'sent' : 'failed',
        error_message: errorMsg,
      });
      if (logError) {
        console.error('Failed to log notification:', logError);
      }
      } catch (sendError) {
        // Per-admin try/catch: network exception must not abort remaining admins (Review F1)
        console.error(`Exception sending email to ${admin.email}:`, sendError);
        const { error: logError } = await supabaseAdmin.from('notification_logs').insert({
          type: 'judge_complete',
          recipient_email: admin.email,
          recipient_id: admin.id,
          related_contest_id: contestId,
          related_category_id: categoryId,
          status: 'failed',
          error_message: sendError instanceof Error ? sendError.message : 'Network exception during send',
        });
        if (logError) {
          console.error('Failed to log notification after exception:', logError);
        }
      }
    }

    // Check if ALL categories in the contest are now complete (Story 7-3)
    const { data: contestDivisions, error: divisionsError } = await supabaseAdmin
      .from('divisions')
      .select('id')
      .eq('contest_id', contestId);

    if (divisionsError) {
      console.error('Failed to query contest divisions:', divisionsError);
    }

    const divisionIds =
      contestDivisions?.map((d: { id: string }) => d.id) || [];

    let allCategories: {
      id: string;
      name: string;
      judging_completed_at: string | null;
      assigned_judge_id: string | null;
    }[] | null = null;

    if (divisionIds.length > 0) {
      const { data: categories, error: categoriesError } = await supabaseAdmin
        .from('categories')
        .select('id, name, judging_completed_at, assigned_judge_id')
        .in('division_id', divisionIds);

      if (categoriesError) {
        console.error('Failed to query categories for all-complete check:', categoriesError);
      }
      allCategories = categories;
    }

    const allComplete =
      allCategories &&
      allCategories.length > 0 &&
      allCategories.every(
        (c: { judging_completed_at: string | null }) =>
          c.judging_completed_at !== null
      );

    if (allComplete) {
      // Fetch judge names for summary email (Review F3 - AC5 requires categories AND judges)
      const judgeIds = [
        ...new Set(
          allCategories
            .map((c) => c.assigned_judge_id)
            .filter((id): id is string => id !== null)
        ),
      ];
      const judgeNameMap: Record<string, string> = {};
      if (judgeIds.length > 0) {
        const { data: judgeProfiles } = await supabaseAdmin
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', judgeIds);
        if (judgeProfiles) {
          for (const jp of judgeProfiles) {
            judgeNameMap[jp.id] = jp.first_name
              ? `${jp.first_name} ${jp.last_name || ''}`.trim()
              : jp.email;
          }
        }
      }

      const categorySummary = allCategories
        .map((c) => {
          const jName = c.assigned_judge_id
            ? judgeNameMap[c.assigned_judge_id] || 'Unknown'
            : 'Unassigned';
          return `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${c.name}</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${jName}</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #16a34a;">Complete</td></tr>`;
        })
        .join('');

      // Send "All Judging Complete" summary email to all admins
      for (const admin of admins) {
        try {
        const summaryResponse = await fetch(
          'https://api.brevo.com/v3/smtp/email',
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              'api-key': brevoApiKey,
            },
            body: JSON.stringify({
              sender: { name: senderName, email: senderEmail },
              to: [
                { email: admin.email, name: admin.first_name || admin.email },
              ],
              subject: `All Judging Complete: ${contestName}`,
              htmlContent: `
              <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #16a34a;">All Judging Complete!</h1>

                    <p>Hello${admin.first_name ? ` ${admin.first_name}` : ''},</p>

                    <p>All categories in <strong>${contestName}</strong> have been judged.</p>

                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                      <tr style="background: #f3f4f6;">
                        <th style="padding: 8px; text-align: left;">Category</th>
                        <th style="padding: 8px; text-align: left;">Judge</th>
                        <th style="padding: 8px; text-align: left;">Status</th>
                      </tr>
                      ${categorySummary}
                    </table>

                    <p style="margin: 30px 0;">
                      <a href="${appUrl}/admin/dashboard"
                         style="background-color: #16a34a; color: white; padding: 12px 24px;
                                text-decoration: none; border-radius: 6px; display: inline-block;">
                        Review Results &amp; Generate Winners
                      </a>
                    </p>

                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

                    <p style="color: #6b7280; font-size: 14px;">
                      This is an automated notification from Media Education Solutions.
                    </p>
                  </div>
                </body>
              </html>
            `,
            }),
          }
        );

        // Log summary email notification
        let summaryMessageId: string | null = null;
        let summaryErrorMsg: string | null = null;

        if (summaryResponse.ok) {
          try {
            const responseData = await summaryResponse.json();
            summaryMessageId = responseData.messageId || null;
          } catch {
            // Response parsing OK
          }
        } else {
          try {
            const errorData = await summaryResponse.json();
            summaryErrorMsg = `All-complete summary send failed: ${JSON.stringify(errorData)}`;
          } catch {
            summaryErrorMsg = `All-complete summary send failed: HTTP ${summaryResponse.status}`;
          }
          console.error(
            `Failed to send all-complete summary to ${admin.email}:`,
            summaryErrorMsg
          );
        }

        const { error: summaryLogError } = await supabaseAdmin.from('notification_logs').insert({
          type: 'judge_complete',
          recipient_email: admin.email,
          recipient_id: admin.id,
          related_contest_id: contestId,
          brevo_message_id: summaryMessageId,
          status: summaryResponse.ok ? 'sent' : 'failed',
          error_message: summaryErrorMsg,
        });
        if (summaryLogError) {
          console.error('Failed to log summary notification:', summaryLogError);
        }
        } catch (sendError) {
          // Per-admin try/catch: network exception must not abort remaining admins (Review F1)
          console.error(`Exception sending summary to ${admin.email}:`, sendError);
          const { error: logError } = await supabaseAdmin.from('notification_logs').insert({
            type: 'judge_complete',
            recipient_email: admin.email,
            recipient_id: admin.id,
            related_contest_id: contestId,
            status: 'failed',
            error_message: sendError instanceof Error ? sendError.message : 'Network exception during summary send',
          });
          if (logError) {
            console.error('Failed to log summary notification after exception:', logError);
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('notify-admin-category-complete error:', message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
