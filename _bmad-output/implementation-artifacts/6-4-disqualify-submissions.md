# Story 6.4: Disqualify Submissions

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Super Admin**,
I want **to disqualify individual submissions**,
so that **rule-violating entries are excluded from results**.

## Acceptance Criteria

1. **Given** I am viewing a submission in AdminSubmissionDetail **When** I click "Disqualify" **Then** I see a confirmation dialog: "Are you sure you want to disqualify this submission?"

2. **Given** I confirm disqualification **When** the action processes **Then** the submission status changes to "disqualified" **And** `disqualified_at` timestamp is set **And** the submission is removed from any rankings (UI shows empty position) **And** I see success toast: "Submission disqualified"

3. **Given** a submission is disqualified **When** it appears in admin lists **Then** it shows "Disqualified" badge (red/destructive variant) **And** it is excluded from judge's ranking pool (if not yet ranked) **And** it is excluded from winners page (Story 6.5/6.6 will consume this status)

4. **Given** a submission was already in top 3 rankings **When** I disqualify it **Then** it is removed from rankings display **And** the rankings are NOT auto-adjusted (admin must re-rank if needed via existing override feature) **And** a warning shows: "Ranking position is now empty"

5. **Given** I accidentally disqualified **When** I view the disqualified submission **Then** I see a "Restore" button

6. **Given** I click "Restore" **When** I confirm restoration **Then** the submission returns to "submitted" status **And** `restored_at` timestamp is set **And** it is NOT automatically re-added to rankings **And** I see success toast: "Submission restored"

## Tasks / Subtasks

