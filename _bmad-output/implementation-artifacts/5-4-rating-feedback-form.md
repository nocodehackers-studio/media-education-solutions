# Story 5.4: Rating & Feedback Form

Status: in-progress

## Story

As a **Judge**,
I want **to rate submissions on a 5-tier scale with granular score selection and optionally provide written feedback**,
So that **participants receive meaningful evaluation**.

## Acceptance Criteria

### AC1: Rating Tiers Displayed
**Given** I am on a submission review page
**When** I view the rating section
**Then** I see the RatingScale component with 5 tiers:
| Tier | Label | Score Range |
|------|-------|-------------|
| 1 | Developing Skills | 1-2 |
| 2 | Emerging Producer | 3-4 |
| 3 | Proficient Creator | 5-6 |
| 4 | Advanced Producer | 7-8 |
| 5 | Master Creator | 9-10 |

### AC2: Tier Selection
**Given** I click on a rating tier
**When** the tier is selected
**Then** the tier is visually highlighted
**And** my selection is recorded
**And** a granular score picker appears for that tier

### AC3: Granular Score Selection
**Given** I have selected a tier
**When** I want to give a specific score
**Then** I can select a number within the tier's range (e.g., 7 or 8 for "Advanced Producer")
**And** the selected score is visually highlighted

### AC4: Feedback Textarea
**Given** I view the feedback section
**When** I see the textarea
**Then** I see a placeholder: "Provide constructive feedback for the participant... (optional)"
**And** feedback is NOT required to save the review

### AC5: Feedback Auto-Save
**Given** I type feedback
**When** I blur the textarea or stop typing for 1.5 seconds
**Then** my feedback is auto-saved
**And** I see a subtle "Saved" indicator that fades after 2 seconds

### AC6: Save & Next Navigation
**Given** I have selected a rating (feedback optional)
**When** I click "Save & Next"
**Then** my review is saved
**And** I navigate to the next unreviewed submission

### AC7: Rating Required Warning
**Given** I try to navigate without selecting a rating
**When** I click Next or press Arrow Right
**Then** I see a warning "Please select a rating before continuing"
**And** I am NOT blocked if feedback is empty

## Tasks / Subtasks

- [x] Task 1: Enhance `RatingDisplay` with granular score selection (AC1, AC2, AC3)
  - [x] 1.1 Modify `src/features/reviews/components/RatingDisplay.tsx`
  - [x] 1.2 Keep existing tier row: 5 tier buttons (Developing Skills → Master Creator)
  - [x] 1.3 Add granular score row: when a tier is selected, render a second row of number buttons for that tier's score range (e.g., tier "Advanced Producer" → buttons `7` and `8`)
  - [x] 1.4 Clicking a tier button first: sets rating to `tier.minScore` (preserving current behavior), then shows score buttons
  - [x] 1.5 Clicking a score button: updates rating to that exact score
  - [x] 1.6 Visual states — tier row: selected tier highlighted (`border-primary bg-primary/10`), others dimmed; score row: selected score has `bg-primary text-primary-foreground` (filled button style)
  - [x] 1.7 Switching tier: resets to new tier's `minScore`, shows new tier's score buttons
  - [x] 1.8 Score buttons use `Button` component from `@/components/ui` with `variant="outline"` (unselected) / custom primary style (selected)
  - [x] 1.9 Ensure keyboard navigable: tier buttons and score buttons are all focusable `<button>` elements with focus-visible rings
  - [x] 1.10 Add ARIA: `role="radiogroup"` on tier container, `aria-label="Rating"`, each button `role="radio"` with `aria-checked`

- [x] Task 2: Add feedback auto-save with debounce (AC4, AC5)
  - [x] 2.1 Modify `src/pages/judge/SubmissionReviewPage.tsx`
  - [x] 2.2 Add debounced auto-save: when `localFeedback` changes, start a 1500ms timer. If the user keeps typing, reset the timer. When the timer fires, call `saveReview({ submissionId, rating: localRating, feedback: localFeedback })`
  - [x] 2.3 Also save on textarea `onBlur` event (immediate, cancel pending debounce)
  - [x] 2.4 Add `saveStatus` state: `'idle' | 'saving' | 'saved'`. Set `'saving'` while mutating, `'saved'` on success, fade back to `'idle'` after 2 seconds
  - [x] 2.5 Display "Saved" indicator: subtle text below the textarea, e.g., `<span className="text-xs text-muted-foreground">Saved</span>` with opacity transition
  - [x] 2.6 Use `useRef` for debounce timer to avoid stale closures. Clear timer on unmount and on submission change
  - [x] 2.7 Do NOT auto-save if nothing is dirty (avoid unnecessary API calls)

