# Story 3.2: Judge Invitation Email

Status: review

## Story

As a **System**,
I want **to send invitation emails to judges when their category closes**,
So that **judges know when to start reviewing submissions**.

## Acceptance Criteria

### AC1: Send Invitation on Category Close
**Given** a category has a judge assigned
**When** the category status changes to "Closed" (manually or via deadline)
**Then** an invitation email is sent to the judge
**And** the `invited_at` timestamp is set on the category

### AC2: Email Content
**Given** the invitation email is sent
**When** the judge receives it
**Then** the email contains:
  - Contest name
  - Category name
  - Submission count
  - Login link (to judge dashboard)
**And** the subject line is "You're invited to judge: {category_name}"

### AC3: No Judge Assigned Warning
**Given** a category has no judge assigned
**When** the category status changes to "Closed"
**Then** no email is sent
**And** admin sees a warning toast "Category closed without judge assigned"

### AC4: Prevent Duplicate Emails
**Given** a judge was already invited (`invited_at` is set)
**When** the category status is set to "Closed" again (edge case)
**Then** no duplicate email is sent
**And** the existing `invited_at` timestamp is preserved

### AC5: Edge Function for Email Sending
**Given** the Supabase Edge Function is created
**When** I check `supabase/functions/send-judge-invitation/`
**Then** it handles judge invitation emails via Brevo API
**And** it validates the caller is authenticated admin
**And** it returns success/failure status

## Developer Context

### Architecture Requirements

**Email Service: Brevo (SendInBlue)**

Per architecture, Brevo is used for transactional emails. The Edge Function will use Brevo's REST API.

**Environment Variables Required:**
```
BREVO_API_KEY=your_brevo_api_key
```

**Brevo API Endpoint:**
```
POST https://api.brevo.com/v3/smtp/email
```

### Technical Requirements

**Feature Location:** Create new `src/features/notifications/` feature + Edge Function

**New/Modified Files:**
```
supabase/functions/
└── send-judge-invitation/     # NEW: Edge Function for judge invitation emails
    └── index.ts

src/features/notifications/    # NEW: Notifications feature (minimal for now)
├── api/
│   └── notificationsApi.ts    # API to invoke Edge Function
├── types/
│   └── notification.types.ts  # Email types
└── index.ts                   # Feature exports

src/features/categories/
├── api/
│   └── categoriesApi.ts       # MODIFY: Add sendJudgeInvitation, update updateStatus
├── hooks/
│   └── useUpdateCategoryStatus.ts  # MODIFY: Handle invitation flow on close
└── components/
    └── CategoryCard.tsx       # MODIFY: Show warning toast for no judge on close
```

### Edge Function Implementation

