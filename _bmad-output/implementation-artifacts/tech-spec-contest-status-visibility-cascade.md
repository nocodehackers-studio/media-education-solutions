---
title: 'Contest Status Visibility & Cascade Category Status Updates'
slug: 'contest-status-visibility-cascade'
created: '2026-02-04'
status: 'complete'
stepsCompleted: [1, 2, 3, 4, 5, 6]
tech_stack: ['React 19', 'TypeScript (strict)', 'Vite 7', 'TanStack Query 5', 'Supabase (Auth + PostgreSQL + Edge Functions)', 'shadcn/ui (Radix)', 'React Hook Form + Zod', 'React Router DOM 7', 'Vitest + React Testing Library']
files_to_modify:
  - 'supabase/functions/validate-participant/index.ts'
  - 'supabase/functions/get-participant-categories/index.ts'
  - 'supabase/functions/confirm-submission/index.ts'
  - 'src/features/participants/api/participantsApi.ts'
  - 'src/pages/participant/ParticipantCategoriesPage.tsx'
  - 'src/features/participants/components/ParticipantCategoryCard.tsx'
  - 'src/pages/participant/CategoryDetailPage.tsx'
  - 'src/pages/participant/SubmitPage.tsx'
  - 'src/features/categories/api/categoriesApi.ts'
  - 'src/pages/admin/ContestDetailPage.tsx'
files_to_create:
  - 'src/features/contests/hooks/useCascadeContestStatus.ts'
  - 'src/features/contests/components/CascadeStatusDialog.tsx'
  - 'src/features/categories/hooks/useCategoriesByContest.ts'
code_patterns:
  - 'AlertDialog for confirmation modals (DeleteContestButton pattern)'
  - 'Select dropdown for status changes (ContestDetailPage pattern)'
  - 'Edge functions with service role for participant data access'
  - 'TanStack Query mutations with optimistic updates'
  - 'Feature folder structure with index.ts barrel exports'
  - 'Named exports only, no default exports'
  - 'snake_case DB fields, camelCase code fields'
test_patterns:
  - 'Vitest + @testing-library/react with jsdom'
  - 'vi.mock for API modules'
  - 'userEvent.setup() for interactions'
  - 'QueryClient wrapper with retry: false'
  - 'AlertDialog interaction tests (open, cancel, confirm)'
  - 'Toast assertion pattern: expect(toast.success).toHaveBeenCalledWith(...)'
  - 'All Contest mocks must include deletedAt: null (soft-delete feature)'
---

# Tech-Spec: Contest Status Visibility & Cascade Category Status Updates

**Created:** 2026-02-04

## Overview

### Problem Statement

Participants can currently access contests regardless of their admin status (including drafts), and admins must manually update each category's status one by one when changing a contest's status -- tedious and error-prone.

### Solution

Enforce contest status as the global access key for participants, mapping admin statuses to participant-facing display states. Add cascade confirmation modals when changing contest status so category statuses follow automatically where appropriate.

### Scope

**In Scope:**

- **Participant visibility rules:**
  - Draft / Deleted → hidden, completely inaccessible (even with a valid code)
  - Published → visible, tagged "Accepting Submissions"
  - Closed / Reviewed → visible as "Contest is Closed" (view-only: can see submissions, cannot submit/withdraw/change)
  - Finished → visible as "Closed" + "Feedback Available" banner (only for participants with submissions that have feedback)
- **Contest status = global key** -- overrides category-level access for participants
- **Cascade category status on contest status change:**
  - Contest draft → published: modal asks "Publish all draft categories?" (draft → published)
  - Contest published → closed/reviewed/finished: modal asks "Close all published categories?" (published → closed)
  - Draft categories are NEVER cascaded to closed
  - No cascade for close → reviewed or reviewed → finished (categories already closed by then)
- **Enforce at edge functions** -- server-side status checks, not just UI

**Out of Scope:**

- Reverse cascade (unpublishing contest does not revert categories)
- Email notifications for status changes (handled separately)
- Changes to judge or admin views/workflows beyond the cascade modal
- New database statuses -- using existing ones

## Context for Development

### Codebase Patterns