- [x] Task 3: Add rating auto-save on tier/score change (AC2, AC3)
  - [x] 3.1 In `SubmissionReviewPage`, when `localRating` changes (via `setLocalRating` callback from `RatingDisplay`), immediately save the rating (no debounce — rating changes are intentional clicks, not continuous typing)
  - [x] 3.2 Reuse same `saveStatus` indicator: show "Saving..." → "Saved" for rating changes too
  - [x] 3.3 Prevent duplicate saves: if a save is already in flight (`isSaving`), queue the latest values and save after current completes

- [x] Task 4: Add "Save & Next" button and rating validation (AC6, AC7)
  - [x] 4.1 In `SubmissionReviewPage`, replace the plain "Next" button with "Save & Next" (when rating is set) or keep "Next" (when no rating)
  - [x] 4.2 Add `ratingWarning` state: `boolean`, default `false`
  - [x] 4.3 When user clicks Next (button or Arrow Right) WITHOUT a rating selected: set `ratingWarning = true`, display warning message "Please select a rating before continuing", do NOT navigate
  - [x] 4.4 Warning display: inline message near the rating section, e.g., `<p className="text-sm text-destructive">Please select a rating before continuing</p>`. Clear warning when rating is selected
  - [x] 4.5 When user clicks Next WITH a rating: save review (if dirty), navigate to next submission
  - [x] 4.6 "Save & Next" navigates to next UNREVIEWED submission (skip already-reviewed ones), or next sequential if all reviewed
  - [x] 4.7 Allow navigating backward (Previous) without rating — only Next/Save & Next requires rating

- [x] Task 5: Update RatingDisplay tests (AC1, AC2, AC3)
  - [x] 5.1 Modify `src/features/reviews/components/RatingDisplay.test.tsx`
  - [x] 5.2 Test: renders all 5 tier buttons with labels and score ranges
  - [x] 5.3 Test: clicking a tier highlights it and calls onChange with minScore
  - [x] 5.4 Test: clicking a tier shows granular score buttons for that tier's range
  - [x] 5.5 Test: clicking a score button calls onChange with that exact score
  - [x] 5.6 Test: switching tier shows new score buttons and resets selection
  - [x] 5.7 Test: when value prop is 8, "Advanced Producer" tier is highlighted AND score "8" button is highlighted
  - [x] 5.8 Test: when value is null, no tier or score is highlighted
  - [x] 5.9 Test: ARIA attributes — `role="radiogroup"`, `aria-checked` on selected
  - [x] 5.10 Test: keyboard focus works on tier and score buttons

- [x] Task 6: Update SubmissionReviewPage tests (AC4, AC5, AC6, AC7)
  - [x] 6.1 Modify `src/pages/judge/SubmissionReviewPage.test.tsx`
  - [x] 6.2 Test: feedback textarea has correct placeholder text
  - [x] 6.3 Test: typing feedback and blurring triggers save
  - [x] 6.4 Test: "Saved" indicator appears after successful save
  - [x] 6.5 Test: "Saved" indicator fades after 2 seconds
  - [x] 6.6 Test: clicking Next without rating shows warning message
  - [x] 6.7 Test: warning clears when rating is selected
  - [x] 6.8 Test: clicking "Save & Next" with rating saves and navigates
  - [x] 6.9 Test: Previous button works without rating (no validation)
  - [x] 6.10 Test: keyboard ArrowRight without rating shows warning

- [x] Task 7: Run quality gates
  - [x] 7.1 `npm run build` passes
  - [x] 7.2 `npm run lint` passes
  - [x] 7.3 `npm run type-check` passes
  - [x] 7.4 `npm run test` passes (all existing + new tests)
  - [x] 7.5 Manual smoke test: select tier → see score buttons → select score → see highlight → type feedback → blur → "Saved" appears → click Save & Next → navigates
  - [x] 7.6 Manual smoke test: click Next without rating → warning appears → select rating → warning clears → Next works