- [x] Task 1: Database migration — add disqualification tracking columns (AC: #2, #6)
  - [x] 1.1 Create migration `supabase/migrations/<timestamp>_add_disqualification_tracking.sql`
  - [x] 1.2 Add `disqualified_at TIMESTAMPTZ` to `submissions` table
  - [x] 1.3 Add `restored_at TIMESTAMPTZ` to `submissions` table
  - [x] 1.4 Run `npx supabase db push` to apply

- [x] Task 2: Update types with disqualification fields (AC: #2, #6)
  - [x] 2.1 Update `AdminSubmissionRow` interface to include `disqualified_at: string | null` and `restored_at: string | null` in the DB row shape
  - [x] 2.2 Update `AdminSubmission` interface to add `disqualifiedAt: string | null` and `restoredAt: string | null`
  - [x] 2.3 Update `transformAdminSubmission()` to map `disqualified_at` → `disqualifiedAt` and `restored_at` → `restoredAt`

- [x] Task 3: Update admin submissions API — extend query + add mutations (AC: #2, #5, #6)
  - [x] 3.1 Extend `getContestSubmissions()` query to include `disqualified_at, restored_at` in the select
  - [x] 3.2 Add `disqualifySubmission(submissionId: string): Promise<void>` — UPDATE `submissions` table setting `status = 'disqualified'`, `disqualified_at = now()`, `restored_at = null`
  - [x] 3.3 Add `restoreSubmission(submissionId: string): Promise<void>` — UPDATE `submissions` table setting `status = 'submitted'`, `restored_at = now()`

- [x] Task 4: Create mutation hooks (AC: #2, #6)
  - [x] 4.1 Create `src/features/submissions/hooks/useDisqualifySubmission.ts` — `useMutation` that calls `adminSubmissionsApi.disqualifySubmission()` and invalidates `['admin', 'submissions']` query, shows success/error toast
  - [x] 4.2 Create `src/features/submissions/hooks/useRestoreSubmission.ts` — `useMutation` that calls `adminSubmissionsApi.restoreSubmission()` and invalidates `['admin', 'submissions']` query, shows success/error toast
  - [x] 4.3 Export hooks from `src/features/submissions/hooks/index.ts`

- [x] Task 5: Create DisqualifyConfirmDialog component (AC: #1, #2)
  - [x] 5.1 Create `src/features/submissions/components/DisqualifyConfirmDialog.tsx`
  - [x] 5.2 Props: `submissionId: string`, `participantCode: string`, `categoryName: string`, `open: boolean`, `onOpenChange: (open: boolean) => void`
  - [x] 5.3 Display confirmation message: "Are you sure you want to disqualify this submission?"
  - [x] 5.4 Show submission context: participant code, category name
  - [x] 5.5 "Disqualify" button (destructive variant) using `useDisqualifySubmission` mutation
  - [x] 5.6 "Cancel" button to close dialog
  - [x] 5.7 Close dialog and show success toast on successful disqualification
  - [x] 5.8 Use shadcn `AlertDialog`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel`, `Button`
  - [x] 5.9 Export from `components/index.ts`

- [x] Task 6: Create RestoreConfirmDialog component (AC: #5, #6)
  - [x] 6.1 Create `src/features/submissions/components/RestoreConfirmDialog.tsx`
  - [x] 6.2 Props: `submissionId: string`, `participantCode: string`, `categoryName: string`, `open: boolean`, `onOpenChange: (open: boolean) => void`
  - [x] 6.3 Display confirmation: "Are you sure you want to restore this submission?"
  - [x] 6.4 Warning text: "This will NOT automatically re-add the submission to rankings."
  - [x] 6.5 "Restore" button using `useRestoreSubmission` mutation
  - [x] 6.6 "Cancel" button
  - [x] 6.7 Close dialog and show success toast on successful restoration
  - [x] 6.8 Use shadcn `AlertDialog` components (same pattern as DisqualifyConfirmDialog)
  - [x] 6.9 Export from `components/index.ts`

- [x] Task 7: Update AdminSubmissionDetail — add Disqualify/Restore actions (AC: #1, #3, #5)
  - [x] 7.1 Add state for disqualify dialog open/close and restore dialog open/close
  - [x] 7.2 If submission status is NOT 'disqualified': show "Disqualify" button (destructive variant, e.g., red outline or ghost destructive)
  - [x] 7.3 If submission status IS 'disqualified': show "Restore" button (default variant) and enhanced "Disqualified" badge with `disqualifiedAt` timestamp
  - [x] 7.4 Render DisqualifyConfirmDialog and RestoreConfirmDialog with submission data
  - [x] 7.5 Position buttons in a logical action area (near top of detail panel, below status badge)

- [x] Task 8: Update AdminCategoryRankings — handle disqualified submissions in display (AC: #4)
  - [x] 8.1 In the ranking position display logic: check if the effective submission (admin_override ?? original) has status 'disqualified'
  - [x] 8.2 If effective submission is disqualified: show "Position empty — submission disqualified" warning in that rank slot (use amber/warning styling)
  - [x] 8.3 In the override mode available submissions pool: filter OUT disqualified submissions (admin should not be able to drag a disqualified submission into a rank slot)
  - [x] 8.4 If the currently ranked submission (non-override) is disqualified, still show it grayed out with "Disqualified" badge for reference, but not as the effective winner

- [x] Task 9: Filter disqualified from judge's ranking pool (AC: #3)
  - [x] 9.1 Identify how the judge's RankingPage loads available submissions for ranking (likely via reviews or direct submission query)
  - [x] 9.2 Add filter to exclude submissions where `status = 'disqualified'` from the available ranking pool
  - [x] 9.3 If a judge has already ranked a disqualified submission and the category is NOT completed, the ranking entry remains but the disqualified submission won't appear in the pool on next visit
  - [x] 9.4 Note: If category is already completed (`judging_completed_at IS NOT NULL`), rankings are frozen — no change needed for completed categories

- [x] Task 10: Update feature exports (AC: all)
  - [x] 10.1 Update `src/features/submissions/components/index.ts` — add DisqualifyConfirmDialog, RestoreConfirmDialog
  - [x] 10.2 Update `src/features/submissions/hooks/index.ts` — add useDisqualifySubmission, useRestoreSubmission
  - [x] 10.3 Update `src/features/submissions/index.ts` — add new exports
  - [x] 10.4 Update `PROJECT_INDEX.md`

- [x] Task 11: Unit tests (AC: all)
  - [x] 11.1 `src/features/submissions/components/DisqualifyConfirmDialog.test.tsx` — shows confirmation message, calls disqualify mutation on confirm, closes on cancel, loading states
  - [x] 11.2 `src/features/submissions/components/RestoreConfirmDialog.test.tsx` — shows restore message with warning, calls restore mutation, closes on cancel
  - [x] 11.3 `src/features/submissions/components/AdminSubmissionDetail.test.tsx` — update: disqualify button shown for submitted, restore button shown for disqualified, disqualifiedAt timestamp display
  - [x] 11.4 `src/features/submissions/hooks/useDisqualifySubmission.test.ts` — mutation call, query invalidation
  - [x] 11.5 `src/features/submissions/hooks/useRestoreSubmission.test.ts` — mutation call, query invalidation

### Review Follow-ups (AI)

- [x] [AI-Review][CRITICAL] Tasks 5.8/6.8 require using shadcn `AlertDialogAction`, but both dialogs use a plain `Button` instead. (`src/features/submissions/components/DisqualifyConfirmDialog.tsx`, `src/features/submissions/components/RestoreConfirmDialog.tsx`) — Fixed: replaced `Button` with `AlertDialogAction` + `e.preventDefault()` for async control
- [x] [AI-Review][HIGH] AC #4 requires warning copy "Ranking position is now empty" for disqualified ranked submissions; UI currently shows "Position empty — submission disqualified." (`src/features/submissions/components/AdminCategoryRankings.tsx`) — Fixed: updated copy to "Ranking position is now empty"
- [x] [AI-Review][MEDIUM] Story File List section is empty; regenerate from git status per project-context rules so changes are documented. — Fixed: generated below

## Dev Notes

### Architecture Decisions

- **Status column already supports 'disqualified':** The `submissions.status` CHECK constraint already includes `'disqualified'` as a valid value (added in migration `20260129194757`). No constraint modification needed. Only add timestamp columns for audit trail.
- **Timestamp columns for audit trail:** Add `disqualified_at` and `restored_at` to track when actions occurred. Per epic spec, these are the only tracking columns needed (no `disqualified_reason` or `disqualified_by`).
- **Direct Supabase UPDATE (NOT RPC):** Admin has full RLS access to submissions table. Disqualify/restore are simple column updates. No complex transactions needed. Same pattern as Story 6-3 overrides.
- **Rankings NOT auto-adjusted:** Per AC, when a submission is disqualified, ranking rows are left intact in the DB. The UI handles display: if the effective submission at a rank position is disqualified, show "Position empty" warning. Admin uses existing override rankings feature (Story 6-3) to re-rank if needed.
- **No participant notification:** Per epic note: "Participants are never notified of disqualification. From the participant's perspective, their submission appears normal."
- **Restore returns to 'submitted' only:** The only valid pre-disqualification status tracked is 'submitted' (submissions can only be disqualified after being submitted). Restore always sets status back to 'submitted'. The review/rating data remains untouched.
- **Separate confirm dialogs:** Use `AlertDialog` (not `Dialog`) for disqualify/restore confirmations. AlertDialog is the correct shadcn component for destructive confirmation actions (prevents accidental clicks, requires explicit action).

### Database Schema Changes

**Migration: Add disqualification tracking columns**
```sql
-- Add disqualification tracking columns to submissions table
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS disqualified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS restored_at TIMESTAMPTZ;
```

No CHECK constraint changes needed — `'disqualified'` is already a valid status value.

### Disqualify API Pattern

```typescript
async disqualifySubmission(submissionId: string): Promise<void> {
  const { error } = await supabase
    .from('submissions')
    .update({
      status: 'disqualified',
      disqualified_at: new Date().toISOString(),
      restored_at: null,  // Clear any previous restore timestamp
    })
    .eq('id', submissionId)

  if (error) throw new Error(`Failed to disqualify submission: ${error.message}`)
}
```

### Restore API Pattern

```typescript
async restoreSubmission(submissionId: string): Promise<void> {
  const { error } = await supabase
    .from('submissions')
    .update({
      status: 'submitted',
      restored_at: new Date().toISOString(),
      // NOTE: Do NOT clear disqualified_at — keep for audit trail
    })
    .eq('id', submissionId)

  if (error) throw new Error(`Failed to restore submission: ${error.message}`)
}
```

### Mutation Hook Pattern (follow Story 6-3 pattern)

```typescript
// useDisqualifySubmission.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminSubmissionsApi } from '../api/adminSubmissionsApi'

export function useDisqualifySubmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (submissionId: string) =>
      adminSubmissionsApi.disqualifySubmission(submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'submissions'] })
      toast.success('Submission disqualified')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
```

### Existing Components to Reuse

| Component | Location | Usage |
|-----------|----------|-------|
| `AlertDialog`, `AlertDialogContent`, etc. | `src/components/ui/alert-dialog.tsx` | Confirm dialogs for disqualify/restore |
| `Badge` | `src/components/ui/badge.tsx` | "Disqualified" indicator (destructive variant) |
| `Button` | `src/components/ui/button.tsx` | Disqualify (destructive), Restore (default) buttons |
| `AdminSubmissionDetail` | `src/features/submissions/components/AdminSubmissionDetail.tsx` | Extend with disqualify/restore actions |
| `AdminCategoryRankings` | `src/features/submissions/components/AdminCategoryRankings.tsx` | Update ranking display for disqualified |
| `SUBMISSION_STATUS_VARIANT` | `src/features/submissions/types/adminSubmission.types.ts` | Already maps 'disqualified' → 'destructive' (red badge) |

### AdminSubmissionDetail Button Placement

The disqualify/restore button should be placed in the submission metadata section near the status badge. Pattern:

```tsx
{/* After status badge display */}
{submission.status !== 'disqualified' ? (
  <Button variant="destructive" size="sm" onClick={() => setDisqualifyOpen(true)}>
    Disqualify
  </Button>
) : (
  <div className="space-y-2">
    <div className="text-sm text-muted-foreground">
      Disqualified {submission.disqualifiedAt ? formatSubmissionDate(submission.disqualifiedAt) : ''}
    </div>
    <Button variant="outline" size="sm" onClick={() => setRestoreOpen(true)}>
      Restore
    </Button>
  </div>
)}
```

### AdminCategoryRankings — Disqualified Handling

In the ranking position display, check the effective submission status:

```tsx
// For each rank position (1, 2, 3):
const effectiveSubmissionId = ranking.adminRankingOverride ?? ranking.submissionId
const effectiveSubmission = submissions.find(s => s.id === effectiveSubmissionId)

if (effectiveSubmission?.status === 'disqualified') {
  // Show warning: "Position empty — submission disqualified"
  // Render grayed-out slot with amber warning text
} else {
  // Normal ranking display
}
```

In override mode, filter available pool:
```tsx
const availableSubmissions = submissions.filter(s => s.status !== 'disqualified')
```

### Judge Ranking Pool — Disqualified Filter

The judge's RankingPage (`src/pages/judge/RankingPage.tsx`) loads submissions for ranking. Add a filter to exclude disqualified submissions from the available pool:

```tsx
// In the component or the query that loads available submissions:
const availableForRanking = submissions.filter(s => s.status !== 'disqualified')
```

If the filter happens at the query level (Supabase), add `.neq('status', 'disqualified')` to the query. If the RankingPage uses a join through reviews, the filter should be on the submissions' status column.

**Key consideration:** The judge's review data (rating, feedback) for a disqualified submission remains intact. Only the ranking pool is filtered. The judge can still see their review but cannot rank the disqualified submission.

### Edge Cases to Handle

1. **Submission already disqualified:** Disqualify button should not appear (only Restore visible). Already handled by status check in Task 7.
2. **Submission in 'uploading' or 'uploaded' status:** Disqualify button should only appear for 'submitted' status submissions. Check: `submission.status === 'submitted'` (not just `!== 'disqualified'`).
3. **Restoring a submission that was in rankings:** Rankings are NOT auto-restored. Admin must manually re-rank using override feature. Show info text in restore dialog.
4. **Disqualified submission in admin ranking override:** If `admin_ranking_override` on a ranking row points to a disqualified submission, the UI should treat that position as empty (same logic as original submission being disqualified).
5. **Double-disqualify:** Not possible — button only shows for non-disqualified submissions.
6. **Concurrent disqualification:** If two admin sessions try to disqualify simultaneously, Supabase UPDATE is idempotent — both succeed without conflict.
7. **Category already completed:** Disqualification should still work on completed categories. The `prevent_review_modification_on_completed` trigger only affects reviews/rankings, not submissions. Admin override pattern from Story 6-3 handles the ranking side.

### Things NOT in Scope for This Story

- Disqualification reason/notes (not in AC — just status change)
- Bulk disqualification (epic only mentions "individual submissions")
- Winners page exclusion logic (Story 6.5/6.6 will consume `status='disqualified'`)
- Participant feedback view with disqualification handling (Story 6.7)
- Audit log beyond `disqualified_at` / `restored_at` timestamps
- Admin notification of disqualification (not in AC)

### Quality Gate (Per Epic 5 Retro)

```bash
npm run build              # Must pass
npm run lint               # Must pass
npm run type-check         # Must pass
npx vitest run --changed   # Scoped tests only (NOT npm run test)
```

### Project Structure Notes

**New files:**
```
supabase/migrations/
  <timestamp>_add_disqualification_tracking.sql   (NEW)

src/features/submissions/
  components/DisqualifyConfirmDialog.tsx           (NEW)
  components/DisqualifyConfirmDialog.test.tsx      (NEW)
  components/RestoreConfirmDialog.tsx              (NEW)
  components/RestoreConfirmDialog.test.tsx         (NEW)
  hooks/useDisqualifySubmission.ts                 (NEW)
  hooks/useDisqualifySubmission.test.ts            (NEW)
  hooks/useRestoreSubmission.ts                    (NEW)
  hooks/useRestoreSubmission.test.ts               (NEW)
```

**Modified files:**
```
src/features/submissions/
  types/adminSubmission.types.ts                   (MODIFIED — add disqualifiedAt, restoredAt fields)
  api/adminSubmissionsApi.ts                       (MODIFIED — extend query + add disqualify/restore methods)
  components/AdminSubmissionDetail.tsx              (MODIFIED — add disqualify/restore buttons + wire dialogs)
  components/AdminSubmissionDetail.test.tsx         (MODIFIED — update tests for disqualify/restore)
  components/AdminCategoryRankings.tsx              (MODIFIED — handle disqualified in ranking display + pool filter)
  components/index.ts                              (MODIFIED — add new exports)
  hooks/index.ts                                   (MODIFIED — add new exports)
  index.ts                                         (MODIFIED — add new exports)

src/pages/judge/
  RankingPage.tsx                                  (MODIFIED — filter disqualified from available ranking pool)

src/router/
  index.tsx                                        (NO CHANGE — no new routes needed)

PROJECT_INDEX.md                                   (MODIFIED)
```

**Alignment:** All new files remain within `src/features/submissions/` feature boundary. Judge ranking pool filter is a cross-feature UI change in `src/pages/judge/RankingPage.tsx` but does not require new exports from the reviews feature. Database migration follows established pattern in `supabase/migrations/`.

### Previous Story Intelligence (6-3)

From Story 6-3 completion notes:
- `(supabase.from as any)` pattern used for reviews/rankings mutations — use same pattern for submissions mutations if TypeScript complains about column types
- `useOverrideFeedback` and `useOverrideRankings` establish the mutation hook pattern with `queryClient.invalidateQueries({ queryKey: ['admin', 'submissions'] })` and `toast` notifications
- `OverrideFeedbackDialog` uses inner form pattern — `DisqualifyConfirmDialog` is simpler (no form, just confirmation)
- `AdminCategoryRankings` reuses `RankingSlot` and `DraggableSubmissionCard` from reviews feature via `SubmissionForReview` adapter — ranking display logic can be extended to check disqualification status
- Review findings from 6-3: "View Rankings" link gated on `categoryId` (not `rankingPosition`) — same link available for disqualified submissions
- Trigger bypass logic for admin override columns was implemented — not affected by this story (we're updating submissions table, not reviews/rankings)
- `AdminCategoryRankings.test.tsx` has mocked `@dnd-kit/core` — follow same test pattern if testing ranking display changes

From Story 6-3 dev notes:
- `buildJudgeName()` returns `null` for missing profiles — not relevant here
- `formatRankingPosition()` helper exists for rank display — may be useful for "Position empty" warning context
- `break-words` class on feedback text — not relevant here

### Git Intelligence

Recent commits show consistent pattern:
- Commit format: `{story-id}: {action} {what}`
- PRs auto-merged to main via numbered PRs
- Last 3 commits: `6-3: Add admin override...`, `6-2: Add admin view...`, `6-1: Add Admin View...`
- Stories 6-1 through 6-3 all modified the same feature boundary (`src/features/submissions/`)
- The AdminSubmissionDetail component was modified in both 6-2 and 6-3 — expect potential merge conflicts if working on stale branch

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-6-admin-oversight-results-publication.md#Story 6.4]
- [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md — FR53: Super Admin can disqualify individual submissions]
- [Source: _bmad-output/implementation-artifacts/6-3-override-feedback-rankings.md — Previous story patterns, mutation hooks, API patterns]
- [Source: _bmad-output/project-context.md — All critical rules and patterns]
- [Source: supabase/migrations/20260127170234_create_submissions.sql — Submissions table schema]
- [Source: supabase/migrations/20260129194757_add_uploaded_status_to_submissions.sql — Status CHECK constraint including 'disqualified']
- [Source: supabase/migrations/20260131221749_create_rankings_table.sql — Rankings schema]
- [Source: supabase/migrations/20260201162435_add_admin_override_columns.sql — Admin override columns on rankings]
- [Source: src/features/submissions/types/adminSubmission.types.ts — Types to extend, SUBMISSION_STATUS_VARIANT already has 'disqualified' → 'destructive']
- [Source: src/features/submissions/api/adminSubmissionsApi.ts — API to extend with disqualify/restore methods]
- [Source: src/features/submissions/components/AdminSubmissionDetail.tsx — Component to update with action buttons]
- [Source: src/features/submissions/components/AdminCategoryRankings.tsx — Component to update for ranking display]
- [Source: src/pages/judge/RankingPage.tsx — Judge ranking pool to filter]
- [Source: _bmad-output/planning-artifacts/architecture/core-architectural-decisions.md — Architecture patterns]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- All 11 tasks completed successfully
- Migration applied to online Supabase: `20260201185351_add_disqualification_tracking.sql`
- Used `as Record<string, unknown>` cast for untyped new columns in Supabase client (alternative to `(supabase.from as any)` pattern from 6-3)
- Judge ranking pool filter is client-side (RPC returns all submissions, filter applied in `sortedSubmissions` memo) — simplest approach since RPC is SECURITY DEFINER
- Edge case: Disqualify button only shows for `status === 'submitted'` (not for 'uploading'/'uploaded' statuses per dev notes edge case #2)
- 134 tests passing across 19 test files (4 new + 15 existing affected)

### File List

**New files:**
- `supabase/migrations/20260201185351_add_disqualification_tracking.sql`
- `src/features/submissions/components/DisqualifyConfirmDialog.tsx`
- `src/features/submissions/components/DisqualifyConfirmDialog.test.tsx`
- `src/features/submissions/components/RestoreConfirmDialog.tsx`
- `src/features/submissions/components/RestoreConfirmDialog.test.tsx`
- `src/features/submissions/hooks/useDisqualifySubmission.ts`
- `src/features/submissions/hooks/useDisqualifySubmission.test.ts`
- `src/features/submissions/hooks/useRestoreSubmission.ts`
- `src/features/submissions/hooks/useRestoreSubmission.test.ts`

**Modified files:**
- `src/features/submissions/types/adminSubmission.types.ts`
- `src/features/submissions/types/adminSubmission.types.test.ts`
- `src/features/submissions/api/adminSubmissionsApi.ts`
- `src/features/submissions/components/AdminSubmissionDetail.tsx`
- `src/features/submissions/components/AdminSubmissionDetail.test.tsx`
- `src/features/submissions/components/AdminCategoryRankings.tsx`
- `src/features/submissions/components/AdminCategoryRankings.test.tsx`
- `src/features/submissions/components/AdminSubmissionsTable.test.tsx`
- `src/features/submissions/components/index.ts`
- `src/features/submissions/hooks/index.ts`
- `src/features/submissions/hooks/useAdminSubmissions.test.ts`
- `src/features/submissions/index.ts`
- `src/pages/judge/RankingPage.tsx`
- `PROJECT_INDEX.md`