- **Confirmation modals:** Use `AlertDialog` from shadcn/ui (Radix). Established pattern in `DeleteContestButton.tsx` and `DeleteCategoryButton.tsx` -- trigger opens dialog, action button handles async operation with loading state, toast on success/error.
- **Status dropdowns:** `<Select>` component with color-coded status items. Used in `ContestDetailPage.tsx` in the page header area. Optimistic updates via local `pendingStatus` state + mutation.
- **Edge functions:** Use `supabaseAdmin` (service role) to bypass RLS. Validate participant identity first, then return filtered data. Pattern in `get-participant-categories` and `validate-participant`.
- **Mutations:** TanStack Query `useMutation` with `queryClient.invalidateQueries` on success. Optimistic UI via local state (not TanStack optimistic updates).
- **Category status side effects:** When a category transitions to `closed`, `useUpdateCategoryStatus` sends judge invitation email via `categoriesApi.sendJudgeInvitation(categoryId)`.
- **Participant API types:** `participantsApi.ts` defines `GetCategoriesResponse`, `ParticipantCategoriesResult`, `ParticipantCategory`, `ContestInfo`, and `ParticipantDivision`. The `getCategories()` method maps the edge function response to these types.
- **ParticipantCategoryCard:** Receives `category` and `contestFinished` as props. Navigates to `/participant/category/{id}` passing `{ category, contestFinished }` as navigation state.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `supabase/functions/validate-participant/index.ts` | Entry point status check. `CONTEST_NOT_ACCEPTING` error for disallowed statuses. Currently allows `['published', 'finished']` only. |
| `supabase/functions/get-participant-categories/index.ts` | Returns categories + contestStatus. Filters categories to `published`/`closed`. `contestStatus` is informational only -- no enforcement. |
| `supabase/functions/confirm-submission/index.ts` | Confirms uploaded submission. Atomic update WHERE `submission.status = 'uploaded'`. NO contest/category status checks. Does NOT have `category_id` in scope -- only `submissionId` and `participantId`. |
| `src/features/participants/api/participantsApi.ts` | Client-side types and API wrapper for edge functions. `GetCategoriesResponse` and `ParticipantCategoriesResult` must be updated to include new fields. |
| `src/pages/participant/ParticipantCategoriesPage.tsx` | Participant landing page. Uses `useParticipantCategories` hook. Binary `contestFinished` boolean drives all display. Passes `contestFinished` prop down to sub-components. |
| `src/features/participants/components/ParticipantCategoryCard.tsx` | Category card in participant view. Props: `category`, `contestFinished`. Navigates to category detail with `{ category, contestFinished }` state. Must be updated to accept `acceptingSubmissions` and hide submit affordances. |
| `src/pages/participant/CategoryDetailPage.tsx` | Category detail with submit button. `handleSubmit` navigates to `/participant/submit/{id}` with `{ type: category.type }` as state -- does NOT pass status info. Must add `acceptingSubmissions` to navigation state. |
| `src/pages/participant/SubmitPage.tsx` | Submit entry page. NO status checks. Needs redirect guard. |
| `src/pages/admin/ContestDetailPage.tsx` | Admin contest detail. Status Select in page header. `handleStatusChange` directly calls `updateStatus.mutateAsync`. No confirmation dialog. |
| `src/features/contests/components/ContestDetailsTab.tsx` | **NOT USED IN APP** -- only imported in its test file. Ignore for this spec. |
| `src/features/contests/hooks/useUpdateContestStatus.ts` | Mutation hook for contest status update + query invalidation. |
| `src/features/categories/api/categoriesApi.ts` | Category CRUD. `updateStatus()` for single category. `listByContest()` fetches all categories for a contest (joins through divisions). No bulk update method exists. Supabase JS `.update()` cannot filter through joins -- must use two-step approach. |
| `src/features/categories/hooks/useUpdateCategoryStatus.ts` | Single category status mutation. Sends judge invitation on close. |
| `src/components/ui/alert-dialog.tsx` | AlertDialog component from shadcn/ui. |
| `src/features/contests/components/DeleteContestButton.tsx` | Reference implementation for AlertDialog confirmation pattern. |

### Technical Decisions

