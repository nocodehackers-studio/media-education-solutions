// Story 5-6: Edge Function to notify admins when a judge completes a category
// Follows send-judge-invitation pattern: CORS, JWT auth, service role client, Brevo API

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

    // Fetch category details with contest context (join through divisions → contests)
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
      .select('email, first_name')
      .eq('role', 'admin');

    if (adminsError || !admins || admins.length === 0) {
      throw new Error('No admin users found');
    }

    // Get Brevo API key
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY not configured');
    }

    const appUrl = Deno.env.get('APP_URL') || 'https://yourapp.com';
    const completedAt = categoryData.judging_completed_at
      ? new Date(categoryData.judging_completed_at).toLocaleString()
      : new Date().toLocaleString();

    // Send email to each admin via Brevo
    for (const admin of admins) {
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
            email:
              Deno.env.get('BREVO_SENDER_EMAIL') || 'noreply@yourdomain.com',
          },
          to: [
            {
              email: admin.email,
              name: admin.first_name || admin.email,
            },
          ],
          subject: `Judge completed: ${categoryData.name} - ${categoryData.divisions.contests.name}`,
          htmlContent: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="color: #16a34a;">Judging Complete!</h1>

                  <p>Hello${admin.first_name ? ` ${admin.first_name}` : ''},</p>

                  <p><strong>${judgeName}</strong> has completed judging for:</p>

                  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Contest:</strong> ${categoryData.divisions.contests.name}</p>
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

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        console.error(
          `Failed to send email to ${admin.email}:`,
          JSON.stringify(errorData)
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('notify-admin-category-complete error:', message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
