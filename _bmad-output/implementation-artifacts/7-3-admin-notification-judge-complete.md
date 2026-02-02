# Story 7.3: Admin Notification - Judge Complete

Status: review

## Story

As a **System**,
I want **to refactor admin judge-completion notifications to use delivery logging and add an "all judging complete" summary email**,
so that **admins are tracked on notifications received and get a clear signal when all judging is finished**.

## Acceptance Criteria

1. **Given** a judge marks a category as complete (Story 5.6) **When** the completion is confirmed **Then** the system triggers admin notification email with a `notification_logs` entry.

2. **Given** the notification triggers **When** the email is composed **Then** it is sent to ALL users with role `admin` (super_admin) **And** if multiple admins exist, all receive the email.

3. **Given** the email template **When** it renders **Then** it includes: judge name, contest name, category name, completion timestamp, and link to admin dashboard.

4. **Given** the email is sent or fails **When** logged **Then** an entry is created in `notification_logs` with type `judge_complete`, recipient info, and status.

5. **Given** ALL categories in a contest are marked complete (all have `judging_completed_at`) **When** the last judge completes **Then** an additional summary email is sent to all admins with subject "All Judging Complete: {Contest Name}" **And** includes summary of all categories and judges.

6. **Given** the email fails **When** the error occurs **Then** it is logged to `notification_logs` **And** the category completion is NOT rolled back (email is non-blocking).

## Tasks / Subtasks

- [x] Task 1: Add notification_logs to existing `notify-admin-category-complete` Edge Function (AC: 1, 4, 6)
  - [x] 1.1 Update `supabase/functions/notify-admin-category-complete/index.ts`
  - [x] 1.2 Insert `notification_logs` entry for each admin email sent
  - [x] 1.3 Set status `sent` on success, `failed` on error per admin
  - [x] 1.4 Include `related_contest_id` and `related_category_id` in log
- [x] Task 2: Add "all judging complete" check (AC: 5)
  - [x] 2.1 After individual notification, query all categories for the contest
  - [x] 2.2 Check if ALL categories have `judging_completed_at` set
  - [x] 2.3 If all complete, send additional summary email to all admins
  - [x] 2.4 Log summary email in notification_logs with type `judge_complete` and note in params
- [x] Task 3: Write minimal tests (AC: all)
  - [x] 3.1 Test the "all complete" detection logic (mock category query)
  - [x] 3.2 Target: under 6 tests total (5 tests written)
- [ ] Task 4: Deploy (AC: all)
  - [ ] 4.1 Deploy: `npx supabase functions deploy notify-admin-category-complete`

## Dev Notes

### What Already Exists (CRITICAL — DO NOT REINVENT)

**Edge Function: `supabase/functions/notify-admin-category-complete/index.ts`**
- Already functional from Story 5-6
- Handles: JWT auth (judge), service role for admin lookup, Brevo email to all admins, category + contest context via division join
- 211 lines of working code

**Frontend integration: `src/features/categories/api/categoriesApi.ts:~462`**
- `markCategoryComplete()` already calls `notify-admin-category-complete` Edge Function
- Fire-and-forget: failure doesn't undo the completion
- Called from `useMarkCategoryComplete` hook

### Implementation Strategy: Augment the Existing Edge Function

Same approach as Story 7-2: add `notification_logs` entries to the existing function, don't replace it.

### Changes to notify-admin-category-complete Edge Function

**Add logging after each admin email send:**

```typescript
// After Brevo API call for each admin
for (const admin of admins) {
  const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', { ... });

  // Log the attempt
  await supabaseAdmin.from('notification_logs').insert({
    type: 'judge_complete',
    recipient_email: admin.email,
    recipient_id: null, // Admin ID not critical for logging
    related_contest_id: contestId,
    related_category_id: categoryId,
    brevo_message_id: emailResponse.ok ? (await emailResponse.json()).messageId : null,
    status: emailResponse.ok ? 'sent' : 'failed',
    error_message: emailResponse.ok ? null : `Brevo send failed for ${admin.email}`,
  });
}
```

**Add "all judging complete" check after individual notifications:**

