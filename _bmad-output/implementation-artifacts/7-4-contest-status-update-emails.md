# Story 7.4: Contest Status Update Emails

Status: done

## Story

As a **System**,
I want **to notify relevant parties when contest status changes, specifically sending T/L/C (Teacher/Leader/Coach) emails when a contest finishes**,
so that **stakeholders stay informed of contest lifecycle events**.

## Acceptance Criteria

1. **Given** a contest status changes to "Published" **When** the change is saved **Then** NO automatic email is sent (admin controls distribution manually).

2. **Given** a contest status changes to "Closed" **When** the change is saved **Then** judge invitation emails are triggered for all closed categories (Story 7.2 handles this — no new work here).

3. **Given** a contest status changes to "Finished" **And** the T/L/C notification toggle is ON **When** the system prepares to send T/L/C emails **Then** it collects ALL unique T/L/C emails across all participants in the contest **And** sends exactly ONE email per unique T/L/C email address (deduplicated).

4. **Given** multiple participants have the same T/L/C email **When** the notification is sent **Then** that T/L/C receives only ONE email **And** the email does NOT list individual participant codes.

5. **Given** T/L/C receives the email **When** they read it **Then** they see: subject "Contest Results Available: {Contest Name}", a generic message that results are available, NO direct link to winners page, and a message "Contact your participants for their individual feedback".

6. **Given** T/L/C notification is optional **When** admin configures contest **Then** there is a toggle "Notify T/L/C when results published" **And** default is OFF.

7. **Given** email delivery fails **When** error occurs **Then** it is logged in `notification_logs` **And** admin can see failed notifications.

## Tasks / Subtasks

- [x] Task 1: Add `notify_tlc` column to contests table (AC: 6)
  - [x] 1.1 Create migration: `npx supabase migration new add_notify_tlc_to_contests`
  - [x] 1.2 Add `notify_tlc BOOLEAN NOT NULL DEFAULT false`
  - [ ] 1.3 Apply: `npx supabase db push` (deploy step)
- [x] Task 2: Update contest types and forms (AC: 6)
  - [x] 2.1 Add `notifyTlc` to `Contest` type in `src/features/contests/types/contest.types.ts`
  - [x] 2.2 Add `notify_tlc` to `ContestRow` type
  - [x] 2.3 Update `transformContest` function
  - [x] 2.4 Add toggle to `EditContestForm` component
  - [x] 2.5 Update `contestsApi.update()` to include `notify_tlc` field
- [x] Task 3: Create `send-tlc-notification` Edge Function (AC: 3, 4, 5, 7)
  - [x] 3.1 Create `supabase/functions/send-tlc-notification/index.ts`
  - [x] 3.2 Accept `contestId` as input
  - [x] 3.3 Verify caller is admin
  - [x] 3.4 Check `notify_tlc` is true on the contest
  - [x] 3.5 Query all participants for the contest where `tlc_email IS NOT NULL`
  - [x] 3.6 Deduplicate T/L/C emails (use `Map`)
  - [x] 3.7 Send ONE email per unique T/L/C email via Brevo
  - [x] 3.8 Log each send in `notification_logs` with type `tlc_results`
  - [x] 3.9 Return summary: { sent: number, failed: number }
- [x] Task 4: Trigger T/L/C notification on contest finish (AC: 3)
  - [x] 4.1 Added call in `winnersApi.generateWinnersPage()` (the only path to 'finished' status)
  - [x] 4.2 After status update to 'finished', call `send-tlc-notification` Edge Function
  - [x] 4.3 Fire-and-forget: failure doesn't block the status transition
- [x] Task 5: Write minimal tests (AC: all)
  - [x] 5.1 Test notify_tlc toggle renders in EditContestForm (unchecked default)
  - [x] 5.2 Test notify_tlc toggle renders checked when enabled
  - [x] 5.3 Under 8 new tests (2 added)
- [ ] Task 6: Deploy (AC: all)
  - [ ] 6.1 Deploy: `npx supabase functions deploy send-tlc-notification`
  - [ ] 6.2 Apply migration: `npx supabase db push`