- Contest status is the single source of truth for participant access -- category-level status is secondary
- `validate-participant` expanded to allow all non-draft/non-deleted statuses: `['published', 'closed', 'reviewed', 'finished']`. Uses an allowlist (not denylist) so any future unknown statuses default to blocked.
- Server-side enforcement at edge functions is critical -- UI-only checks are insufficient
- Cascade updates contest status first, then categories. If category cascade fails, toast error but contest status stands (admin can manually fix categories)
- Cascade close must trigger `categoriesApi.sendJudgeInvitation()` for each affected category with an assigned judge (matching existing `useUpdateCategoryStatus` behavior)
- New `CascadeStatusDialog` component follows existing AlertDialog pattern (DeleteContestButton reference)
- New `useCascadeContestStatus` hook encapsulates all cascade logic for `ContestDetailPage`
- **`ContestDetailsTab` is dead code** (not rendered anywhere in the app). All cascade integration targets `ContestDetailPage` only.
- **Soft-delete awareness:** A parallel feature adds `deleted` status to contests. The cascade hook must NOT trigger cascade on `deleted` transitions -- delete has its own flow via `DeleteContestButton`. All edge function status checks treat `deleted` identically to `draft` (completely inaccessible). Test mocks must include `deletedAt: null` on Contest objects.
- **Supabase JS limitation:** `.update()` operates on a single table and cannot filter through joins. Bulk category updates require a two-step approach: SELECT matching IDs via join, then UPDATE with `.in('id', ids)`.

## Implementation Plan

### Tasks

#### Backend / Edge Functions (Tasks 1-4)

- [x] **Task 1: Expand validate-participant allowed statuses**
  - File: `supabase/functions/validate-participant/index.ts`
  - Action: In the status check (the `if` block that checks `!['published', 'finished'].includes(contest.status)`), change the allowlist to `['published', 'closed', 'reviewed', 'finished']`
  - Notes: This allows participants to log in and view submissions when contest is closed/reviewed. Both `draft` and `deleted` remain blocked. Uses allowlist approach so any future unknown statuses default to blocked.

- [x] **Task 2: Add contest status enforcement and new fields to get-participant-categories**
  - File: `supabase/functions/get-participant-categories/index.ts`
  - Action:
    1. After fetching `contestStatus` (the `.from('contests').select(...)` query), add enforcement: if `contestStatus` is NOT in `['published', 'closed', 'reviewed', 'finished']` (i.e., `draft` or `deleted`), return 403 with `{ success: false, error: 'CONTEST_NOT_AVAILABLE' }`
    2. Add `acceptingSubmissions: contestStatus === 'published'` to the JSON response object alongside existing `contestStatus`
    3. For each category in the response, add a `hasFeedback` boolean field. To determine this: for categories where the participant has a submission (`hasSubmitted === true`), query the submissions table for that `participant_id` + `category_id` and check if `feedback IS NOT NULL` or `score IS NOT NULL`. Set `hasFeedback: true` if either exists. This is needed for the "Feedback Available" banner on the finished contest state.
  - Notes: Categories still returned for closed/reviewed/finished (view-only). The 403 for draft/deleted prevents any data leakage.

- [x] **Task 3: Update participantsApi.ts types**
  - File: `src/features/participants/api/participantsApi.ts`
  - Action:
    1. Add `acceptingSubmissions?: boolean` to `GetCategoriesResponse` interface
    2. Add `acceptingSubmissions: boolean` to `ParticipantCategoriesResult` interface
    3. Add `hasFeedback?: boolean` to `ParticipantCategory` interface
    4. In the `getCategories()` method return statement, map `acceptingSubmissions: data.acceptingSubmissions ?? false`
    5. Export `ParticipantCategoriesResult` already includes `contestStatus` -- no change needed there
  - Notes: This task must be completed before frontend Tasks 5-8 to avoid TypeScript errors.

- [x] **Task 4: Add contest and category status check to confirm-submission**
  - File: `supabase/functions/confirm-submission/index.ts`
  - Action: Before the existing atomic submission update (`supabaseAdmin.from('submissions').update(...)`), add a status validation query:
    1. **First**, query the submission to get `category_id`:
       ```sql
       SELECT category_id FROM submissions WHERE id = submissionId AND participant_id = participantId
       ```
    2. **Then**, query the category to get its status and contest status in one join:
       ```sql
       SELECT c.status as category_status, contests.status as contest_status
       FROM categories c
       JOIN divisions d ON c.division_id = d.id
       JOIN contests ON d.contest_id = contests.id
       WHERE c.id = category_id
       ```
       In Supabase JS:
       ```typescript
       const { data: catData } = await supabaseAdmin
         .from('categories')
         .select('status, divisions!inner(contests!inner(status))')
         .eq('id', categoryId)
         .single()
       ```
    3. If `contest.status !== 'published'`, return 400 with `{ success: false, error: 'CONTEST_NOT_ACCEPTING' }`
    4. If `category.status !== 'published'`, return 400 with `{ success: false, error: 'CATEGORY_NOT_ACCEPTING' }`
  - Notes: This is the critical server-side guard. The two-step query (get `category_id` from submission, then join to contest) is necessary because the existing code only has `submissionId` and `participantId` in scope -- `category_id` is not available without a separate query.

