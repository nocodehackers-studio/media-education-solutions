---
title: 'Deadline Countdown & Auto-Close Automation'
slug: 'deadline-countdown-auto-close'
created: '2026-02-07'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4, 5, 6]
review_notes: '7 findings from adversarial review. All 7 fixed: F1(HTML escaping in email), F2(FOR UPDATE lock in trigger), F3(>24h countdown transition), F4(time guard + hasMore), F5(safe timezone formatting), F6(remove CORS), F7(muted styling for closed state).'
tech_stack: [React 19, TypeScript, Tailwind CSS v4, Supabase (PostgreSQL + Edge Functions), TanStack Query, pg_cron, pg_net, Vitest, date-fns]
files_to_modify:
  - src/features/participants/components/DeadlineCountdown.tsx
  - src/features/participants/components/DeadlineCountdown.test.tsx
  - src/features/categories/components/CategoryCard.tsx
  - src/features/categories/components/CategoryCard.test.tsx
  - supabase/functions/close-expired-categories/index.ts (NEW)
  - supabase/migrations/<timestamp>_add_auto_close_cron_and_trigger.sql (NEW — use `npx supabase migration new`)
code_patterns:
  - 'pg_cron + pg_net pattern: migration creates cron.schedule calling net.http_post to Edge Function'
  - 'Edge Function auth: service_role_key from vault.decrypted_secrets for server-to-server calls'
  - 'Feature index exports: every new file must be exported from feature index.ts'
  - 'Named exports only, no default exports'
  - 'snake_case DB → camelCase TypeScript transformation in API layer'
  - 'Co-located tests: ComponentName.test.tsx in same folder'
  - 'Optimistic UI with rollback on error for status changes'
  - 'Sonner toast for user notifications'
  - 'SECURITY DEFINER + SET search_path = public for PostgreSQL functions'
  - 'Categories → divisions → contests FK chain (categories.division_id → divisions.contest_id)'
test_patterns:
  - 'Vitest + React Testing Library'
  - 'vi.useFakeTimers() for time-dependent tests'
  - 'renderWithProviders wrapper with QueryClientProvider'
  - 'Mock API modules with vi.mock()'
  - 'Mock toast with vi.fn()'
  - 'Test urgency level styling via className assertions'
  - 'Scoped test runs only: npx vitest run --changed'
---

# Tech-Spec: Deadline Countdown & Auto-Close Automation

**Created:** 2026-02-07

## Overview

### Problem Statement

Categories and contests don't automatically close when deadlines pass — they only close when an admin happens to view the page (client-side `useEffect` in `CategoryCard.tsx:175-182`). That same `useEffect` causes a spurious "Status updated" toast notification every time an admin views a category whose deadline has passed. The participant-facing countdown uses vague relative text from `formatDistanceToNow` ("in about 4 minutes" / "due 4 minutes ago") instead of a precise live countdown. The admin view doesn't show a countdown at all — just a formatted date with "(Passed)" text.

### Solution

1. Replace the vague countdown with a precise seconds-level live timer that adapts its display format based on time remaining and shows "Submission closed" at 00:00
2. Move category auto-close from client-side to server-side via `pg_cron` (every minute) + `pg_net` for judge invitation emails
3. Add a database trigger to auto-close contests when all their categories reach `closed` status
4. Unify the countdown component across admin and participant views
5. Remove the client-side auto-close `useEffect` from `CategoryCard` (eliminating the spurious toast bug)

### Scope

**In Scope:**
- Precise live countdown (updates every second) for the last 24 hours
- Adaptive display format: `23h 4m 32s` (>1h) → `4m 32s` (≤1h) → `32s` (≤1min) → "Submission closed" (at 00:00)
- Same countdown component on both admin `CategoryCard` and participant `ParticipantCategoryCard`
- `pg_cron` job (every minute) to close expired published categories + send judge invitations via `pg_net`
- Database trigger: when a category status changes to `closed`, check if all categories in the contest are closed → auto-close the contest to `closed`
- Remove client-side auto-close `useEffect` from `CategoryCard` (fixes spurious toast notification bug)