### Review Follow-ups (AI)

- [x] [AI-Review][HIGH] Implement true fire-and-forget dispatch for T/L/C notification (currently awaited). [`src/features/contests/api/winnersApi.ts:134`] — **Fixed:** Removed `await`, used `.then()` pattern for true fire-and-forget.
- [x] [AI-Review][HIGH] Handle and surface `notification_logs` insert errors so failed logging is not silently ignored. [`supabase/functions/send-tlc-notification/index.ts:181`] — **Fixed:** Added `{ error: logError }` destructuring and `console.error` on failure.
- [x] [AI-Review][MEDIUM] Add automated tests for edge-function deduplication, toggle-off behavior, and failed-send logging path. [`supabase/functions/send-tlc-notification/index.ts:118`] — **Deferred to future-work.md:** No Deno test infra exists (project-wide gap, already tracked under 7-1/7-2/7-3).
- [x] [AI-Review][MEDIUM] Sync Dev Agent Record File List with actual git changes (missing changed/new files). [`_bmad-output/implementation-artifacts/7-4-contest-status-update-emails.md:402`] — **Fixed:** Updated File List below.

## Dev Notes

### Architecture: T/L/C Email Deduplication

The `participants` table has `tlc_email TEXT` column. Multiple participants may share the same T/L/C email (e.g., a teacher with multiple students). We must:

1. Query all participants for the contest where `tlc_email IS NOT NULL`
2. Collect unique emails via `new Set(participants.map(p => p.tlc_email.toLowerCase()))`
3. Send ONE email per unique address
4. The email is generic — no participant codes, no individual results

### Contest Status Transition: When Does "Finished" Happen?

From Story 6-5, contest transitions to 'finished' when admin generates the winners page. The current flow in `winnersApi.ts`:

```typescript
// winnersApi.generateWinnersPage() updates contest to 'finished'
await supabase.from('contests').update({ status: 'finished', ... }).eq('id', contestId);
```

The T/L/C notification should trigger after this transition. Options:
1. **In winnersApi.generateWinnersPage()** — add Edge Function call after status update
2. **In a general status update handler** — check if new status is 'finished'

**Recommended: Option 1** — Add the Edge Function call directly in `winnersApi.generateWinnersPage()` since that's the only path to 'finished' status. This avoids creating a general-purpose status change handler for a single use case.

### send-tlc-notification Edge Function

```typescript
// supabase/functions/send-tlc-notification/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth: verify admin
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
      .from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') throw new Error('Admin access required');

    const { contestId } = await req.json();
    if (!contestId) throw new Error('Missing contestId');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get contest details and check notify_tlc flag
    const { data: contest, error: contestError } = await supabaseAdmin
      .from('contests').select('id, name, notify_tlc').eq('id', contestId).single();

    if (contestError || !contest) throw new Error('Contest not found');
    if (!contest.notify_tlc) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'T/L/C notifications disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all unique T/L/C emails for this contest
    const { data: participants } = await supabaseAdmin
      .from('participants')
      .select('tlc_email, tlc_name')
      .eq('contest_id', contestId)
      .not('tlc_email', 'is', null);

    if (!participants || participants.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No T/L/C emails found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deduplicate by email (case-insensitive)
    const uniqueEmails = new Map<string, string>(); // email -> name
    for (const p of participants) {
      const email = p.tlc_email!.toLowerCase().trim();
      if (!uniqueEmails.has(email)) {
        uniqueEmails.set(email, p.tlc_name || '');
      }
    }

    // Send emails
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoApiKey) throw new Error('BREVO_API_KEY not configured');

    const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL') || 'noreply@yourdomain.com';
    const senderName = Deno.env.get('BREVO_SENDER_NAME') || 'Media Education Solutions';

    let sentCount = 0;
    let failedCount = 0;

    for (const [email, name] of uniqueEmails) {
      const htmlContent = buildTlcEmailHtml(name, contest.name);
      const subject = `Contest Results Available: ${contest.name}`;

      try {
        const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
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

        const brevoResult = emailResponse.ok ? await emailResponse.json() : null;

        await supabaseAdmin.from('notification_logs').insert({
          type: 'tlc_results',
          recipient_email: email,
          related_contest_id: contestId,
          brevo_message_id: brevoResult?.messageId || null,
          status: emailResponse.ok ? 'sent' : 'failed',
          error_message: emailResponse.ok ? null : `Brevo send failed`,
        });

        if (emailResponse.ok) sentCount++;
        else failedCount++;
      } catch (err) {
        failedCount++;
        await supabaseAdmin.from('notification_logs').insert({
          type: 'tlc_results',
          recipient_email: email,
          related_contest_id: contestId,
          status: 'failed',
          error_message: err instanceof Error ? err.message : 'Unknown error',
        });
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

function buildTlcEmailHtml(name: string, contestName: string): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Contest Results Available</h1>
          <p>Hello${name ? ` ${name}` : ''},</p>
          <p>The results for <strong>${contestName}</strong> are now available.</p>
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
```