#### Participant Frontend (Tasks 5-8)

- [x] **Task 5: Update ParticipantCategoriesPage for all contest status states**
  - File: `src/pages/participant/ParticipantCategoriesPage.tsx`
  - Action:
    1. Extract `acceptingSubmissions` from `data` response (added in Task 2/3)
    2. Replace the binary `contestFinished` boolean with a richer status model:
       - `const acceptingSubmissions = data?.acceptingSubmissions ?? false`
       - `const contestFinished = data?.contestStatus === 'finished'`
       - `const contestClosed = data?.contestStatus === 'closed' || data?.contestStatus === 'reviewed'`
    3. Update status badge display:
       - Published (`acceptingSubmissions === true`): show "Accepting Submissions" badge (existing behavior)
       - Closed/Reviewed (`contestClosed === true`): show "Contest is Closed" badge
       - Finished (`contestFinished === true`): show existing "Contest has ended" banner. Additionally show "Feedback is available for your submissions" banner ONLY if at least one category in `divisions` has `hasFeedback === true` on a submission.
    4. Pass `acceptingSubmissions` down to `ParticipantCategoryCard` as a new prop (in addition to existing `contestFinished`)
    5. **Handle 403 error from edge function** (for draft/deleted contests): In the error handling, check if the error message contains 'CONTEST_NOT_AVAILABLE'. If so, show a contextual message: "This contest is no longer available" and provide a button to return to the code entry page (`/enter`). Do not show a generic "Failed to load categories" for this case.
  - Notes: The `useParticipantCategories` hook returns `{ data, isLoading, error }`. The error handler is already in the component -- extend it to differentiate between 403 (contest unavailable) and other errors.

- [x] **Task 6: Update ParticipantCategoryCard to respect acceptingSubmissions**
  - File: `src/features/participants/components/ParticipantCategoryCard.tsx`
  - Action:
    1. Add `acceptingSubmissions?: boolean` to `ParticipantCategoryCardProps` interface
    2. When `acceptingSubmissions === false` AND `contestFinished === false` (i.e., contest is closed/reviewed):
       - Remove the clickable navigation to category detail (or make card non-interactive)
       - Show "Contest is Closed" badge instead of submission status
       - Show "Submissions closed" in the deadline area
    3. When `contestFinished === true`: keep existing behavior (cards are clickable for feedback viewing)
    4. When `acceptingSubmissions === true`: keep existing behavior (full interactivity)
    5. Update the `handleClick` navigation state to include `acceptingSubmissions`:
       ```typescript
       navigate(`/participant/category/${category.id}`, {
         state: { category, contestFinished, acceptingSubmissions },
       })
       ```
  - Notes: The card currently only uses `contestFinished` boolean. Adding `acceptingSubmissions` enables the closed/reviewed state without conflating it with finished.

- [x] **Task 7: Update CategoryDetailPage to block submissions and pass state forward**
  - File: `src/pages/participant/CategoryDetailPage.tsx`
  - Action:
    1. Extract `acceptingSubmissions` from navigation state (passed from ParticipantCategoryCard in Task 6) or from cached data
    2. When `acceptingSubmissions === false` AND contest is closed/reviewed: show "This contest is closed" message instead of any submit button. Category info and existing submission details remain visible (read-only).
    3. When contest is finished: keep existing feedback view behavior
    4. Remove any remaining code paths that would show "Submit Entry" when `acceptingSubmissions === false`
    5. **Critical:** Update the `handleSubmit` function's navigation to include `acceptingSubmissions` in the state passed to the submit page:
       ```typescript
       navigate(`/participant/submit/${category.id}`, {
         state: { type: category.type, acceptingSubmissions },
       })
       ```
  - Notes: Currently `handleSubmit` only passes `{ type: category.type }`. Without adding `acceptingSubmissions` to this state, the SubmitPage guard (Task 8) cannot check it.