**Out of Scope:**
- 5-minute deadline rounding (deferred to separate story)
- Server-side submission blocking at deadline boundary
- Changes to the manual contest cascade dialog flow (admin can still manually cascade)

## Context for Development

### Codebase Patterns

- **pg_cron + pg_net pattern:** Established in `20260205020000_add_purge_cron_job.sql`. Uses `cron.schedule()` to call `net.http_post()` to an Edge Function with `service_role_key` from `vault.decrypted_secrets`.
- **Edge Function auth:** Current `send-judge-invitation` requires admin auth. New `close-expired-categories` function will use `service_role_key` directly (server-to-server, no user context).
- **Feature architecture:** All exports via feature `index.ts`. Import from `@/features/featureName`. Named exports only.
- **State management:** TanStack Query for server state. `staleTime: 30_000`, `refetchOnWindowFocus: false`, `refetchOnMount: false`.
- **Component patterns:** Named exports, explicit React imports, hooks first → handlers → render.
- **DB conventions:** `snake_case` tables/columns, `camelCase` in TypeScript. Transform in API layer.
- **DB relationships:** `categories.division_id` → `divisions.id`, `divisions.contest_id` → `contests.id`. Categories do NOT have a direct `contest_id` column (dropped in migration `20260121202526_add_divisions.sql`).
- **Trigger patterns:** `SECURITY DEFINER`, `SET search_path = public`, protect sensitive columns.
- **Testing:** Vitest + RTL, co-located `*.test.tsx`, `vi.useFakeTimers()` for time tests.
- **Migrations:** Online Supabase only. `npx supabase db push` to apply. Never local Docker.

### Files to Reference

| File | Purpose | Action |
| ---- | ------- | ------ |
| `src/features/participants/components/DeadlineCountdown.tsx` | Countdown component — currently uses `formatDistanceToNow`, updates every 60s | **Rewrite** |
| `src/features/participants/components/DeadlineCountdown.test.tsx` | Tests for countdown urgency levels and display | **Rewrite** |
| `src/features/categories/components/CategoryCard.tsx` | Admin category card — lines 175-182 auto-close, lines 232-235 date display | **Modify** |
| `src/features/categories/components/CategoryCard.test.tsx` | Tests for admin category card | **Modify** |
| `src/features/participants/components/ParticipantCategoryCard.tsx` | Participant card — uses DeadlineCountdown | **No change** (API compatible) |
| `supabase/functions/send-judge-invitation/index.ts` | Existing Edge Function — email template, Brevo, magic link, notification_logs | **Reference** (template for new EF) |
| `supabase/migrations/20260205020000_add_purge_cron_job.sql` | Existing cron job pattern | **Reference** (template for new migration) |
| `supabase/migrations/20260121202526_add_divisions.sql` | Categories → divisions FK relationship | **Reference** (join paths for trigger) |
| `src/features/categories/api/categoriesApi.ts` | `_invokeJudgeInvitation()` at line 510 | **Reference** (invitation payload structure) |
| `src/lib/dateUtils.ts` | `formatDateTimeInTimezone()` utility | **Reference** |

### Technical Decisions

