# Story 7.2: Judge Invitation Email

Status: ready-for-dev

## Story

As a **System**,
I want **to refactor judge invitation emails to use the centralized notification infrastructure with delivery logging**,
so that **judge invitations are tracked, can be retried, and follow the unified email pattern**.

## Acceptance Criteria

1. **Given** a category deadline passes or admin manually closes **When** the category status changes to "Closed" **Then** the system triggers judge invitation email via the centralized `send-notification` Edge Function.

2. **Given** the category has an assigned judge **When** the invitation triggers **Then** an email is sent with: judge's name, contest name, category name, submission count, login/set-password link, and category deadline if set.

3. **Given** the email is sent **When** it succeeds or fails **Then** a `notification_logs` entry is created with type `judge_invitation`, recipient email, related contest/category IDs, and status.

4. **Given** `categories.invited_at` is null **When** the invitation email sends successfully **Then** `invited_at` is updated with the current timestamp.

5. **Given** the judge has never logged in **When** they click the login link **Then** they are directed to the set-password flow (via Supabase invite link).

6. **Given** the email fails to send **When** the error occurs **Then** the error is logged in `notification_logs` **And** admin can see "Invitation Failed" status **And** admin can manually trigger re-send.

7. **Given** admin manually re-sends invitation **When** they click "Resend Invite" **Then** a new email is sent **And** `invited_at` is updated **And** a new `notification_logs` entry is created.

## Tasks / Subtasks

- [ ] Task 1: Refactor `send-judge-invitation` Edge Function to use `send-notification` (AC: 1, 2, 3, 5)
  - [ ] 1.1 Update `supabase/functions/send-judge-invitation/index.ts`
  - [ ] 1.2 Keep existing auth check (admin only) and data gathering logic
  - [ ] 1.3 Keep Supabase invite link generation (`auth.admin.generateLink`)
  - [ ] 1.4 Build HTML content inline (keep existing template)
  - [ ] 1.5 Call `send-notification` Edge Function (or call Brevo directly + log to notification_logs via service role)
  - [ ] 1.6 Update `invited_at` on category after successful send
  - [ ] 1.7 Deploy: `npx supabase functions deploy send-judge-invitation`
- [ ] Task 2: Add notification logging to existing flow (AC: 3, 6)
  - [ ] 2.1 Insert `notification_logs` entry in send-judge-invitation Edge Function
  - [ ] 2.2 Set status `sent` on success, `failed` on error
  - [ ] 2.3 Include `related_contest_id` and `related_category_id` in log
- [ ] Task 3: Add resend capability to admin UI (AC: 7)
  - [ ] 3.1 Add `resendJudgeInvitation(categoryId)` method to `categoriesApi`
  - [ ] 3.2 Allow resend even if `invited_at` is already set (clear the duplicate prevention for manual resend)
  - [ ] 3.3 Add "Resend Invite" button on category card when judge is assigned and category is closed
  - [ ] 3.4 Show toast on success/failure
- [ ] Task 4: Update notification types if needed (AC: 3)
  - [ ] 4.1 Verify `JudgeInvitationPayload` type still matches
- [ ] Task 5: Write minimal tests (AC: all)
  - [ ] 5.1 Test resend flow in useUpdateCategoryStatus or categoriesApi
  - [ ] 5.2 Target: under 8 tests total
- [ ] Task 6: Deploy and verify (AC: all)
  - [ ] 6.1 Deploy: `npx supabase functions deploy send-judge-invitation`
  - [ ] 6.2 Verify email delivery end-to-end

## Dev Notes

### What Already Exists (CRITICAL — DO NOT REINVENT)

**Edge Function: `supabase/functions/send-judge-invitation/index.ts`**
- Already functional from Story 3-2/3-3
- Handles: admin auth, judge profile validation, Supabase invite link generation, Brevo email send, `invited_at` update
- 217 lines of working code

**Frontend hook: `src/features/categories/hooks/useUpdateCategoryStatus.ts`**
- Already calls `categoriesApi.sendJudgeInvitation()` when status changes to 'closed'
- Handles NO_JUDGE_ASSIGNED warning toast
- Handles ALREADY_INVITED silently

**API: `src/features/categories/api/categoriesApi.ts`**
- `sendJudgeInvitation(categoryId)` method already exists
- Fetches category with judge info and contest name
- Returns NO_JUDGE_ASSIGNED / ALREADY_INVITED error codes