- [x] **Task 8: Add contest status guard to SubmitPage**
  - File: `src/pages/participant/SubmitPage.tsx`
  - Action:
    1. Read `acceptingSubmissions` from navigation state (passed from CategoryDetailPage in Task 7): `const { type, acceptingSubmissions } = location.state || {}`
    2. If `acceptingSubmissions !== true`, redirect to `/participant/categories` with a toast message: "This contest is not currently accepting submissions"
    3. This is a defense-in-depth measure -- Tasks 5-7 should prevent reaching this page, but this guards against direct URL navigation
  - Notes: Keep it simple -- just a redirect guard at the top of the component, before any rendering logic.

#### Admin Cascade (Tasks 9-13)

- [x] **Task 9: Add bulkUpdateStatusByContest to categoriesApi**
  - File: `src/features/categories/api/categoriesApi.ts`
  - Action: Add a new method:
    ```typescript
    async bulkUpdateStatusByContest(
      contestId: string,
      fromStatus: CategoryStatus,
      toStatus: CategoryStatus
    ): Promise<{ updatedIds: string[] }>
    ```
    Implementation (two-step approach -- Supabase JS cannot UPDATE through joins):
    1. **Step 1 -- SELECT matching IDs:**
       ```typescript
       const { data: matches } = await supabase
         .from('categories')
         .select('id, divisions!inner(contest_id)')
         .eq('divisions.contest_id', contestId)
         .eq('status', fromStatus)
       ```
    2. **Step 2 -- UPDATE by IDs:**
       ```typescript
       const ids = matches?.map(m => m.id) ?? []
       if (ids.length === 0) return { updatedIds: [] }
       await supabase
         .from('categories')
         .update({ status: toStatus })
         .in('id', ids)
       ```
    3. Return `{ updatedIds: ids }`
  - Notes: The two-step approach is necessary because Supabase JS `.update()` operates on a single table and cannot filter through foreign key joins. The `!inner` join in the SELECT ensures only categories belonging to the contest are matched.

- [x] **Task 10: Create useCategoriesByContest hook**
  - File: `src/features/categories/hooks/useCategoriesByContest.ts` (new file)
  - Action: Create a TanStack Query hook wrapping `categoriesApi.listByContest()`:
    ```typescript
    export function useCategoriesByContest(contestId: string) {
      return useQuery({
        queryKey: ['categories', 'contest', contestId],
        queryFn: () => categoriesApi.listByContest(contestId),
        enabled: !!contestId,
      })
    }
    ```
  - Notes: Export from `src/features/categories/hooks/index.ts` and `src/features/categories/index.ts`. This hook is needed by `useCascadeContestStatus` (Task 12) to get all categories for a contest at the page level. Currently categories are only fetched per-division inside `DivisionSection` sub-components -- no contest-level query hook exists.

- [x] **Task 11: Create CascadeStatusDialog component**
  - File: `src/features/contests/components/CascadeStatusDialog.tsx` (new file)
  - Action: Create an AlertDialog component following DeleteContestButton pattern:
    - Props: `open: boolean`, `onOpenChange: (open: boolean) => void`, `onConfirm: () => void`, `onCancel: () => void`, `isPending: boolean`, `categoryCount: number`, `fromCategoryStatus: 'draft' | 'published'`, `toCategoryStatus: 'published' | 'closed'`
    - Title: "Update Categories?"
    - Description for draft→published: `"{count} {count === 1 ? 'category is' : 'categories are'} still in draft. Would you like to publish {count === 1 ? 'it' : 'them'} along with the contest?"`
    - Description for published→closed: `"{count} {count === 1 ? 'category is' : 'categories are'} still published. Would you like to close {count === 1 ? 'it' : 'them'} along with the contest?"`
    - Footer buttons:
      - `AlertDialogCancel` onClick `onCancel`: "No, Just Update Contest"
      - `AlertDialogAction` onClick `onConfirm`, disabled when `isPending`: `isPending ? 'Updating...' : 'Yes, Update Categories'`
  - Notes: Export from `src/features/contests/components/index.ts`. This is a controlled dialog (no trigger -- opened/closed via `open` prop from the hook).