**supabase/functions/send-judge-invitation/index.ts:**
```typescript
// Send judge invitation email via Brevo API
// Called when category status changes to "closed"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  categoryId: string;
  judgeEmail: string;
  judgeName?: string;
  categoryName: string;
  contestName: string;
  submissionCount: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify caller is authenticated admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') throw new Error('Admin access required');

    // Parse request body
    const {
      categoryId,
      judgeEmail,
      judgeName,
      categoryName,
      contestName,
      submissionCount,
    }: InvitationRequest = await req.json();

    // Validate required fields
    if (!categoryId || !judgeEmail || !categoryName || !contestName) {
      throw new Error('Missing required fields');
    }

    // Get Brevo API key
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY not configured');
    }

    // Build login URL
    const appUrl = Deno.env.get('APP_URL') || 'https://yourapp.com';
    const loginLink = `${appUrl}/login?redirect=/judge`;

    // Send email via Brevo
    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify({
        sender: {
          name: 'Media Education Solutions',
          email: 'noreply@yourdomain.com',  // Configure in Brevo
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
                  <p style="margin: 8px 0 0 0;"><strong>Submissions to Review:</strong> ${submissionCount}</p>
                </div>

                <p>The submission deadline has passed and the category is now ready for judging.</p>

                <p style="margin: 30px 0;">
                  <a href="${loginLink}"
                     style="background-color: #2563eb; color: white; padding: 12px 24px;
                            text-decoration: none; border-radius: 6px; display: inline-block;">
                    Start Judging
                  </a>
                </p>

                <p>If this is your first time logging in, you'll be prompted to set your password.</p>

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
      const errorData = await emailResponse.json();
      throw new Error(`Brevo API error: ${JSON.stringify(errorData)}`);
    }

    // Update invited_at timestamp on category
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error: updateError } = await supabaseAdmin
      .from('categories')
      .update({ invited_at: new Date().toISOString() })
      .eq('id', categoryId);

    if (updateError) {
      console.error('Failed to update invited_at:', updateError);
      // Don't throw - email was sent successfully
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Invitation sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('send-judge-invitation error:', message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### API Layer Updates

**Update categoriesApi.ts:**
```typescript
// Add method to send judge invitation
async sendJudgeInvitation(categoryId: string): Promise<{ success: boolean; error?: string }> {
  // First, get category with judge and contest info
  const { data: category, error: fetchError } = await supabase
    .from('categories')
    .select(`
      id,
      name,
      invited_at,
      assigned_judge_id,
      profiles:assigned_judge_id (
        id,
        email,
        first_name,
        last_name
      ),
      divisions!inner (
        contests!inner (
          id,
          name
        )
      )
    `)
    .eq('id', categoryId)
    .single();

  if (fetchError) throw fetchError;

  // Check if judge assigned
  if (!category.assigned_judge_id || !category.profiles) {
    return { success: false, error: 'NO_JUDGE_ASSIGNED' };
  }

  // Check if already invited
  if (category.invited_at) {
    return { success: false, error: 'ALREADY_INVITED' };
  }

  // Get submission count
  const { count: submissionCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryId);

  // Call Edge Function to send email
  const { data, error } = await supabase.functions.invoke('send-judge-invitation', {
    body: {
      categoryId,
      judgeEmail: category.profiles.email,
      judgeName: category.profiles.first_name
        ? `${category.profiles.first_name} ${category.profiles.last_name || ''}`.trim()
        : undefined,
      categoryName: category.name,
      contestName: category.divisions.contests.name,
      submissionCount: submissionCount ?? 0,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
},

// MODIFY updateStatus to trigger invitation on close
async updateStatus(categoryId: string, status: CategoryStatus): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update({ status })
    .eq('id', categoryId);

  if (error) throw error;

  // If closing, the caller should handle sending the invitation
  // (Hook will call sendJudgeInvitation separately for better UX feedback)
},
```

### Hook Updates

**Modify useUpdateCategoryStatus.ts:**
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/categoriesApi';
import { toast } from '@/components/ui';
import type { CategoryStatus } from '../types/category.types';

export function useUpdateCategoryStatus(contestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      categoryId,
      status,
    }: {
      categoryId: string;
      status: CategoryStatus;
    }) => {
      // Update status first
      await categoriesApi.updateStatus(categoryId, status);

      // If closing, try to send judge invitation
      if (status === 'closed') {
        const result = await categoriesApi.sendJudgeInvitation(categoryId);

        if (!result.success) {
          if (result.error === 'NO_JUDGE_ASSIGNED') {
            // Return special marker for warning toast
            return { warning: 'NO_JUDGE_ASSIGNED' };
          }
          // ALREADY_INVITED is not an error - just means no email needed
          if (result.error !== 'ALREADY_INVITED') {
            console.error('Failed to send invitation:', result.error);
          }
        }
      }

      return { success: true };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['categories', contestId] });
      queryClient.invalidateQueries({ queryKey: ['divisions'] });

      // Show warning if no judge assigned on close
      if (result?.warning === 'NO_JUDGE_ASSIGNED') {
        toast.warning('Category closed without judge assigned');
      }
    },
  });
}
```

### CategoryCard Updates

**Modify CategoryCard.tsx status change handler:**
```typescript
// In handleStatusChange function, after successful status update:
// The warning toast is now handled by the mutation's onSuccess callback
// No additional changes needed in CategoryCard - the hook handles everything
```

### Environment Configuration

**Add to Edge Function secrets:**
```bash
# Set Brevo API key for the Edge Function
npx supabase secrets set BREVO_API_KEY=your_brevo_api_key
npx supabase secrets set APP_URL=https://yourapp.com
```

**Configure Brevo Sender:**
1. Log into Brevo dashboard
2. Add and verify sender email domain
3. Create a verified sender identity for `noreply@yourdomain.com`

### Previous Story Learnings (Story 3-1)

**Edge Function Patterns Established:**
- CORS headers for all responses
- Auth verification via user's token
- Admin role check from profiles table
- Service role client for privileged operations
- Error handling with descriptive messages

**Category Types Already Have:**
- `assignedJudgeId` and `invitedAt` fields
- `assignedJudge` join with email, firstName, lastName
- Transform function for snake_case → camelCase

**Cache Invalidation:**
- Invalidate `['categories', contestId]` after changes
- Invalidate `['divisions']` for division-level views

### Testing Guidance

**Unit Tests:**
- categoriesApi.test.ts: Add tests for sendJudgeInvitation
- useUpdateCategoryStatus.test.tsx: Test invitation flow on close, warning toast
- Mock Edge Function responses

**Integration Tests (Manual):**
1. Assign judge to category
2. Change status to Closed → Verify email received
3. Close category without judge → Verify warning toast
4. Close already-invited category → Verify no duplicate email
5. Check invited_at timestamp is set after invitation

**Edge Function Testing:**
```bash
# Deploy function
npx supabase functions deploy send-judge-invitation

# Test locally (requires Brevo API key)
npx supabase functions serve send-judge-invitation --env-file .env.local
```

### Quality Gates

Before marking as "review":

```bash
# Git Status (REQUIRED)
git status          # Must show clean
git log --oneline -5  # Verify commits have "3-2:" prefix
git push -u origin story/3-2-judge-invitation-email

# Quality Gates (REQUIRED)
npm run build       # Must pass
npm run lint        # Must pass
npm run type-check  # Must pass
npm run test        # Must pass

# Edge Function Deployment (REQUIRED)
npx supabase functions deploy send-judge-invitation
npx supabase secrets set BREVO_API_KEY=<your_key>
npx supabase secrets set APP_URL=<your_app_url>

# Email Integration Test (REQUIRED)
# Manually test email delivery via Brevo test mode or real send
```

### Reference Documents

- [Source: epic-3-judge-onboarding-assignment.md#Story 3.2]
- [Source: prd/functional-requirements.md#FR21, FR61]
- [Source: architecture/core-architectural-decisions.md#API Patterns]
- [Source: 3-1-assign-judge-to-category.md#Edge Function Patterns]
- [Source: project-context.md#Bunny Upload Security] (Edge Function auth pattern)

## Tasks / Subtasks

- [x] Create send-judge-invitation Edge Function (AC5)
  - [x] Create supabase/functions/send-judge-invitation/index.ts
  - [x] Implement admin auth verification
  - [x] Implement Brevo API integration
  - [x] Update invited_at timestamp on success
  - [ ] Deploy function: `npx supabase functions deploy send-judge-invitation`
  - [ ] Set secrets: BREVO_API_KEY, APP_URL
- [x] Update categoriesApi (AC1, AC4)
  - [x] Add sendJudgeInvitation method
  - [x] Handle NO_JUDGE_ASSIGNED case
  - [x] Handle ALREADY_INVITED case (prevent duplicates)
  - [x] Fetch category with judge and contest info for email
- [x] Update useUpdateCategoryStatus hook (AC1, AC3, AC4)
  - [x] Call sendJudgeInvitation when status changes to 'closed'
  - [x] Show warning toast for no judge assigned
  - [x] Handle already-invited case silently
- [x] Create notifications feature (minimal)
  - [x] Create src/features/notifications/types/notification.types.ts
  - [x] Create src/features/notifications/index.ts
- [ ] Configure Brevo sender
  - [ ] Verify sender domain/email in Brevo dashboard
  - [ ] Update sender email in Edge Function if needed
- [x] Write unit tests
  - [x] useUpdateCategoryStatus.test.tsx with 6 tests for close + invitation flow
  - [x] Mock Edge Function responses
  - [x] Updated CategoryCard.test.tsx with sendJudgeInvitation mock
- [ ] Test email delivery end-to-end
  - [ ] Verify email content matches AC2
  - [ ] Verify subject line format
  - [ ] Verify login link works
- [x] Run quality gates and verify

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All 6 useUpdateCategoryStatus hook tests pass
- Type check passes
- Lint passes (only pre-existing shadcn/ui warnings)
- Build completes successfully

### Completion Notes

**Implementation Summary:**

1. **Edge Function Created** (`supabase/functions/send-judge-invitation/index.ts`):
   - Admin auth verification via user's JWT token
   - Admin role check from profiles table
   - Brevo API integration for transactional email
   - Updates `invited_at` timestamp on category after successful send
   - CORS headers for browser requests
   - Service role client for privileged database operations

2. **categoriesApi Extended**:
   - Added `sendJudgeInvitation(categoryId)` method
   - Fetches category with judge info and contest name via division join
   - Returns `NO_JUDGE_ASSIGNED` error code when no judge (AC3)
   - Returns `ALREADY_INVITED` when `invited_at` is set (AC4)
   - Gets submission count for email content

3. **useUpdateCategoryStatus Hook Updated**:
   - Automatically calls `sendJudgeInvitation` when status changes to 'closed' (AC1)
   - Shows warning toast "Category closed without judge assigned" (AC3)
   - Silently handles `ALREADY_INVITED` (no duplicate emails - AC4)
   - Logs errors for other failures but doesn't block status update

4. **Notifications Feature (Minimal)**:
   - Created `notification.types.ts` with `JudgeInvitationPayload` and `JudgeInvitationResponse` types
   - Updated `index.ts` to export types

5. **Tests Added**:
   - `useUpdateCategoryStatus.test.tsx` with 6 tests covering all AC scenarios
   - Updated `CategoryCard.test.tsx` mocks for `sendJudgeInvitation`

**Remaining Manual Steps (marked pending):**
- Deploy Edge Function: `npx supabase functions deploy send-judge-invitation`
- Set secrets: `BREVO_API_KEY`, `APP_URL`, `BREVO_SENDER_EMAIL`
- Configure Brevo sender domain/email
- End-to-end email delivery testing

### File List

**New Files:**
- supabase/functions/send-judge-invitation/index.ts
- src/features/categories/hooks/useUpdateCategoryStatus.test.tsx
- src/features/notifications/types/notification.types.ts

**Modified Files:**
- _bmad-output/implementation-artifacts/sprint-status.yaml
- src/features/categories/api/categoriesApi.ts
- src/features/categories/components/CategoryCard.test.tsx
- src/features/categories/hooks/useUpdateCategoryStatus.ts
- src/features/notifications/index.ts