```typescript
// After sending individual category-complete notifications...
// Check if ALL categories in the contest are now complete
const { data: allCategories } = await supabaseAdmin
  .from('categories')
  .select('id, name, judging_completed_at, assigned_judge_id, divisions!inner(contest_id)')
  .eq('divisions.contest_id', contestId);

const allComplete = allCategories?.every(c => c.judging_completed_at !== null);

if (allComplete) {
  // Send "All Judging Complete" summary email to all admins
  for (const admin of admins) {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      // ... same headers ...
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: admin.email }],
        subject: `All Judging Complete: ${contestName}`,
        htmlContent: buildAllCompleteHtml(admin, contestName, allCategories, appUrl),
      }),
    });

    // Log summary email
    await supabaseAdmin.from('notification_logs').insert({
      type: 'judge_complete',
      recipient_email: admin.email,
      related_contest_id: contestId,
      status: 'sent',
    });
  }
}
```

### All-Complete Summary Email HTML

```typescript
function buildAllCompleteHtml(admin, contestName, categories, appUrl) {
  const categorySummary = categories.map(c =>
    `<tr><td>${c.name}</td><td>${c.judging_completed_at ? 'Complete' : 'Pending'}</td></tr>`
  ).join('');

  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #16a34a;">All Judging Complete!</h1>
          <p>Hello${admin.first_name ? ` ${admin.first_name}` : ''},</p>
          <p>All categories in <strong>${contestName}</strong> have been judged.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f3f4f6;"><th style="padding: 8px; text-align: left;">Category</th><th style="padding: 8px;">Status</th></tr>
            ${categorySummary}
          </table>
          <p><a href="${appUrl}/admin/dashboard" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Review Results & Generate Winners</a></p>
        </div>
      </body>
    </html>
  `;
}
```

### Contest ID Extraction

The existing function already gets contest data via division join. Extract `contestId`:

```typescript
const contestId = categoryData.divisions.contests.id;
```

### Query for All Categories in Contest

The categories table references `division_id`, and divisions reference `contest_id`. To get all categories for a contest:

```typescript
// Get all categories for this contest (via divisions)
const { data: contestDivisions } = await supabaseAdmin
  .from('divisions')
  .select('id')
  .eq('contest_id', contestId);

const divisionIds = contestDivisions?.map(d => d.id) || [];

const { data: allCategories } = await supabaseAdmin
  .from('categories')
  .select('id, name, judging_completed_at')
  .in('division_id', divisionIds);
```

### Existing File Locations

| File | Purpose |
|------|---------|
| `supabase/functions/notify-admin-category-complete/index.ts` | Edge Function to modify |
| `src/features/categories/api/categoriesApi.ts:~444` | `markCategoryComplete()` caller |
| `src/features/categories/hooks/useMarkCategoryComplete.ts` | Hook that triggers notification |

### Testing Policy (STRICT)

```bash
# MANDATORY: Max 6 tests, max 5 minutes.
# 1. All-complete detection logic (all categories have judging_completed_at)
# 2. Partial-complete returns false
# Use: npx vitest run --changed
```

### Quality Gate

```bash
npm run build && npm run lint && npm run type-check && npx vitest run --changed
npx supabase functions deploy notify-admin-category-complete
```

### Project Structure Notes

**Modified files:**
```
supabase/functions/notify-admin-category-complete/index.ts  (MODIFIED — add logging + all-complete check)
```

No frontend changes needed. The existing `categoriesApi.markCategoryComplete()` already calls this Edge Function fire-and-forget.

### References

- [Source: supabase/functions/notify-admin-category-complete/index.ts — Existing Edge Function (211 lines)]
- [Source: src/features/categories/api/categoriesApi.ts:444 — markCategoryComplete method]
- [Source: src/features/categories/hooks/useMarkCategoryComplete.ts — Hook calling the API]
- [Source: src/features/categories/types/category.types.ts — Category types with judgingCompletedAt]
- [Source: _bmad-output/planning-artifacts/epics/epic-7-email-notification-system.md#Story 7.3]
- [Source: _bmad-output/project-context.md — All critical rules]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- All 6 ACs satisfied
- Edge Function augmented from 211 to 352 lines
- notification_logs entries created for both individual and summary emails
- "All Judging Complete" detection uses divisions→categories query pattern
- 5 tests for isAllJudgingComplete utility (all passing)
- Build, lint, type-check all clean
- Deploy pending user confirmation
- Adversarial review: 12 findings total, 5 fixed (F4/F5/F7/F11/F12), 7 deferred to future-work.md
- Resolution approach: auto-fix real findings, defer noise/pre-existing to future-work

### File List

**Modified Files:**
- supabase/functions/notify-admin-category-complete/index.ts
- src/features/notifications/index.ts
- _bmad-output/implementation-artifacts/7-3-admin-notification-judge-complete.md

**New Files:**
- src/features/notifications/utils/isAllJudgingComplete.ts
- src/features/notifications/utils/isAllJudgingComplete.test.ts