1. **Hybrid auto-close (Option C):** `pg_cron` (every minute) for deadline enforcement + DB trigger for contest cascade
2. **New Edge Function `close-expired-categories`:** Self-contained function that closes categories AND sends judge invitations. Does NOT modify existing `send-judge-invitation` auth — keeps admin auth intact for manual flows. Inlines invitation logic (Brevo email, magic link, `invited_at` update, `notification_logs`).
3. **1-minute cron interval:** Deadlines are at minute granularity, so cron catches them within the same minute. No perceptible delay.
4. **Client-side countdown at 00:00:** Shows "Submission closed" immediately via client time math, before server cron runs. Frontend is presentation-only — doesn't change any status.
5. **Unified `DeadlineCountdown` component:** Same component for admin `CategoryCard` and participant `ParticipantCategoryCard`. Admin imports from `@/features/participants` (cross-feature import via index).
6. **Remove client-side auto-close entirely:** Delete the `useEffect` in `CategoryCard.tsx:175-182`. The `handleStatusChange()` function and its `toast.success('Status updated')` remain intact for manual admin status changes via the Select dropdown.
7. **DB trigger for contest cascade:** `AFTER UPDATE` trigger on `categories` — when `NEW.status = 'closed' AND OLD.status IS DISTINCT FROM 'closed'`, get `contest_id` via `divisions.contest_id` where `divisions.id = NEW.division_id`, count non-closed categories in that contest, if 0 → update `contests.status` to `'closed'` (only if currently `'published'`).

## Implementation Plan

### Tasks

- [x] **Task 1: Rewrite `DeadlineCountdown` component**
  - File: `src/features/participants/components/DeadlineCountdown.tsx`
  - Action: Full rewrite of the countdown display logic
  - Details:
    - Replace `formatDistanceToNow` (date-fns) with manual time calculation: `Math.floor((deadlineDate.getTime() - now) / 1000)` for total seconds remaining
    - Change `setInterval` from `60_000` (60s) to `1_000` (1s)
    - Add adaptive format function (boundaries use seconds for precision):
      - `> 86400s` (more than 24h): Show only the formatted deadline date/time (no countdown). Use existing `formatDateTimeInTimezone()`.
      - `>= 3600s` and `<= 86400s` (1h to 24h): Show `Xh Ym Zs` (e.g., "23h 4m 32s"). Exactly 1h = "1h 0m 0s".
      - `>= 60s` and `< 3600s` (1min to 1h): Show `Ym Zs` (e.g., "4m 32s"). Exactly 1min = "1m 0s".
      - `>= 1s` and `< 60s`: Show `Zs` (e.g., "32s")
      - `<= 0s`: Show "Submission closed"
    - Keep urgency levels with same thresholds: normal (>2h), warning (≤2h amber), urgent (≤10min red pulse)
    - Keep `aria-live="polite"` and `aria-atomic="true"` for accessibility
    - Keep `timezone` prop and formatted deadline display below the countdown (for ≤24h range)
    - Keep `className` prop passthrough
    - Remove `date-fns` imports (`formatDistanceToNow`, `differenceInMinutes`) — use raw math instead

- [x] **Task 2: Rewrite `DeadlineCountdown` tests**
  - File: `src/features/participants/components/DeadlineCountdown.test.tsx`
  - Action: Rewrite tests for new format and behavior
  - Details:
    - Test adaptive format at each range boundary:
      - `> 24h`: renders formatted date only, no countdown text
      - `3h remaining`: renders "3h 0m 0s" format with normal styling
      - `1h 30m remaining`: renders "1h 30m 0s" format with warning styling (≤2h)
      - `45m 20s remaining`: renders "45m 20s" format (no hours)
      - `5m remaining`: renders "5m 0s" with urgent red styling + pulse
      - `30s remaining`: renders "30s" format (no hours/minutes)
      - `0s or past`: renders "Submission closed"
    - Test urgency styling thresholds (keep existing boundary tests, adapt assertions to new format strings)
    - Test exact boundary cases: exactly 1h → "1h 0m 0s", exactly 1min → "1m 0s", exactly 24h → shows countdown (not date-only)
    - Test timer interval: advance fake timers by 1000ms, verify re-render
    - Test interval cleanup on unmount: render, unmount, advance timers by 5000ms, verify no errors (no memory leak from 1s interval)
    - Test invalid date: still shows "Invalid deadline"
    - Test aria-live attribute present
    - Test className passthrough