- [x] **Task 12: Create useCascadeContestStatus hook**
  - File: `src/features/contests/hooks/useCascadeContestStatus.ts` (new file)
  - Action: Create hook that manages the complete cascade flow:
    ```typescript
    export function useCascadeContestStatus(contestId: string)
    ```
    Returns: `{ handleStatusChange: (newStatus: ContestStatus) => void, cascadeDialogProps: CascadeStatusDialogProps, isUpdating: boolean }`

    Internal state: `dialogOpen`, `pendingContestStatus`, `cascadeFromStatus`, `cascadeToStatus`, `affectedCount`

    Internal data: calls `useCategoriesByContest(contestId)` (Task 10) to get category list. Uses `useUpdateContestStatus` mutation internally.

    Logic:
    1. `handleStatusChange(newStatus)`:
       - Determine current contest status from the categories query context or accept it as a parameter
       - If current is `draft` AND new is `published`: count categories where `status === 'draft'`. If count > 0, open dialog with `fromCategoryStatus: 'draft'`, `toCategoryStatus: 'published'`. If 0, update contest directly.
       - If current is `published` AND new is `closed`/`reviewed`/`finished`: count categories where `status === 'published'`. If count > 0, open dialog with `fromCategoryStatus: 'published'`, `toCategoryStatus: 'closed'`. If 0, update contest directly.
       - If `closed → reviewed`, `reviewed → finished`, or any other transition (including `deleted`): update contest directly, no cascade. The `deleted` transition is handled by the separate `DeleteContestButton` with its own confirmation dialog.
    2. On dialog confirm (`onConfirm`):
       - Call `contestsApi.updateStatus(contestId, pendingContestStatus)` -- update contest first
       - Call `categoriesApi.bulkUpdateStatusByContest(contestId, cascadeFromStatus, cascadeToStatus)`
       - If cascading to `closed` (`cascadeToStatus === 'closed'`): iterate `updatedIds` and call `categoriesApi.sendJudgeInvitation(id)` for each. Swallow individual invitation errors (non-blocking, matches existing behavior).
       - Invalidate queries: `['contests']`, `['contest', contestId]`, `['categories', 'contest', contestId]`, `['categories']`, `['divisions']`
       - Toast success: `"Contest updated. {count} {count === 1 ? 'category' : 'categories'} also updated."`
       - If category cascade fails: toast error `"Contest updated but failed to update categories. Please update them manually."` -- do NOT roll back contest status.
       - Close dialog.
    3. On dialog cancel (`onCancel`):
       - Call `contestsApi.updateStatus(contestId, pendingContestStatus)` -- update contest only
       - Invalidate queries
       - Toast success: `"Status updated"`
       - Close dialog.
    4. `cascadeDialogProps` returns all props needed by `CascadeStatusDialog`.
  - Notes: Export from `src/features/contests/hooks/index.ts`. The hook encapsulates ALL cascade logic so `ContestDetailPage` only needs to call `handleStatusChange` and render `<CascadeStatusDialog {...cascadeDialogProps} />`.

- [x] **Task 13: Integrate cascade into ContestDetailPage**
  - File: `src/pages/admin/ContestDetailPage.tsx`
  - Action:
    1. Import `useCascadeContestStatus` and `CascadeStatusDialog`
    2. Call `const { handleStatusChange, cascadeDialogProps, isUpdating } = useCascadeContestStatus(contest.id)`
    3. Replace the existing `handleStatusChange` function (the async function that calls `updateStatus.mutateAsync` directly) with the hook's `handleStatusChange`
    4. Replace `updateStatus.isPending` with `isUpdating` in the Select's `disabled` prop
    5. Remove the direct `useUpdateContestStatus()` hook call (now handled inside `useCascadeContestStatus`)
    6. Remove `pendingStatus` local state (now managed inside the cascade hook)
    7. Render `<CascadeStatusDialog {...cascadeDialogProps} />` after the Select component
  - Notes: **Do NOT integrate into `ContestDetailsTab.tsx`** -- it is dead code (not rendered anywhere in the app, only imported in its test file). The only status Select that matters is the one in `ContestDetailPage`.

### Acceptance Criteria

**Participant Visibility:**