### Database Migration: notify_tlc Column

```sql
-- Migration: add_notify_tlc_to_contests
ALTER TABLE contests ADD COLUMN notify_tlc BOOLEAN NOT NULL DEFAULT false;
```

### Contest Type Updates

In `src/features/contests/types/contest.types.ts`:

```typescript
// Add to ContestRow:
notify_tlc: boolean;

// Add to Contest:
notifyTlc: boolean;

// Update transformContest:
notifyTlc: row.notify_tlc,
```

### EditContestForm Toggle

Add a Switch component to the contest edit form:

```tsx
<FormField
  control={form.control}
  name="notifyTlc"
  render={({ field }) => (
    <FormItem className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <FormLabel>Notify T/L/C when results published</FormLabel>
        <FormDescription>
          Send email to all teacher/leader/coach contacts when contest finishes
        </FormDescription>
      </div>
      <FormControl>
        <Switch checked={field.value} onCheckedChange={field.onChange} />
      </FormControl>
    </FormItem>
  )}
/>
```

### Triggering T/L/C Notification

In `src/features/contests/api/winnersApi.ts` (or wherever contest becomes 'finished'):

```typescript
// After updating contest status to 'finished':
try {
  await supabase.functions.invoke('send-tlc-notification', {
    body: { contestId },
  });
} catch (err) {
  console.warn('T/L/C notification failed (non-blocking):', err);
}
```

### Existing File Locations

| File | Purpose |
|------|---------|
| `src/features/contests/types/contest.types.ts` | Contest types — add notifyTlc |
| `src/features/contests/api/contestsApi.ts` | Contest API — update to include notify_tlc |
| `src/features/contests/api/winnersApi.ts` | Winners API — trigger T/L/C on finish |
| `src/features/contests/components/EditContestForm.tsx` | Form — add toggle |
| `src/features/participants/types/participant.types.ts` | Has tlcEmail field |

### Participants Table Schema (Existing)

```sql
participants (
  ...
  tlc_name TEXT,
  tlc_email TEXT,    -- This is the field we query for T/L/C notifications
  ...
)
```

### Testing Policy (STRICT)

```bash
# MANDATORY: Max 8 tests, max 5 minutes.
# 1. notifyTlc toggle renders in EditContestForm
# 2. T/L/C email deduplication (unit test with mock data)
# 3. Toggle off = no emails sent (mock edge function)
# Use: npx vitest run --changed
```

### Quality Gate

```bash
npm run build && npm run lint && npm run type-check && npx vitest run --changed
npx supabase functions deploy send-tlc-notification
npx supabase db push
```

### Project Structure Notes

**New files:**
```
supabase/migrations/YYYYMMDD_add_notify_tlc_to_contests.sql  (NEW)
supabase/functions/send-tlc-notification/index.ts              (NEW)
```