- [x] **Task 3: Modify `CategoryCard` — remove auto-close, add countdown**
  - File: `src/features/categories/components/CategoryCard.tsx`
  - Action: Remove client-side auto-close, replace date display with countdown
  - Details:
    - **Remove** the auto-close `useEffect` (lines 175-182):
      ```tsx
      // DELETE THIS ENTIRE BLOCK:
      useEffect(() => {
        if (deadlinePassed && optimisticStatus !== 'closed') {
          handleStatusChange('closed');
        }
      }, [deadlinePassed]);
      ```
    - **Remove** the `deadlinePassed` variable (line 149):
      ```tsx
      // DELETE: const deadlinePassed = new Date(category.deadline) < new Date();
      ```
    - **Add import** for DeadlineCountdown:
      ```tsx
      import { DeadlineCountdown } from '@/features/participants';
      ```
    - **Replace** the deadline date display (lines 232-235):
      ```tsx
      // REPLACE THIS:
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDateTimeInTimezone(category.deadline, contestTimezone)}
        {deadlinePassed && <span className="text-red-500 ml-1">(Passed)</span>}
      </span>

      // WITH THIS:
      <DeadlineCountdown
        deadline={category.deadline}
        timezone={contestTimezone}
        className="text-xs"
      />
      ```
    - **Remove** the `formatDateTimeInTimezone` import if no longer used elsewhere in the file. Check: it's NOT used elsewhere (the edit sheet uses `EditCategoryForm` which has its own imports). So remove it.
    - **Verify** the `handleStatusChange` function and its `toast.success('Status updated')` on line 208 remain intact — they're still needed for manual status changes via the Select dropdown.

- [x] **Task 4: Update `CategoryCard` tests**
  - File: `src/features/categories/components/CategoryCard.test.tsx`
  - Action: Remove obsolete tests, add countdown test
  - Details:
    - **Remove** test "displays passed indicator when deadline has passed" (lines 173-185) — the "(Passed)" span no longer exists
    - **Remove** test "displays deadline formatted date" (lines 164-171) — replaced by DeadlineCountdown component
    - **Add** test: "renders DeadlineCountdown component for category with future deadline" — verify the countdown component renders (check for Clock icon or countdown text pattern)
    - **Add** mock for DeadlineCountdown module (pass through all props for verification):
      ```tsx
      vi.mock('@/features/participants', () => ({
        DeadlineCountdown: (props: { deadline: string; timezone: string; className?: string }) => (
          <span
            data-testid="deadline-countdown"
            data-timezone={props.timezone}
            data-classname={props.className}
          >
            {props.deadline}
          </span>
        ),
      }));
      ```
    - **Add** assertion to verify timezone and className are passed correctly:
      ```tsx
      const countdown = screen.getByTestId('deadline-countdown');
      expect(countdown).toHaveAttribute('data-timezone', 'America/New_York');
      expect(countdown).toHaveAttribute('data-classname', 'text-xs');
      ```
    - **Verify** existing tests still pass (status dropdown, judge assignment, edit sheet tests are unaffected)