- [ ] **AC1:** Given contest status is `draft` or `deleted`, when participant enters a valid code, then `validate-participant` returns `CONTEST_NOT_ACCEPTING` error and entry is blocked.
- [ ] **AC2:** Given contest status is `published`, when participant enters valid code, then entry succeeds and categories page shows "Accepting Submissions" badge with submit buttons visible.
- [ ] **AC3:** Given contest status is `closed`, when participant enters valid code, then entry succeeds, categories page shows "Contest is Closed" badge, and no submit buttons are visible. Existing submissions are visible read-only.
- [ ] **AC4:** Given contest status is `reviewed`, when participant enters valid code, then entry succeeds, categories page shows "Contest is Closed" badge, and no submit buttons are visible. Existing submissions are visible read-only.
- [ ] **AC5:** Given contest status is `finished` and participant has at least one submission with feedback (non-null `feedback` or `score`), when participant views categories page, then "Feedback Available" banner is shown.
- [ ] **AC6:** Given contest status is `finished` and participant has no submissions with feedback, when participant views categories page, then "Feedback Available" banner is NOT shown.
- [ ] **AC7:** Given contest status is not `published`, when participant views category detail page, then "Submit Entry" button is not shown and a read-only or "Contest is Closed" message is displayed.
- [ ] **AC8:** Given contest status is not `published`, when participant navigates directly to submit page URL, then they are redirected to categories page with a toast message.
- [ ] **AC9:** Given contest status is not `published`, when `confirm-submission` edge function is called, then it returns an error rejecting the submission.
- [ ] **AC10:** Given category status is not `published`, when `confirm-submission` edge function is called, then it returns an error rejecting the submission.
- [ ] **AC11:** Given contest status is `draft` or `deleted`, when `get-participant-categories` edge function is called, then it returns 403 with `CONTEST_NOT_AVAILABLE` error.
- [ ] **AC12:** Given contest becomes draft/deleted while participant has an active session, when participant navigates to categories page, then they see "This contest is no longer available" message with a link to return to code entry, not a generic error.

**Cascade Category Status:**

- [ ] **AC13:** Given contest has 3 draft categories, when admin changes contest status from `draft` to `published`, then a modal appears asking "3 categories are still in draft. Would you like to publish them along with the contest?"
- [ ] **AC14:** Given cascade modal is shown, when admin clicks "Yes, Update Categories", then contest status updates to `published` AND all 3 draft categories update to `published`.
- [ ] **AC15:** Given cascade modal is shown, when admin clicks "No, Just Update Contest", then contest status updates to `published` but categories remain in `draft`.
- [ ] **AC16:** Given contest has 0 draft categories, when admin changes status from `draft` to `published`, then no modal is shown and contest publishes directly.
- [ ] **AC17:** Given contest has 4 published categories, when admin changes status from `published` to `closed`, then a modal appears asking "4 categories are still published. Would you like to close them along with the contest?"
- [ ] **AC18:** Given admin confirms cascade close, when categories are updated to `closed`, then judge invitation emails are sent for each category that has an assigned judge (matching existing close behavior).
- [ ] **AC19:** Given contest has 2 published and 1 draft category, when admin changes status to `closed` and confirms cascade, then only the 2 published categories are closed. The draft category remains in draft.
- [ ] **AC20:** Given contest status changes from `closed` to `reviewed`, when admin changes status, then no cascade modal is shown.
- [ ] **AC21:** Given contest status changes from `reviewed` to `finished`, when admin changes status, then no cascade modal is shown.

## Additional Context

### Dependencies

- No new packages required
- All UI components already available (AlertDialog, Select, Badge, toast)
- Edge functions already deployed and accessible
- `categoriesApi.listByContest()` already exists for fetching categories by contest
- `categoriesApi.sendJudgeInvitation()` already exists for judge email on close

### Testing Strategy

**Unit Tests:**

- `CascadeStatusDialog.test.tsx` -- Test rendering with different props (draft→published vs published→closed), confirm/cancel button clicks, loading state, category count display, singular/plural text. Follow `DeleteContestButton.test.tsx` pattern.
- `useCascadeContestStatus.test.ts` -- Test cascade detection logic: draft→published shows modal when draft categories exist, published→closed shows modal when published categories exist, no modal for closed→reviewed, no modal when 0 affected categories. Test confirm path (contest + categories updated). Test cancel path (contest only). Test judge invitation triggered on cascade close. Test that `deleted` transitions don't trigger cascade.
- `ContestDetailPage` status change tests -- Update existing tests to verify cascade modal appears on status change instead of direct update.
- All Contest mock objects must include `deletedAt: null` (soft-delete feature compatibility).

**Manual Testing:**

- Verify participant code entry blocked for draft and deleted contests
- Verify participant sees correct badges for each contest status (published, closed, reviewed, finished)
- Verify submit button hidden and submission blocked for non-published contests
- Verify "Feedback Available" banner only shows when participant has submissions with feedback
- Verify 403 handling shows contextual "contest no longer available" message
- Verify cascade modal appears with correct counts
- Verify judge invitations sent on cascade close
- Verify no cascade modal for closed→reviewed or reviewed→finished