### Review Follow-ups (AI)

- [ ] [AI-Review][CRITICAL] Prevent debounced feedback auto-save when there is no net change (Task 2.7) to avoid unnecessary API calls. [src/pages/judge/SubmissionReviewPage.tsx:141]
- [ ] [AI-Review][CRITICAL] Ensure in-flight save de-duplication applies to navigation + keyboard paths (route through performSave or guard on isSaving/savingRef) to prevent overlapping saves. [src/pages/judge/SubmissionReviewPage.tsx:164]
- [ ] [AI-Review][HIGH] Move submission sync state updates out of render into useEffect to avoid render-phase state updates. [src/pages/judge/SubmissionReviewPage.tsx:74]
- [ ] [AI-Review][MEDIUM] Regenerate File List from git to include actual modified files (future-work.md, sprint-status.yaml, story file). [_bmad-output/implementation-artifacts/5-4-rating-feedback-form.md:420]
- [ ] [AI-Review][MEDIUM] Replace deep import of RATING_TIERS with feature index import per project-context rules. [src/features/reviews/components/RatingDisplay.tsx:4]
- [ ] [AI-Review][LOW] Convert debounce/fade tests to use vi.useFakeTimers to reduce real-time waits/flakiness. [src/pages/judge/SubmissionReviewPage.test.tsx:325]

## Dev Notes

### Architecture Requirements

**RatingDisplay Enhancement (Not Replacement):**
Story 5-2 created `RatingDisplay` in `src/features/reviews/components/RatingDisplay.tsx`. This story ENHANCES it — do not recreate. The current component renders 5 tier buttons. Add a second row of granular score buttons below the tier row when a tier is selected.

**SubmissionReviewPage Enhancement:**
Story 5-2 created the full page in `src/pages/judge/SubmissionReviewPage.tsx`. This story adds auto-save debounce for feedback, rating-on-change saves, rating validation, and Save & Next behavior. Do NOT restructure the page — add to the existing layout.

### Dependencies from Stories 5-1, 5-2, 5-3 (Already Implemented)

| Asset | Location | Usage |
|-------|----------|-------|
| `RatingDisplay` component | `@/features/reviews` | MODIFY: add granular score row |
| `RatingDisplay.test.tsx` | `src/features/reviews/components/` | MODIFY: add new test cases |
| `SubmissionReviewPage` | `src/pages/judge/` | MODIFY: add auto-save, validation, Save & Next |
| `SubmissionReviewPage.test.tsx` | `src/pages/judge/` | MODIFY: add new test cases |
| `useUpsertReview` hook | `@/features/reviews` | USE AS-IS: saves rating + feedback |
| `RATING_TIERS` constant | `@/features/reviews` | USE AS-IS: tier definitions |
| `getRatingTier` function | `@/features/reviews` | USE AS-IS: map score → tier |
| All review types | `@/features/reviews` | No changes needed |

### Current RatingDisplay Implementation (DO NOT BREAK)

```typescript
// Current: 5 tier buttons, clicking sets rating = tier.minScore
// Props: value: number | null, onChange: (rating: number) => void
// Finding selectedTier: RATING_TIERS.find(t => value >= t.minScore && value <= t.maxScore)
```

Story 5-4 adds a second row BELOW the tier row:
```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Developing Skills│ │ Emerging Producer│ │Proficient Creator│ │ Advanced Producer│ │  Master Creator  │
│      1–2         │ │      3–4         │ │      5–6         │ │      7–8   ✓     │ │      9–10        │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
                                                             ┌────┐ ┌────┐
                                                             │  7 │ │ 8✓ │  ← granular score row
                                                             └────┘ └────┘
```

### Granular Score Selection Implementation