- [x] **Task 5: Create Edge Function `close-expired-categories`**
  - File: `supabase/functions/close-expired-categories/index.ts` (NEW)
  - Action: Create self-contained Edge Function for cron-triggered auto-close
  - Details:
    - **Auth:** Verify `Authorization` header contains the `SUPABASE_SERVICE_ROLE_KEY`. No admin user check.
    - **Query expired categories:**
      ```sql
      SELECT c.id, c.name, c.deadline, c.assigned_judge_id, c.invited_at,
             p.id as judge_profile_id, p.email as judge_email,
             p.first_name as judge_first_name, p.last_name as judge_last_name,
             d.contest_id,
             con.name as contest_name, con.timezone as contest_timezone
      FROM categories c
      JOIN divisions d ON c.division_id = d.id
      JOIN contests con ON d.contest_id = con.id
      LEFT JOIN profiles p ON c.assigned_judge_id = p.id
      WHERE c.status = 'published'
        AND c.deadline <= now()
      ```
      In Supabase JS:
      ```typescript
      const { data: expired } = await supabase
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
        .limit(50);  // Batch cap — oldest deadlines first, remaining picked up on next cron run
      ```
    - **Batch limit:** Add `.limit(50)` to the query to cap each cron execution. If more than 50 expired categories exist (e.g., at initial deploy), they'll be picked up by subsequent cron runs within minutes.
    - **For each expired category:**
      1. **Atomically close** the category with idempotency guard:
         ```typescript
         const { data: closed, error } = await supabase
           .from('categories')
           .update({ status: 'closed' })
           .eq('id', categoryId)
           .eq('status', 'published')  // Only close if still published (prevents race)
           .select('id')
           .single();
         if (!closed) continue; // Another cron execution already closed it
         ```
      2. If `assigned_judge_id` exists AND `invited_at` is null, **atomically claim** the invitation:
         ```typescript
         const { data: claimed } = await supabase
           .from('categories')
           .update({ invited_at: new Date().toISOString() })
           .eq('id', categoryId)
           .is('invited_at', null)  // Only claim if not yet invited (prevents duplicate emails)
           .select('id')
           .single();
         if (!claimed) continue; // Another process already claimed it
         ```
         Then:
         a. Generate magic link via `supabase.auth.admin.generateLink({ type: 'magiclink', email: judgeEmail, options: { redirectTo: APP_URL + '/set-password' } })`
         b. Get submission count: `supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('category_id', categoryId)`
         c. Send Brevo email (copy template from `send-judge-invitation/index.ts` lines 183-241)
         d. Log to `notification_logs`: `{ type: 'judge_invitation', recipient_email, recipient_id, related_contest_id, related_category_id, brevo_message_id, status: 'sent'|'failed' }`
         e. If Brevo send fails, set `invited_at` back to null so it retries on next cron run:
            ```typescript
            await supabase.from('categories').update({ invited_at: null }).eq('id', categoryId);
            ```
      3. If no judge assigned: log `console.warn('Category ${id} closed without assigned judge — skipping invitation')` and continue (expected behavior, not an error)
    - **Return summary:** `{ closedCount, invitationsSent, invitationsSkipped, invitationErrors, errors: [{categoryId, error}] }`
    - **Error handling:** Individual category failures should not abort the batch. Log each failure, continue processing remaining categories, report all failures in the response.
    - **CORS headers:** Same pattern as existing Edge Functions (`Access-Control-Allow-Origin: *`, etc.)

- [x] **Task 6: Create database migration — trigger + cron job**
  - File: `supabase/migrations/<timestamp>_add_auto_close_cron_and_trigger.sql` (NEW — generate via `npx supabase migration new add_auto_close_cron_and_trigger`)
  - Action: Add contest auto-close trigger and cron job scheduling
  - Details:
    - **Part A — Contest auto-close trigger function:**
      ```sql
      CREATE OR REPLACE FUNCTION public.auto_close_contest_when_all_categories_closed()
      RETURNS TRIGGER
      SET search_path = public
      AS $$
      DECLARE
        v_contest_id UUID;
        v_open_count INTEGER;
      BEGIN
        -- Only fire when category status changes TO 'closed'
        IF NEW.status = 'closed' AND (OLD.status IS DISTINCT FROM 'closed') THEN
          -- Get contest_id via division
          SELECT d.contest_id INTO v_contest_id
          FROM public.divisions d
          WHERE d.id = NEW.division_id;

          -- Count non-closed categories in this contest
          SELECT COUNT(*) INTO v_open_count
          FROM public.categories cat
          JOIN public.divisions div ON cat.division_id = div.id
          WHERE div.contest_id = v_contest_id
            AND cat.status != 'closed';

          -- If ALL categories are closed and contest is published, close the contest
          IF v_open_count = 0 THEN
            UPDATE public.contests
            SET status = 'closed'
            WHERE id = v_contest_id
              AND status = 'published';
          END IF;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      ```
    - **Part B — Trigger on categories table:**
      ```sql
      CREATE TRIGGER trg_auto_close_contest_on_category_close
        AFTER UPDATE OF status ON public.categories
        FOR EACH ROW
        WHEN (NEW.status = 'closed' AND OLD.status IS DISTINCT FROM 'closed')
        EXECUTE FUNCTION public.auto_close_contest_when_all_categories_closed();
      ```
    - **Part C — Cron job for closing expired categories:**
      ```sql
      SELECT cron.schedule(
        'close-expired-categories-every-minute',
        '* * * * *',
        $$
        SELECT net.http_post(
          url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url')
                 || '/functions/v1/close-expired-categories',
          headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key'),
            'Content-Type', 'application/json'
          ),
          body := '{}'::jsonb
        );
        $$
      );
      ```
    - **Note:** `pg_cron` and `pg_net` extensions are already enabled. `GRANT USAGE ON SCHEMA cron TO postgres` already done. No need to repeat.