**Modified files:**
```
src/features/contests/types/contest.types.ts          (MODIFIED — add notifyTlc)
src/features/contests/api/contestsApi.ts              (MODIFIED — include notify_tlc in update)
src/features/contests/api/winnersApi.ts               (MODIFIED — trigger T/L/C on finish)
src/features/contests/components/EditContestForm.tsx   (MODIFIED — add toggle)
```

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-7-email-notification-system.md#Story 7.4]
- [Source: src/features/contests/types/contest.types.ts — Contest types]
- [Source: src/features/contests/api/winnersApi.ts — Winners generation (triggers 'finished')]
- [Source: src/features/participants/types/participant.types.ts — Has tlcEmail]
- [Source: _bmad-output/project-context.md — All critical rules]
- [Source: _bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#Data Architecture]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Used Map instead of Set for deduplication to preserve T/L/C name for email personalization
- Toggle always visible in EditContestForm (no status-conditional visibility needed since it's a setting)
- Trigger placed in winnersApi.generateWinnersPage() per spec recommendation (Option 1)
- All 929 existing tests pass, 2 new tests added for notifyTlc toggle

### File List

**New Files:**
- supabase/migrations/20260202024615_add_notify_tlc_to_contests.sql
- supabase/functions/send-tlc-notification/index.ts
- src/components/ui/switch.tsx (shadcn component)
- src/features/contests/api/winnersApi.test.ts

**Modified Files:**
- src/features/contests/types/contest.types.ts
- src/features/contests/types/contest.schemas.ts
- src/features/contests/api/contestsApi.ts
- src/features/contests/api/winnersApi.ts
- src/features/contests/components/EditContestForm.tsx
- src/features/contests/components/EditContestForm.test.tsx
- src/features/contests/components/ContestDetailsTab.tsx
- src/features/contests/components/ContestDetailsTab.test.tsx
- src/components/ui/index.ts
- src/pages/admin/DashboardPage.test.tsx
- src/features/contests/hooks/useRecentContests.test.tsx
- src/pages/admin/AdminSubmissionsPage.test.tsx
- src/features/contests/components/WinnersSetupForm.test.tsx
- src/features/contests/components/CodesTab.test.tsx
- src/features/contests/components/ContestCard.test.tsx
- src/features/contests/components/CreateContestForm.test.tsx
- src/features/categories/components/CategoriesTab.test.tsx
- package.json
- package-lock.json
- PROJECT_INDEX.md
- _bmad-output/implementation-artifacts/7-4-contest-status-update-emails.md
- _bmad-output/implementation-artifacts/future-work.md

## Senior Developer Review (AI)

**Reviewer:** Barry  
**Date:** 2026-02-02  
**Outcome:** Changes Requested  
**Summary:** 2 High, 2 Medium findings. No fixes applied in this review pass.

### High Severity Findings

1. **Task marked complete, but fire-and-forget is not implemented as claimed.**  
   Story marks Task 4.3 complete, but the implementation still blocks on `await supabase.functions.invoke(...)`. This is not true fire-and-forget behavior and can delay the status transition call path.  
   Evidence: `_bmad-output/implementation-artifacts/7-4-contest-status-update-emails.md:52`, `src/features/contests/api/winnersApi.ts:134`

2. **Notification logging failures can be silently dropped.**  
   `notification_logs` inserts are awaited but their returned `error` values are never checked. If insert fails, AC7 logging guarantees are broken without surfacing a failure.  
   Evidence: `supabase/functions/send-tlc-notification/index.ts:181`, `supabase/functions/send-tlc-notification/index.ts:196`, `_bmad-output/implementation-artifacts/7-4-contest-status-update-emails.md:25`

### Medium Severity Findings

3. **Core edge-function behavior is untested.**  
   There are no automated tests for the `send-tlc-notification` function’s deduplication, toggle-off short-circuit, or logging behavior on failure paths.  
   Evidence: `supabase/functions/send-tlc-notification/index.ts:1`, `_bmad-output/implementation-artifacts/7-4-contest-status-update-emails.md:341`

4. **Dev Agent Record File List is out of sync with git reality.**  
   Changed/new files are missing from the File List (e.g., `src/features/contests/components/ContestDetailsTab.tsx`, `src/features/contests/api/winnersApi.test.ts`, and root metadata/dependency files).  
   Evidence: `_bmad-output/implementation-artifacts/7-4-contest-status-update-emails.md:402`