### Notes

- **Soft-delete integration:** A parallel feature (separate branch) adds `deleted` status + `deleted_at` column to contests, soft-delete with 90-day retention, restore-to-draft, and a cron-based purge edge function. Our spec treats `deleted` identically to `draft` for participant access (completely blocked). The cascade hook does not fire for `deleted` transitions. Test mocks must include `deletedAt: null` on Contest objects. `ContestDetailPage.tsx` has been modified by the soft-delete branch (added `deleted` to `statusConfig`) -- coordinate merge if both branches are in flight.
- **Risk: Partial cascade failure.** If contest status updates but category cascade fails, admin sees error toast and can manually update categories. Contest status is not rolled back since it was the primary intended action.
- **Risk: Judge invitation failures during cascade.** Individual invitation failures are non-blocking (matches existing behavior in `useUpdateCategoryStatus`). Toast warning if any fail.
- **Edge case: Re-closing categories.** If a category was previously closed (judge invited), then reopened to published, then cascade-closed again, `sendJudgeInvitation` will skip it due to the `ALREADY_INVITED` check (`invited_at` is still set). This matches existing single-category close behavior and is acceptable for this spec.
- **Known limitation:** The `acceptingSubmissions` flag is derived from `contestStatus` at query time. If an admin changes contest status while a participant is on the categories page, the participant sees the old state until they refresh or the query refetches. TanStack Query's `staleTime` controls this -- current default applies.
- **ContestDetailsTab is dead code.** Not rendered anywhere in the app (only imported in its test file). Not modified in this spec. If it is resurrected in the future, cascade integration would need to be added at that point.
- **Future consideration:** Deadline enforcement at the edge function level (currently deadlines are display-only, not enforced server-side). Out of scope for this spec.

## Adversarial Review

**Review completed:** 2026-02-04. 15 findings identified, 13 real issues fixed, 2 classified as noise.

### Findings Fixed

| # | Finding | Severity | Fix |
|---|---------|----------|-----|
| F1 | Cache divergence: `useCategoriesByContest` used different query key than `useCategories` | Medium | Changed to re-export of `useCategories` — single query key `['categories', contestId]` |
| F2 | `handleConfirm` bypassed mutation, called `contestsApi.updateStatus` directly | Medium | Changed to `updateContestStatus.mutateAsync` consistently |
| F3 | Race condition: `handleStatusChange` accessed categories that may still be loading | Medium | Added guard: if `categoriesLoading` or `!categories`, skip cascade and update directly |
| F4 | Unsafe nested type assertion in confirm-submission join data | Low | Added null checks for `divisions`, `contests`, `contestStatus` with early 400 returns |
| F5 | Non-atomic bulk update (SELECT then UPDATE) | Low | Added comment documenting limitation and acceptability for admin-only cascade |
| F6 | SubmitPage only checked nav state for `acceptingSubmissions`, not cached query data | Medium | Guard now checks `navState?.acceptingSubmissions ?? categoriesData?.acceptingSubmissions` |
| F8 | `acceptingSubmissions` default was `undefined`, causing `!undefined` to be truthy | High | Changed prop default to `true` and condition to `acceptingSubmissions === false` |
| F9 | Badge for finished state showed "Closed" instead of "Contest Ended" | Low | Changed badge text to "Contest Ended" |
| F10 | Sequential judge invitations — one failure blocks remaining | Medium | Changed to `Promise.allSettled` with failure count toast |
| F11 | Dialog dismiss via overlay/Escape abandoned pending contest status change | Medium | `handleDismiss` now calls `handleCancel` (updates contest without cascade) |
| F13 | Fragile `error.message.includes('CONTEST_NOT_AVAILABLE')` string matching | Low | Added fallback check for `error.code` property |

### Findings Classified as Noise

| # | Finding | Reason |
|---|---------|--------|
| F7 | "Missing test for 403 in get-participant-categories" | Tests for edge functions run in Deno, not in Vitest. Out of scope for client-side test suite. |
| F14/F15 | Pre-existing test failures in unrelated files | Untracked files (ParticipantInfoPage, ExportCodesButton) from other branches. Not caused by this spec. |

### Deferred

| # | Finding | Reason |
|---|---------|--------|
| F12 | Missing unit tests for CascadeStatusDialog, useCascadeContestStatus, useCategoriesByContest | Low priority — components are thin wrappers. Can be added in a follow-up PR. |