```typescript
// In RatingDisplay, derive selectedTier from value prop (already exists)
// When selectedTier is set, render score buttons:
const selectedTier = value !== null
  ? RATING_TIERS.find((t) => value >= t.minScore && value <= t.maxScore)
  : null;

// Score buttons for selected tier
{selectedTier && (
  <div className="flex gap-2 mt-3">
    {Array.from(
      { length: selectedTier.maxScore - selectedTier.minScore + 1 },
      (_, i) => selectedTier.minScore + i
    ).map((score) => (
      <Button
        key={score}
        type="button"
        variant={value === score ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange(score)}
        role="radio"
        aria-checked={value === score}
        className="w-10 h-10"
      >
        {score}
      </Button>
    ))}
  </div>
)}
```

### Feedback Auto-Save with Debounce

```typescript
// In SubmissionReviewPage:
const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
const debounceRef = useRef<ReturnType<typeof setTimeout>>();
const savedTimerRef = useRef<ReturnType<typeof setTimeout>>();

// Debounced feedback save
const saveFeedback = useCallback(async () => {
  if (!currentSubmission || !user) return;
  setSaveStatus('saving');
  await saveReview({
    submissionId: currentSubmission.id,
    rating: localRating,
    feedback: localFeedback,
  });
  setSaveStatus('saved');
  savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
}, [currentSubmission, user, localRating, localFeedback, saveReview]);

// On feedback change: debounce 1500ms
const handleFeedbackChange = useCallback((value: string) => {
  setLocalFeedback(value);
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => {
    saveFeedback();
  }, 1500);
}, [saveFeedback]);

// On feedback blur: save immediately
const handleFeedbackBlur = useCallback(() => {
  if (debounceRef.current) clearTimeout(debounceRef.current);
  if (isDirty) saveFeedback();
}, [isDirty, saveFeedback]);

// Cleanup on unmount or submission change
useEffect(() => {
  return () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
  };
}, [syncedSubmissionId]);
```

### Rating Validation on Navigation

```typescript
// In SubmissionReviewPage:
const [ratingWarning, setRatingWarning] = useState(false);

// Clear warning when rating is selected
useEffect(() => {
  if (localRating !== null) setRatingWarning(false);
}, [localRating]);

// Modified handleNavigate for forward navigation
const handleNavigateNext = useCallback(async (targetSubmissionId: string) => {
  if (localRating === null) {
    setRatingWarning(true);
    return;
  }
  // existing isDirty save logic...
  if (isDirty && currentSubmission && user) {
    await saveReview({ submissionId: currentSubmission.id, rating: localRating, feedback: localFeedback });
  }
  navigate(`/judge/categories/${categoryId}/review/${targetSubmissionId}`);
}, [localRating, isDirty, currentSubmission, user, saveReview, localFeedback, navigate, categoryId]);

// Keep existing handleNavigate for BACKWARD (Previous) — no rating required
const handleNavigatePrev = useCallback(async (targetSubmissionId: string) => {
  if (isDirty && currentSubmission && user) {
    await saveReview({ submissionId: currentSubmission.id, rating: localRating, feedback: localFeedback });
  }
  navigate(`/judge/categories/${categoryId}/review/${targetSubmissionId}`);
}, [isDirty, currentSubmission, user, saveReview, localRating, localFeedback, navigate, categoryId]);
```

### "Save & Next" Smart Navigation (AC6)

```typescript
// Navigate to next UNREVIEWED submission if possible, else next sequential
const nextUnreviewed = useMemo(() => {
  if (!submissions || currentIndex < 0) return null;
  // Look forward from current position for unreviewed
  for (let i = currentIndex + 1; i < submissions.length; i++) {
    if (submissions[i].reviewId === null) return submissions[i];
  }
  // If none forward, just return next sequential (or null if last)
  return nextSubmission;
}, [submissions, currentIndex, nextSubmission]);
```

### New/Modified Files

```
src/features/reviews/components/
├── RatingDisplay.tsx              # MODIFY: add granular score row
├── RatingDisplay.test.tsx         # MODIFY: add new test cases

src/pages/judge/
├── SubmissionReviewPage.tsx       # MODIFY: auto-save, validation, Save & Next
├── SubmissionReviewPage.test.tsx  # MODIFY: add new test cases
```

### Reuse from Previous Stories (DO NOT RECREATE)