### Acceptance Criteria

- [ ] **AC1:** Given a published category with deadline ≤24h away, when a participant or admin views the category, then a live countdown displays in `Xh Ym Zs` format updating every second.

- [ ] **AC2:** Given a published category with deadline ≤1h away, when viewed, then the countdown displays in `Ym Zs` format (no hours shown).

- [ ] **AC3:** Given a published category with deadline ≤1m away, when viewed, then the countdown displays in `Zs` format (only seconds shown).

- [ ] **AC4:** Given a published category whose deadline has passed (≤0s remaining), when viewed by participant or admin, then "Submission closed" is displayed instead of a countdown. Note: This is a client-side visual indicator only — the server-side status change occurs within ~1 minute via cron. Submissions may still be accepted during this brief window (accepted behavior).

- [ ] **AC5:** Given a published category with deadline >24h away, when viewed, then only the formatted deadline date/time is displayed (no live countdown).

- [ ] **AC6:** Given a published category with deadline ≤2h away, when viewed, then the countdown displays in amber/warning styling (`text-amber-600 font-medium`).

- [ ] **AC7:** Given a published category with deadline ≤10min away, when viewed, then the countdown displays in red/urgent styling with pulse animation (`text-red-600 font-bold motion-safe:animate-pulse`).

- [ ] **AC8:** Given an admin viewing the contest management page, when a category has any deadline state (future, ≤24h, past), then the same `DeadlineCountdown` component is displayed as participants see (replaces the old date + "(Passed)" display).

- [ ] **AC9:** Given an admin opening a category's details (accordion/sheet/dropdown), when the category deadline has passed, then NO "Status updated" toast notification appears and NO automatic status change is triggered by the act of viewing.

- [ ] **AC10:** Given a published category whose deadline has passed, when the `pg_cron` job runs (within ~1 minute of deadline), then the category status is automatically set to `'closed'` in the database.

- [ ] **AC11:** Given a published category with an assigned judge and no prior invitation (`invited_at` is null), when the category is auto-closed by the cron job, then a judge invitation email is sent via Brevo, `invited_at` is updated, and the send is logged to `notification_logs`.

- [ ] **AC12:** Given a published category with an assigned judge who was already invited (`invited_at` is not null), when the category is auto-closed by the cron job, then no duplicate invitation email is sent.

- [ ] **AC13:** Given a published category with no assigned judge, when the category is auto-closed by the cron job, then the category closes without error and no invitation is attempted.

- [ ] **AC14:** Given a contest where ALL categories have reached `'closed'` status (via auto-close or manual), when the last category's status changes to `'closed'`, then the contest status is automatically set to `'closed'` via database trigger (only if contest is currently `'published'`).

- [ ] **AC15:** Given a contest with some categories still in `'published'` or `'draft'` status, when one category closes, then the contest status remains unchanged.

- [ ] **AC16:** Given two cron executions overlapping (Edge Function takes >60s), when both attempt to process the same expired category, then only one closes it and only one invitation email is sent (idempotency via atomic `WHERE status = 'published'` and `WHERE invited_at IS NULL` guards).

- [ ] **AC17:** Given 100+ expired categories at initial deployment, when the cron runs, then categories are processed in batches of 50, with remaining categories picked up on subsequent cron runs.