### Implementation Strategy: Augment, Don't Replace

The existing `send-judge-invitation` Edge Function works. The primary change in this story is to **add notification_logs** logging to the existing function, NOT replace it with a call to `send-notification`.

**Why not call `send-notification`?** The judge invitation has special logic:
1. Generates a Supabase invite link (`auth.admin.generateLink`)
2. Validates judge exists in profiles with correct role
3. Updates `invited_at` timestamp on category

These are domain-specific operations that belong in the dedicated function. The `send-notification` function is for simple send-and-log. Here, we add logging directly.

### Changes to send-judge-invitation Edge Function

Add after the Brevo API call succeeds:

```typescript
// Log successful send to notification_logs
await supabaseAdmin.from('notification_logs').insert({
  type: 'judge_invitation',
  recipient_email: judgeEmail,
  recipient_id: judgeProfile.id,
  related_contest_id: contestId, // Extract from category data
  related_category_id: categoryId,
  brevo_message_id: brevoResult?.messageId || null,
  status: 'sent',
});
```

And in the error path:

```typescript
// Log failed send
await supabaseAdmin.from('notification_logs').insert({
  type: 'judge_invitation',
  recipient_email: judgeEmail,
  recipient_id: judgeProfile?.id || null,
  related_contest_id: contestId || null,
  related_category_id: categoryId,
  status: 'failed',
  error_message: errorMsg,
});
```

### Resend Invitation Flow

Add to `categoriesApi.ts`:

```typescript
async resendJudgeInvitation(categoryId: string): Promise<{ success: boolean; error?: string }> {
  // Same as sendJudgeInvitation but skip the ALREADY_INVITED check
  // Fetch category with judge info (same query as existing method)
  // Call send-judge-invitation Edge Function
  // The Edge Function handles invited_at update
}
```

Add "Resend Invite" button to `CategoryCard.tsx`:
- Show when: category.status === 'closed' && category.assignedJudgeId && category.invitedAt
- On click: call `resendJudgeInvitation` and show toast

### Contest ID Extraction

The existing Edge Function fetches category data via `categories → divisions → contests`. Extract `contestId` for the notification_logs entry:

```typescript
const contestId = categoryData.divisions.contests.id;
```

This is already available in the category query — just need to include it in the log insert.

### Existing File Locations

| File | Purpose |
|------|---------|
| `supabase/functions/send-judge-invitation/index.ts` | Edge Function to modify |
| `src/features/categories/api/categoriesApi.ts:~270` | `sendJudgeInvitation()` method |
| `src/features/categories/hooks/useUpdateCategoryStatus.ts` | Hook that calls on close |
| `src/features/categories/components/CategoryCard.tsx` | UI to add resend button |
| `src/features/categories/types/category.types.ts` | Category types (has invitedAt) |
| `src/features/notifications/types/notification.types.ts` | Notification types |

### Testing Policy (STRICT)

```bash
# MANDATORY: Max 8 tests, max 5 minutes.
# 1. resendJudgeInvitation API method (mock edge function)
# 2. CategoryCard resend button visibility (closed + judge + invitedAt)
# Use: npx vitest run --changed
```

### Quality Gate

```bash
npm run build && npm run lint && npm run type-check && npx vitest run --changed
npx supabase functions deploy send-judge-invitation
```

### Project Structure Notes

**Modified files:**
```
supabase/functions/send-judge-invitation/index.ts       (MODIFIED — add notification_logs)
src/features/categories/api/categoriesApi.ts            (MODIFIED — add resendJudgeInvitation)
src/features/categories/components/CategoryCard.tsx     (MODIFIED — add resend button)
```

### References

- [Source: supabase/functions/send-judge-invitation/index.ts — Existing Edge Function (217 lines)]
- [Source: src/features/categories/api/categoriesApi.ts — sendJudgeInvitation method]
- [Source: src/features/categories/hooks/useUpdateCategoryStatus.ts — Hook calling on close]
- [Source: _bmad-output/implementation-artifacts/3-2-judge-invitation-email.md — Original story]
- [Source: _bmad-output/planning-artifacts/epics/epic-7-email-notification-system.md#Story 7.2]
- [Source: _bmad-output/project-context.md — All critical rules]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
