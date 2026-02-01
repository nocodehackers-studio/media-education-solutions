# Story 6.7: Participant Feedback View

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Participant**,
I want **to view my feedback and rating on my submission page after the contest is finished**,
so that **I can learn and improve from judge evaluations**.

## Acceptance Criteria

1. **Given** I enter my contest code and participant code **When** the contest status is "Finished" **Then** I see the same contest view with all categories.

2. **Given** I view a category where I submitted **When** I navigate to that category **Then** I see my submission (same page as before) **And** below my submission, I see a new "Feedback" section.

3. **Given** I view the feedback section **When** I scroll down on my submission page **Then** I see: Rating tier name (e.g., "Proficient Creator"), numeric score (e.g., "6 out of 10"), judge's written feedback (or "No feedback provided").

4. **Given** my submission was disqualified **When** I view my submission page **Then** I see my submission normally **And** I see the feedback section with my rating **And** there is NO indication of disqualification.

5. **Given** I was a winner (top 3) **When** I view my feedback **Then** I see ONLY my rating tier and feedback **And** I do NOT see my ranking position (1st/2nd/3rd) **And** I am NOT told I won **And** I am NOT redirected to winners page.

6. **Given** I was NOT a winner **When** I view my feedback **Then** I see the same information as winners (rating + feedback only) **And** there is no difference in display between winners and non-winners.

7. **Given** the contest is NOT finished **When** I view my submission **Then** I do NOT see any feedback section **And** I see my submission as normal (editable if before deadline).

8. **Given** I never submitted to a category **When** I view the categories list **Then** I see that category displayed but **disabled/grayed out** **And** I cannot click into it **And** tooltip or label: "No submission".

9. **Given** admin overrode feedback **When** I view it **Then** I see the admin's feedback (not the original judge feedback) **And** there is NO indicator that it was overridden.

## Tasks / Subtasks