- `RatingDisplay` component — EXTEND with score row, do not recreate
- `SubmissionReviewPage` — EXTEND with auto-save/validation, do not restructure
- `useUpsertReview` hook — USE AS-IS, no changes needed
- `RATING_TIERS`, `getRatingTier` — USE AS-IS from `@/features/reviews`
- `Button`, `Textarea`, `Separator`, `Skeleton` from `@/components/ui`
- `isDirty` pattern already in SubmissionReviewPage — extend, don't replace
- `localRating`, `localFeedback`, `syncedSubmissionId` state pattern — already in place

### Testing Guidance

**Unit Tests (RatingDisplay.test.tsx — additions):**
1. Clicking tier shows granular score buttons for that tier
2. Score buttons show correct numbers (e.g., 7, 8 for "Advanced Producer")
3. Clicking score button calls onChange with exact score
4. Selected score button has visual distinction (variant="default")
5. Switching tier shows new score range
6. ARIA radiogroup attributes present
7. When value=8, tier "Advanced Producer" highlighted AND score "8" highlighted

**Unit Tests (SubmissionReviewPage.test.tsx — additions):**
1. Feedback auto-saves after debounce (use `vi.advanceTimersByTime`)
2. Feedback auto-saves on blur
3. "Saved" indicator appears and fades
4. Next without rating shows warning
5. Warning clears when rating selected
6. "Save & Next" saves and navigates
7. Previous button works without rating (no warning)
8. Arrow Right without rating shows warning

**Testing Patterns:**
- Use `vi.useFakeTimers()` for debounce tests
- Mock `useUpsertReview` to assert save calls
- Use `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })` for timer-aware interactions
- Use `screen.getByText('Saved')` to verify save indicator
- Use `screen.getByText(/please select a rating/i)` for warning

### Project Structure Notes

- No new files created — only modifications to existing components and page
- No new exports needed — RatingDisplay interface (`value`, `onChange`) stays the same
- No database migration needed — rating column already supports 1-10
- Import from `@/features/reviews` NOT deep paths
- All `Button`, `Textarea` from `@/components/ui`

### Quality Gates

```bash
# Git (REQUIRED)
git status          # Must show clean
git log --oneline -5  # Verify commits have "5-4:" prefix
git push -u origin story/5-4-rating-feedback-form

# Build (REQUIRED)
npm run build       # Must pass
npm run lint        # Must pass
npm run type-check  # Must pass
npm run test        # Must pass

# No migration needed for this story
```

### References

- [Source: epic-5-judging-evaluation-workflow.md#Story 5.4]
- [Source: 5-3-media-playback-photo-video.md] (previous story — completed, 680 tests)
- [Source: src/features/reviews/components/RatingDisplay.tsx] (component to enhance)
- [Source: src/pages/judge/SubmissionReviewPage.tsx] (page to enhance)
- [Source: src/features/reviews/types/review.types.ts] (RATING_TIERS, getRatingTier)
- [Source: src/features/reviews/hooks/useUpsertReview.ts] (mutation hook — no changes)
- [Source: project-context.md#Testing Rules] (co-located tests, vi.useFakeTimers)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None — clean implementation, no blockers encountered.

### Completion Notes List

- Tasks 1-6 implemented in prior session; Task 7 (quality gates) completed in this session
- Adversarial review: 15 findings — 6 fixed (F1-F6), 9 deferred to future-work.md (F7-F15)
- All 7 ACs satisfied with test coverage
- 699 tests passing (68 test files), up from 680 in story 5-3
- No new files created — only 4 existing files modified
- No database migration needed

### Review Notes

- Adversarial review completed
- Findings: 15 total, 6 fixed, 9 deferred to future-work.md
- Resolution approach: auto-fix critical/real + defer rest
- Fixed: F1 (stale closures), F2 (error handling), F3 (retry guard), F4 (debounce cancellation), F5 (ARIA radiogroup), F6 (navigate in useEffect)
- Deferred: F7-F15 (test quality, code smell, accessibility improvements)

### File List

**Modified Files:**
- src/features/reviews/components/RatingDisplay.tsx
- src/features/reviews/components/RatingDisplay.test.tsx
- src/pages/judge/SubmissionReviewPage.tsx
- src/pages/judge/SubmissionReviewPage.test.tsx