## Additional Context

### Dependencies

- `pg_cron` extension — already enabled (migration `20260205020000`)
- `pg_net` extension — already enabled (migration `20260205020000`)
- Supabase vault secrets: `supabase_url`, `service_role_key` — already configured
- Brevo API: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` env vars — already configured in Edge Function environment
- `APP_URL` env var — already configured
- `date-fns` — already installed (used by current DeadlineCountdown, but will be removed from this component after rewrite; still used elsewhere in the project)

### Testing Strategy

**Unit Tests (Vitest + RTL):**
- `DeadlineCountdown.test.tsx` — Rewrite: test all format ranges, urgency styles, timer interval, edge cases (invalid date, exactly-on-boundary times), "Submission closed" state, aria attributes
- `CategoryCard.test.tsx` — Modify: remove auto-close and "(Passed)" tests, add DeadlineCountdown render test with mocked component

**Manual Testing:**
- Create a contest with 2 categories, set deadlines 2-3 minutes in the future
- Verify countdown displays correctly on both admin and participant views
- Verify countdown transitions through format ranges (h/m/s → m/s → s → "Submission closed")
- Verify no toast appears when admin views a category with passed deadline
- Wait for cron to close the categories (~1 min after deadline)
- Verify judge invitation email sent (check notification_logs and Brevo dashboard)
- Verify contest auto-closes when last category closes
- Verify Supabase cron job is visible in dashboard under Database → Extensions → pg_cron

**Edge Function Testing:**
- Deploy with `npx supabase functions deploy close-expired-categories`
- Test manually via curl with service_role_key auth
- Verify batch processing handles partial failures (one category fails, others still close)

### Notes

- The existing `purge-deleted-contests-daily` cron job proves the pg_cron + pg_net pattern works in this project
- The `idx_categories_deadline` index already exists — cron query will be fast
- The `send-judge-invitation` Edge Function is NOT modified — the new function handles invitations independently using `service_role_key`
- The contest auto-close trigger only fires when contest is `'published'`. Contests in `'draft'`, `'closed'`, `'reviewed'`, `'finished'`, or `'deleted'` status are not affected.
- `ParticipantCategoryCard` already shows "Submissions closed" when `category.status === 'closed'`. The `DeadlineCountdown` is only rendered when the category is NOT closed. With server-side auto-close, the status updates via React Query invalidation within the 30s `staleTime` window. The client-side countdown hitting 00:00 covers the visual gap seamlessly.
- After the cron closes a category, admin clients will pick up the new status on their next React Query refetch. No real-time push needed — the countdown already shows "Submission closed" client-side.
- The trigger uses `AFTER UPDATE OF status` with a `WHEN` clause for efficiency — it only fires on status column changes to `'closed'`, not on every category update.
- **Rollback:** To disable the cron job in an emergency, run via Supabase SQL Editor:
  ```sql
  SELECT cron.unschedule('close-expired-categories-every-minute');
  -- To also remove the trigger:
  DROP TRIGGER IF EXISTS trg_auto_close_contest_on_category_close ON public.categories;
  DROP FUNCTION IF EXISTS public.auto_close_contest_when_all_categories_closed();
  ```
- **Known limitation — submission window:** There is a ~1-minute window between the client-side countdown hitting 00:00 and the server closing the category. During this window, submissions may still be accepted. This is accepted behavior per project requirements. Server-side deadline enforcement on the submission API is deferred to a future story.
- **Known limitation — brief visual lag:** When the countdown hits 00:00, it shows "Submission closed" but the status badge may still show "published" for up to 30-90 seconds until React Query refetches and picks up the server-side status change. This is cosmetic and self-resolving.
- **Known limitation — category re-open after auto-close:** If all categories auto-close and the contest auto-closes, then an admin manually re-opens a category (closed → published), the contest remains closed. The admin must manually re-open the contest via the contest status dropdown. Adding reverse automation is deferred.