- [ ] Task 1: Update `validate-participant` Edge Function to accept "finished" contests (AC: #1)
  - [ ] 1.1 Open `supabase/functions/validate-participant/index.ts`
  - [ ] 1.2 Change the contest status check from `status !== 'published'` to allow BOTH `'published'` AND `'finished'` statuses — e.g., `if (!['published', 'finished'].includes(contest.status))`
  - [ ] 1.3 Deploy: `npx supabase functions deploy validate-participant`
  - [ ] 1.4 Verify existing participant login still works for published contests

- [ ] Task 2: Extend `get-submission` Edge Function to include feedback data (AC: #2, #3, #4, #5, #6, #7, #9)
  - [ ] 2.1 Open `supabase/functions/get-submission/index.ts`
  - [ ] 2.2 After fetching the submission, query the contest status via: `submissions.category_id → categories.division_id → divisions.contest_id → contests.status`
  - [ ] 2.3 If contest status is `'finished'`: query `reviews` table for this submission (`reviews.submission_id = submission.id`) — select `rating`, `feedback`, `admin_feedback_override`, `admin_feedback_override_at`
  - [ ] 2.4 Compute `effectiveFeedback`: if `admin_feedback_override` is not null, use it; otherwise use `feedback`
  - [ ] 2.5 Compute `ratingTier` from `rating` using the same tier logic: tier 1 (1-2), tier 2 (3-4), tier 3 (5-6), tier 4 (7-8), tier 5 (9-10) — match labels: "Developing Skills", "Emerging Producer", "Proficient Creator", "Advanced Producer", "Master Creator"
  - [ ] 2.6 Add to response object: `review: { rating: number, ratingTierLabel: string, feedback: string } | null` — null when contest is not finished OR submission has no review
  - [ ] 2.7 Do NOT include judge name/id, ranking position, or any winning indicator — participants must not see any of this
  - [ ] 2.8 Do NOT expose `admin_feedback_override` as a separate field — only send the effective feedback
  - [ ] 2.9 For disqualified submissions: return feedback data normally (no disqualification indicator in response)
  - [ ] 2.10 Add `contestStatus: string` to the response object so the frontend knows when to display the feedback section
  - [ ] 2.11 Deploy: `npx supabase functions deploy get-submission`

- [ ] Task 3: Extend `get-participant-categories` Edge Function (AC: #1, #7, #8)
  - [ ] 3.1 Open `supabase/functions/get-participant-categories/index.ts`
  - [ ] 3.2 Add `contestStatus` to the response metadata (fetch from contests table via divisions → categories path, or pass contestId and query directly)
  - [ ] 3.3 When `contestStatus === 'finished'`: for categories where the participant has NO submission, add a flag `noSubmission: true`
  - [ ] 3.4 Deploy: `npx supabase functions deploy get-participant-categories`

- [ ] Task 4: Update participant API types (AC: #2, #3, #8)
  - [ ] 4.1 Open `src/features/participants/types/participant.types.ts` (or the appropriate types file)
  - [ ] 4.2 Add `ParticipantFeedback` type: `{ rating: number, ratingTierLabel: string, feedback: string }`
  - [ ] 4.3 Extend the `SubmissionPreviewData` type (in `src/features/submissions/types/`) to include `review: ParticipantFeedback | null` and `contestStatus: string`
  - [ ] 4.4 Extend the `ParticipantCategory` type to include `noSubmission?: boolean` and `contestStatus?: string`

- [ ] Task 5: Update `useSubmissionPreview` hook (AC: #2, #3, #7)
  - [ ] 5.1 Open `src/features/submissions/hooks/useSubmissionPreview.ts`
  - [ ] 5.2 Map the new `review` and `contestStatus` fields from the edge function response to the hook's returned data
  - [ ] 5.3 Ensure existing fields remain unchanged (non-breaking change)

- [ ] Task 6: Update `useParticipantCategories` hook (AC: #1, #8)
  - [ ] 6.1 Open `src/features/participants/hooks/useParticipantCategories.ts`
  - [ ] 6.2 Map the new `contestStatus` and `noSubmission` fields from the edge function response
  - [ ] 6.3 Return `contestStatus` alongside the categories array

- [ ] Task 7: Create `ParticipantFeedbackSection` component (AC: #2, #3, #4, #5, #6, #9)
  - [ ] 7.1 Create `src/features/participants/components/ParticipantFeedbackSection.tsx`
  - [ ] 7.2 Props: `feedback: ParticipantFeedback` (rating, ratingTierLabel, feedback text)
  - [ ] 7.3 Layout: Card with heading "Your Feedback" — use shadcn `Card`, `CardContent`, `CardHeader`
  - [ ] 7.4 Display rating tier name prominently (bold, larger text) — e.g., "Proficient Creator"
  - [ ] 7.5 Display numeric score: "{score} out of 10" — styled secondary
  - [ ] 7.6 Display feedback text: full text block, or "No feedback provided" in muted/italic style if empty
  - [ ] 7.7 Use `getRatingTier()` from `@/features/reviews` for consistent tier styling (optional: color-code tiers)
  - [ ] 7.8 No judge name, no ranking position, no winning indication — keep it minimal and equal for all participants
  - [ ] 7.9 Responsive layout: single column, full width on mobile

- [ ] Task 8: Update `SubmissionPreviewPage` to display feedback (AC: #2, #3, #4, #5, #6, #7)
  - [ ] 8.1 Open `src/pages/participant/SubmissionPreviewPage.tsx`
  - [ ] 8.2 Import `ParticipantFeedbackSection` from `@/features/participants`
  - [ ] 8.3 Read `review` and `contestStatus` from the `useSubmissionPreview` hook data
  - [ ] 8.4 Conditionally render `ParticipantFeedbackSection` below the submission preview ONLY when `contestStatus === 'finished'` AND `review` is not null
  - [ ] 8.5 When `contestStatus === 'finished'`: hide action buttons (Confirm, Replace, Withdraw) — contest is over, no actions available
  - [ ] 8.6 When `contestStatus === 'finished'` AND `review` is null: show message "Your submission has not been reviewed yet" (edge case — contest finished but judge didn't review)

- [ ] Task 9: Update `ParticipantCategoriesPage` for finished contest behavior (AC: #1, #7, #8)
  - [ ] 9.1 Open `src/pages/participant/ParticipantCategoriesPage.tsx`
  - [ ] 9.2 When `contestStatus === 'finished'`: show a banner/notice at top: "This contest has ended. View your feedback below."
  - [ ] 9.3 For categories with `noSubmission: true`: render card as disabled/grayed out with label "No submission" — not clickable (no link/navigation)
  - [ ] 9.4 For categories WITH submissions: card links to preview page as normal (where feedback section will display)
  - [ ] 9.5 Update `ParticipantCategoryCard` component to accept `disabled` and `noSubmission` props with appropriate styling (opacity-50, cursor-not-allowed, no hover effect)

- [ ] Task 10: Update feature exports (AC: all)
  - [ ] 10.1 Add `ParticipantFeedbackSection` to `src/features/participants/index.ts`
  - [ ] 10.2 Add `ParticipantFeedback` type to `src/features/participants/index.ts`
  - [ ] 10.3 Verify `src/features/submissions/index.ts` exports updated types if modified

- [ ] Task 11: Unit tests (AC: all)
  - [ ] 11.1 `src/features/participants/components/ParticipantFeedbackSection.test.tsx` — renders tier label, score, feedback text; renders "No feedback provided" when empty; does not show judge name or ranking
  - [ ] 11.2 Test in `SubmissionPreviewPage` context (optional): verify feedback section appears only when contestStatus is finished and review is not null

## Dev Notes

### Architecture Decisions

- **Extend existing edge functions** rather than creating new ones. The `get-submission` function already fetches all submission context with service role — adding a `reviews` join when `contest.status === 'finished'` is a natural extension. Creating a separate edge function for feedback would be over-engineering for this use case.
- **`validate-participant` must accept 'finished' status:** Currently this edge function rejects any contest that isn't `'published'`. Since participants need to log in to finished contests to see feedback, update the status check to accept both `'published'` and `'finished'`. This is the **most critical change** — without it, participants can't even enter a finished contest.
- **Effective feedback computation in edge function:** Apply admin override logic server-side. The client receives only the final effective feedback — never the original judge feedback when an override exists. No override indicator is sent.
- **No new feature directory needed:** The `ParticipantFeedbackSection` component lives in the existing `participants` feature (`src/features/participants/components/`). Types extend existing types. No new feature structure required.
- **Rating tier computation in edge function:** Compute the tier label server-side to avoid duplicating tier logic. Use the same tier boundaries: 1-2 = "Developing Skills", 3-4 = "Emerging Producer", 5-6 = "Proficient Creator", 7-8 = "Advanced Producer", 9-10 = "Master Creator".
- **Categories page behavior in finished state:** When contest is finished, categories without submissions become disabled. This prevents participants from trying to submit to a finished contest. Categories with submissions remain clickable and navigate to the preview page where feedback is shown.

### Edge Function: get-submission extension

```typescript
// In supabase/functions/get-submission/index.ts
// AFTER fetching the submission, add:

// 1. Get contest status via category → division → contest
const { data: categoryData } = await supabaseAdmin
  .from('categories')
  .select('divisions!inner(contests!inner(status))')
  .eq('id', submission.category_id)
  .single()

const contestStatus = categoryData?.divisions?.contests?.status

// 2. If contest is finished, fetch review with effective feedback
let review = null
if (contestStatus === 'finished') {
  const { data: reviewData } = await supabaseAdmin
    .from('reviews')
    .select('rating, feedback, admin_feedback_override')
    .eq('submission_id', submission.id)
    .single()

  if (reviewData) {
    const effectiveFeedback = reviewData.admin_feedback_override ?? reviewData.feedback
    const tierLabel = getRatingTierLabel(reviewData.rating) // implement inline
    review = {
      rating: reviewData.rating,
      ratingTierLabel: tierLabel,
      feedback: effectiveFeedback || '',
    }
  }
}

// 3. Add to response
return { success: true, submission: { ...submissionData, contestStatus, review } }
```

### Rating Tier Labels (for edge function — inline, no imports)

```typescript
function getRatingTierLabel(rating: number): string {
  if (rating <= 2) return 'Developing Skills'
  if (rating <= 4) return 'Emerging Producer'
  if (rating <= 6) return 'Proficient Creator'
  if (rating <= 8) return 'Advanced Producer'
  return 'Master Creator'
}
```

### validate-participant status check update

```typescript
// BEFORE (current):
if (contest.status !== 'published') {
  return error('CONTEST_NOT_ACCEPTING')
}

// AFTER:
if (!['published', 'finished'].includes(contest.status)) {
  return error('CONTEST_NOT_ACCEPTING')
}
```

### ParticipantFeedbackSection Component

```tsx
// src/features/participants/components/ParticipantFeedbackSection.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type ParticipantFeedback } from '@/features/participants'

interface ParticipantFeedbackSectionProps {
  feedback: ParticipantFeedback
}

export function ParticipantFeedbackSection({ feedback }: ParticipantFeedbackSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-lg font-semibold">{feedback.ratingTierLabel}</p>
          <p className="text-sm text-muted-foreground">
            {feedback.rating} out of 10
          </p>
        </div>
        <div>
          {feedback.feedback ? (
            <p className="text-sm leading-relaxed">{feedback.feedback}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No feedback provided
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

### SubmissionPreviewPage integration

```tsx
// In SubmissionPreviewPage.tsx — add below SubmissionPreview component:
{submissionData?.contestStatus === 'finished' && (
  <>
    {submissionData.review ? (
      <ParticipantFeedbackSection feedback={submissionData.review} />
    ) : (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground text-center">
            Your submission has not been reviewed yet.
          </p>
        </CardContent>
      </Card>
    )}
  </>
)}

{/* Hide action buttons when contest is finished */}
{submissionData?.contestStatus !== 'finished' && (
  <div className="flex gap-2">
    {/* Confirm / Replace / Withdraw buttons */}
  </div>
)}
```

### Existing Components to Reuse

| Component | Location | Usage |
|-----------|----------|-------|
| `Card`, `CardContent`, `CardHeader`, `CardTitle` | `src/components/ui/card.tsx` | Feedback section card |
| `Badge` | `src/components/ui/badge.tsx` | Optional: tier badge styling |
| `getRatingTier`, `RATING_TIERS` | `src/features/reviews/types/review.types.ts` | Tier label reference (frontend validation) |
| `SubmissionPreview` | `src/features/submissions/components/SubmissionPreview.tsx` | Already used in preview page — no changes needed |
| `ParticipantCategoryCard` | `src/features/participants/components/ParticipantCategoryCard.tsx` | Extend with disabled/noSubmission props |

### Edge Cases to Handle

1. **Contest finished but submission not reviewed:** Show "Your submission has not been reviewed yet" — review data is null.
2. **Admin override with empty feedback:** If admin override is empty string, treat as "No feedback provided".
3. **Rating is null:** Shouldn't happen per schema (rating INTEGER NOT NULL), but guard with "Pending review" fallback.
4. **Participant enters finished contest for first time:** validate-participant now accepts 'finished' status. Categories page shows feedback-ready view.
5. **Session stored from published state, contest transitions to finished:** Next API call (get-participant-categories or get-submission) returns updated contestStatus — UI adapts dynamically.
6. **Disqualified submission:** get-submission returns it normally. Feedback section shows normally. No disqualification indicator anywhere in participant view.
7. **Multiple judges per submission:** Current schema has UNIQUE(submission_id, judge_id) but design assumes one judge per category. Edge function fetches `.single()` — if multiple reviews exist, picks first. Not expected in normal flow.

### Things NOT in Scope

- Displaying judge name (anonymous judging)
- Showing ranking position (1st/2nd/3rd) to participants
- Linking to or mentioning the winners page
- Email notification when feedback is available
- Detailed feedback breakdown (only tier + score + text)
- Feedback for categories where participant didn't submit (disabled/grayed out, no feedback view)
- Any participant-facing disqualification indicator

### Testing Policy (STRICT — READ THIS)

```bash
# MANDATORY TESTING RULES:
# 1. ONLY test files you created or directly modified in THIS story
# 2. NEVER run full test suite (npm run test is BANNED)
# 3. NEVER run tests on unchanged files from previous stories
# 4. Use: npx vitest run --changed   (scoped to changed files only)
# 5. Or target specific files: npx vitest run src/features/participants/components/ParticipantFeedbackSection.test.tsx
# 6. HARD LIMITS: Max 50 tests total, Max 5 minutes testing time
# 7. If limits exceeded: STOP testing immediately and move on
# 8. Do NOT "verify" tests from other stories — they are not your concern
```

### Quality Gate

```bash
npm run build              # Must pass
npm run lint               # Must pass
npm run type-check         # Must pass
npx vitest run --changed   # Scoped tests ONLY — NOT full suite
```

### Project Structure Notes

**New files:**
```
src/features/participants/components/ParticipantFeedbackSection.tsx       (NEW)
src/features/participants/components/ParticipantFeedbackSection.test.tsx  (NEW)
```

**Modified files:**
```
supabase/functions/validate-participant/index.ts       (MODIFIED — accept 'finished' status)
supabase/functions/get-submission/index.ts             (MODIFIED — add review data when finished)
supabase/functions/get-participant-categories/index.ts (MODIFIED — add contestStatus, noSubmission flag)
src/features/submissions/hooks/useSubmissionPreview.ts (MODIFIED — map review and contestStatus fields)
src/features/participants/hooks/useParticipantCategories.ts (MODIFIED — map contestStatus, noSubmission)
src/features/participants/types/participant.types.ts   (MODIFIED — add ParticipantFeedback type)
src/features/submissions/types/*.ts                    (MODIFIED — extend SubmissionPreviewData)
src/pages/participant/SubmissionPreviewPage.tsx         (MODIFIED — add feedback section)
src/pages/participant/ParticipantCategoriesPage.tsx     (MODIFIED — finished contest behavior)
src/features/participants/components/ParticipantCategoryCard.tsx (MODIFIED — disabled/noSubmission props)
src/features/participants/index.ts                     (MODIFIED — new exports)
```

**Alignment:** All changes follow Bulletproof React feature architecture. New component lives in existing `participants` feature. Edge function extensions use service role (already established). Feature index updated with new exports. No new features, no new routes — extends existing participant flow.

### Previous Story Intelligence (6-6)

From Story 6-6 implementation:
- Two edge functions deployed (`validate-winners-password`, `get-contest-public-metadata`) — established pattern for service-role edge functions returning curated data
- `winners` feature created as separate feature — this story does NOT touch it
- Edge function pattern: CORS headers, `createClient` with service role, structured JSON responses
- Contest `'finished'` status is set when winners page is generated (Story 6-5)
- `winners_page_enabled` boolean controls public winners access — irrelevant to participant feedback

From Story 6-5:
- Contest transitions to `'finished'` when admin clicks "Generate Winners Page"
- `approved_for_winners` flag on categories — irrelevant to participant feedback
- `winnersApi.getEffectiveWinners()` logic — edge function precedent for effective override logic

### Git Intelligence

Recent commits:
- `6-5: Add winners page generation with category approval workflow (#30)`
- `6-4: Add submission disqualify & restore for admin oversight (#29)`
- `6-3: Add admin override for feedback & rankings (#28)`
- Commit format: `{story-id}: {action} {what}`
- PRs merged to main
- This story modifies existing features — potential merge conflicts if 6-6 branch is active simultaneously. Recommend: ensure 6-6 is merged before starting 6-7.

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-6-admin-oversight-results-publication.md#Story 6.7]
- [Source: _bmad-output/project-context.md — All critical rules and patterns]
- [Source: supabase/functions/validate-participant/index.ts — Status check to update (line ~75)]
- [Source: supabase/functions/get-submission/index.ts — Extend with review data]
- [Source: supabase/functions/get-participant-categories/index.ts — Extend with contestStatus]
- [Source: src/features/reviews/types/review.types.ts — RATING_TIERS, getRatingTier()]
- [Source: src/features/submissions/hooks/useSubmissionPreview.ts — Hook to extend]
- [Source: src/features/participants/hooks/useParticipantCategories.ts — Hook to extend]
- [Source: src/pages/participant/SubmissionPreviewPage.tsx — Page to add feedback section]
- [Source: src/pages/participant/ParticipantCategoriesPage.tsx — Page to update for finished state]
- [Source: src/features/participants/components/ParticipantCategoryCard.tsx — Card to add disabled state]
- [Source: src/features/submissions/components/AdminReviewSection.tsx — Feedback display pattern reference]
- [Source: src/contexts/ParticipantSessionContext.tsx — Session data available]
- [Source: supabase/migrations/20260131020610_create_reviews_table.sql — Reviews table schema + RLS]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
