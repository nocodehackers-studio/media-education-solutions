# Story 5.2: Anonymous Submission View

Status: done

## Story

As a **Judge**,
I want **to view submissions anonymously without seeing participant details**,
So that **I can evaluate fairly without bias**.

## Acceptance Criteria

### AC1: Submission Review Page
**Given** I click on a submission to review (from CategoryReviewPage)
**When** the review page loads
**Then** I see the participant code prominently displayed
**And** I do NOT see: participant name, school, teacher name, or any PII

### AC2: Review Page Layout
**Given** I am reviewing a submission
**When** I look at the interface
**Then** I see: media viewer, rating scale, feedback textarea, navigation buttons

### AC3: Previous/Next Navigation
**Given** I want to navigate between submissions
**When** I click "Previous" or "Next"
**Then** I move to the adjacent submission in the list
**And** my current work is auto-saved before navigating

### AC4: First Submission Boundary
**Given** I am on the first submission
**When** I view the navigation
**Then** the "Previous" button is disabled

### AC5: Last Submission Boundary
**Given** I am on the last submission
**When** I view the navigation
**Then** the "Next" button is disabled
**And** I see "You've reached the last submission"

### AC6: Keyboard Navigation
**Given** I use keyboard navigation
**When** I press left/right arrow keys
**Then** I navigate to previous/next submission (when not focused on textarea)

## Tasks / Subtasks

- [ ] Task 1: Update route pattern for submission review (AC1)
  - [ ] 1.1 Add route `/judge/categories/:categoryId/review/:submissionId` → `SubmissionReviewPage` in `src/router/index.tsx`
  - [ ] 1.2 Wrap with `JudgeRoute` guard and `Suspense`
  - [ ] 1.3 Update `SubmissionCard` in `src/features/reviews/components/SubmissionCard.tsx`: change navigation from `/judge/review/:submissionId` to `/judge/categories/${categoryId}/review/${submissionId}` — requires adding `categoryId` prop
  - [ ] 1.4 Update `CategoryReviewPage` to pass `categoryId` to `SubmissionCard` components
  - [ ] 1.5 Update SubmissionCard tests for new navigation pattern

- [ ] Task 2: Create `useUpsertReview` hook (AC3)
  - [ ] 2.1 Create `src/features/reviews/hooks/useUpsertReview.ts`
  - [ ] 2.2 `useMutation` that upserts to `reviews` table via Supabase client (RLS handles auth)
  - [ ] 2.3 Upsert on `(submission_id, judge_id)` conflict — uses `supabase.from('reviews').upsert({...}, { onConflict: 'submission_id,judge_id' })`
  - [ ] 2.4 Accepts `{ submissionId, rating?, feedback? }` — both optional (can save partial)
  - [ ] 2.5 On success: invalidate `['submissions-for-review', categoryId]` query to update progress
  - [ ] 2.6 Returns `{ mutateAsync: saveReview, isPending }` for auto-save
  - [ ] 2.7 Export from hooks index and feature index
  - [ ] 2.8 Create `useUpsertReview.test.ts`

- [ ] Task 3: Create `MediaViewer` component (AC2)
  - [ ] 3.1 Create `src/features/reviews/components/MediaViewer.tsx`
  - [ ] 3.2 **Photo:** Display `<img>` with `mediaUrl` CDN URL, `object-contain`, max-height constraint, `alt="Submission by {participantCode}"`
  - [ ] 3.3 **Video:** Display Bunny Stream iframe embed: `https://iframe.mediadelivery.net/embed/{libraryId}/{bunnyVideoId}?autoplay=false&preload=true`
  - [ ] 3.4 Show placeholder with media type icon when media URL is null/loading
  - [ ] 3.5 Responsive: fills available width, maintains aspect ratio
  - [ ] 3.6 NOTE: Story 5.3 will enhance with fullscreen, zoom, and advanced controls. Keep this component extensible — accept optional props for future enhancements
  - [ ] 3.7 Export from components index and feature index
  - [ ] 3.8 Create `MediaViewer.test.tsx`

- [ ] Task 4: Create basic `RatingDisplay` component (AC2)
  - [ ] 4.1 Create `src/features/reviews/components/RatingDisplay.tsx`
  - [ ] 4.2 Show the 5 rating tiers as clickable cards/buttons in a horizontal or vertical layout
  - [ ] 4.3 Each tier shows: tier number, label ("Developing Skills" etc.), score range ("1-2")
  - [ ] 4.4 Highlight selected tier if a rating exists
  - [ ] 4.5 On tier click: set rating to the lower bound of that tier's range (e.g., click "Advanced Producer" → rating = 7)
  - [ ] 4.6 NOTE: Story 5.4 will add granular score selection within tiers and full interaction. Keep component extensible.
  - [ ] 4.7 Accept `value`, `onChange` props (controlled component)
  - [ ] 4.8 Export from components index and feature index
  - [ ] 4.9 Create `RatingDisplay.test.tsx`

- [ ] Task 5: Create `SubmissionReviewPage` (AC1, AC2, AC3, AC4, AC5)
  - [ ] 5.1 Create `src/pages/judge/SubmissionReviewPage.tsx`
  - [ ] 5.2 Get `categoryId` and `submissionId` from URL params (`useParams`)
  - [ ] 5.3 Fetch submissions via `useSubmissionsForReview(categoryId)` — already cached from CategoryReviewPage
  - [ ] 5.4 Find current submission in list by `submissionId`
  - [ ] 5.5 Compute `prevSubmission` and `nextSubmission` from ordered list
  - [ ] 5.6 Compute "Submission X of Y" counter
  - [ ] 5.7 Layout sections:
    - Header: participant code, "Submission X of Y", back to category link
    - Media viewer: `MediaViewer` component
    - Rating: `RatingDisplay` component
    - Feedback: `Textarea` from shadcn/ui with placeholder "Provide constructive feedback for the participant... (optional)"
    - Navigation: Previous / Next buttons
  - [ ] 5.8 Local state for rating and feedback (initialize from existing review if present)
  - [ ] 5.9 Track dirty state: `isDirty` = local state differs from saved review
  - [ ] 5.10 **Auto-save on navigate:** Before navigating prev/next, if `isDirty`, call `saveReview()` then navigate
  - [ ] 5.11 Previous button: disabled when on first submission (AC4)
  - [ ] 5.12 Next button: disabled when on last submission, show "You've reached the last submission" (AC5)
  - [ ] 5.13 Loading state with skeleton
  - [ ] 5.14 Handle submission not found (redirect to category page)
  - [ ] 5.15 Create `SubmissionReviewPage.test.tsx`

- [ ] Task 6: Implement keyboard navigation (AC6)
  - [ ] 6.1 Add `useEffect` with `keydown` event listener in `SubmissionReviewPage`
  - [ ] 6.2 Left arrow: navigate to previous submission (if not first, and not focused on textarea/input)
  - [ ] 6.3 Right arrow: navigate to next submission (if not last, and not focused on textarea/input)
  - [ ] 6.4 Check `document.activeElement` tag name — skip navigation when focused on `TEXTAREA`, `INPUT`, or `SELECT`
  - [ ] 6.5 Auto-save before keyboard navigation (same as button navigation)
  - [ ] 6.6 Add keyboard navigation tests

- [ ] Task 7: Get Bunny Stream library ID for video embed (AC2)
  - [ ] 7.1 The video embed URL requires `libraryId` — check how Story 5.1 handles this
  - [ ] 7.2 Option A: Add `libraryId` to `get_submissions_for_review` RPC return (if not already there)
  - [ ] 7.3 Option B: Use environment variable `VITE_BUNNY_STREAM_LIBRARY_ID` on client side (library ID is NOT a secret — it's used in public iframe URLs)
  - [ ] 7.4 Option C: Store `libraryId` in submissions table or derive from `bunny_video_id`
  - [ ] 7.5 Choose simplest approach — `VITE_BUNNY_STREAM_LIBRARY_ID` env var is likely already configured from Epic 4 participant video embed

- [ ] Task 8: Update feature exports
  - [ ] 8.1 Update `src/features/reviews/components/index.ts` with MediaViewer, RatingDisplay
  - [ ] 8.2 Update `src/features/reviews/hooks/index.ts` with useUpsertReview
  - [ ] 8.3 Update `src/features/reviews/index.ts` with all new exports

- [ ] Task 9: Run quality gates
  - [ ] 9.1 `npm run build` passes
  - [ ] 9.2 `npm run lint` passes
  - [ ] 9.3 `npm run type-check` passes
  - [ ] 9.4 `npm run test` passes (all existing + new tests)
  - [ ] 9.5 Manual smoke test: CategoryReviewPage → click submission card → review page loads → see media, rating, feedback, nav buttons → navigate prev/next → auto-save works → keyboard nav works

### Review Follow-ups (AI)
- [ ] [AI-Review][HIGH] Add error state for submissions fetch (avoid redirect on network/RPC errors) [src/pages/judge/SubmissionReviewPage.tsx:29]
- [ ] [AI-Review][MEDIUM] Move local state sync and redirect to useEffect to avoid render side effects [src/pages/judge/SubmissionReviewPage.tsx:51]
- [ ] [AI-Review][MEDIUM] Add Bunny Stream embed fallback when mediaUrl is null but bunnyVideoId exists (use VITE_BUNNY_STREAM_LIBRARY_ID) [src/features/reviews/components/MediaViewer.tsx:7]
- [ ] [AI-Review][MEDIUM] Disable keyboard nav while save mutation is pending to avoid overlapping saves [src/pages/judge/SubmissionReviewPage.tsx:82]
- [ ] [AI-Review][MEDIUM] Populate Dev Agent Record File List from git (currently empty) [_bmad-output/implementation-artifacts/5-2-anonymous-submission-view.md:410]
- [ ] [AI-Review][LOW] Add aria-pressed or radio semantics for selected rating tier buttons [src/features/reviews/components/RatingDisplay.tsx:23]

## Dev Notes

### Architecture Requirements

**Anonymous Judging (CRITICAL):**
This story's core purpose is anonymous review. The page MUST only display `participantCode` — never name, organization, tlc_name, or tlc_email. All data comes from the `get_submissions_for_review` RPC which enforces this at the database level. Do NOT create any additional queries that join participant PII.

**Judge Authentication:**
Judges are Supabase Auth users. Use standard Supabase client with RLS. The `reviews` table RLS (created in 5-1) allows judges to INSERT/UPDATE their own reviews. Use `supabase.from('reviews').upsert(...)` directly — no Edge Function needed.

**Review Upsert Pattern:**
```typescript
// Direct Supabase upsert with RLS
const { data, error } = await supabase
  .from('reviews')
  .upsert({
    submission_id: submissionId,
    judge_id: user.id,      // from useAuth()
    rating: rating || null,  // nullable until Story 5.4 full interaction
    feedback: feedback || null,
  }, {
    onConflict: 'submission_id,judge_id',
  })
  .select()
  .single();
```

### Dependencies from Story 5.1 (Already Implemented)

All of these exist and are ready to use — DO NOT RECREATE:

| Asset | Location | Usage |
|-------|----------|-------|
| `reviews` table | DB (migration applied) | Upsert reviews via RLS |
| `get_submissions_for_review` RPC | DB (migration applied) | Fetch submissions with review status |
| `useSubmissionsForReview` hook | `@/features/reviews` | Get ordered submission list + progress |
| `SubmissionForReview` type | `@/features/reviews` | Type for submission data |
| `ReviewProgress` type | `@/features/reviews` | Progress tracking |
| `getRatingTier()` helper | `@/features/reviews` | Map rating to tier label |
| `RatingTier` type | `@/features/reviews` | Tier definitions |
| `SubmissionCard` component | `@/features/reviews` | Cards on category page (will modify nav) |
| `CategoryReviewPage` | `src/pages/judge/` | Parent page (will modify card props) |
| `reviewsApi` | `@/features/reviews` | API layer |
| 624 passing tests | — | Baseline to preserve |

### Route Pattern Decision

**Use:** `/judge/categories/:categoryId/review/:submissionId`

This embeds `categoryId` in the URL so the review page can:
1. Fetch the full submission list via `useSubmissionsForReview(categoryId)` for prev/next navigation
2. Work when accessed directly via URL (not just from CategoryReviewPage)
3. Provide a back link to the correct category page

**Required change to Story 5.1 code:** Update `SubmissionCard` to accept `categoryId` prop and use the new URL pattern. This is a minor breaking change to 5.1's navigation but necessary for correct prev/next functionality.

### Auto-Save Implementation

```typescript
const handleNavigate = async (targetSubmissionId: string) => {
  if (isDirty) {
    await saveReview({
      submissionId: currentSubmission.id,
      rating: localRating,
      feedback: localFeedback,
    });
  }
  navigate(`/judge/categories/${categoryId}/review/${targetSubmissionId}`);
};
```

**isDirty computation:**
```typescript
const isDirty = useMemo(() => {
  const savedRating = currentSubmission?.rating ?? null;
  const savedFeedback = currentSubmission?.feedback ?? '';
  return localRating !== savedRating || localFeedback !== savedFeedback;
}, [localRating, localFeedback, currentSubmission]);
```

### Keyboard Navigation Implementation

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Skip when focused on form elements
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return;

    if (e.key === 'ArrowLeft' && prevSubmission) {
      e.preventDefault();
      handleNavigate(prevSubmission.id);
    } else if (e.key === 'ArrowRight' && nextSubmission) {
      e.preventDefault();
      handleNavigate(nextSubmission.id);
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [prevSubmission, nextSubmission, handleNavigate]);
```

### Bunny Stream Video Embed

Video submissions use Bunny Stream iframe embeds. The embed URL pattern:
```
https://iframe.mediadelivery.net/embed/{libraryId}/{bunnyVideoId}?autoplay=false&preload=true
```

The `libraryId` is needed. Check if `VITE_BUNNY_STREAM_LIBRARY_ID` environment variable already exists from Epic 4 (Story 4-6 SubmissionPreview used Bunny Stream iframe). If so, reuse the same pattern. The library ID is NOT a secret — it's used in public-facing iframe URLs.

If Epic 4 used a different approach (e.g., getting `libraryId` from the Edge Function response), follow that same pattern for consistency.

### MediaViewer Component

**Photo display:**
```tsx
<img
  src={mediaUrl}
  alt={`Submission by ${participantCode}`}
  className="max-h-[500px] w-full object-contain rounded-lg"
  loading="lazy"
/>
```

**Video display:**
```tsx
<iframe
  src={`https://iframe.mediadelivery.net/embed/${libraryId}/${bunnyVideoId}?autoplay=false&preload=true`}
  className="w-full aspect-video rounded-lg"
  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
  allowFullScreen
  title={`Video submission by ${participantCode}`}
/>
```

Story 5.3 will enhance this with: fullscreen toggle, zoom for photos, advanced video controls, keyboard shortcuts within the viewer.

### RatingDisplay Component (Basic for 5.2)

Show the 5 tiers as selectable options. When clicked, set rating to the tier's lower bound. Story 5.4 will add granular score selection within tiers.

```tsx
const RATING_TIERS = [
  { tier: 1, label: 'Developing Skills', range: [1, 2] },
  { tier: 2, label: 'Emerging Producer', range: [3, 4] },
  { tier: 3, label: 'Proficient Creator', range: [5, 6] },
  { tier: 4, label: 'Advanced Producer', range: [7, 8] },
  { tier: 5, label: 'Master Creator', range: [9, 10] },
];
```

Each tier renders as a card/button:
- Unselected: outline style
- Selected: solid/highlighted with tier color
- Shows: tier label + score range

### Page Layout Structure

```
┌─────────────────────────────────────────┐
│ ← Back to Category    Submission 3 of 8 │
│ Participant Code: ABC12345              │
├─────────────────────────────────────────┤
│                                         │
│           [ Media Viewer ]              │
│           (photo or video)              │
│                                         │
├─────────────────────────────────────────┤
│ Rating:                                 │
│ [Developing] [Emerging] [Proficient]    │
│ [Advanced]   [Master]                   │
├─────────────────────────────────────────┤
│ Feedback:                               │
│ ┌─────────────────────────────────────┐ │
│ │ Provide constructive feedback...    │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ [← Previous]              [Next →]      │
│              "You've reached the last   │
│               submission" (if last)     │
└─────────────────────────────────────────┘
```

### Testing Guidance

**Unit Tests (SubmissionReviewPage.test.tsx):**
1. Renders participant code (NOT name or PII)
2. Shows "Submission X of Y" counter
3. Displays MediaViewer with correct media type
4. Shows RatingDisplay component
5. Shows feedback Textarea
6. Previous button disabled on first submission (AC4)
7. Next button disabled on last submission (AC5)
8. Shows "You've reached the last submission" message on last (AC5)
9. Clicking Next navigates to next submission URL
10. Clicking Previous navigates to previous submission URL
11. Auto-save called before navigation when dirty
12. Auto-save NOT called when not dirty
13. Back link navigates to category page
14. Loading skeleton shown while fetching
15. Handles submission not found

**Unit Tests (useUpsertReview.test.ts):**
1. Calls supabase.from('reviews').upsert with correct params
2. Includes judge_id from auth context
3. Invalidates submissions-for-review query on success
4. Returns isPending state correctly

**Unit Tests (MediaViewer.test.tsx):**
1. Renders img tag for photo submissions
2. Renders iframe for video submissions
3. Shows placeholder when no media URL
4. Photo alt text includes participant code
5. Video iframe has correct Bunny Stream URL

**Unit Tests (RatingDisplay.test.tsx):**
1. Renders all 5 tier options
2. Highlights selected tier
3. Calls onChange with tier's lower bound on click
4. Shows tier labels and score ranges

**Keyboard Navigation Tests:**
1. Right arrow navigates to next submission
2. Left arrow navigates to previous submission
3. Arrow keys ignored when textarea focused
4. Arrow keys ignored when on first/last submission

### Project Structure Notes

- New files go in `src/features/reviews/` (extending 5-1's structure)
- New page at `src/pages/judge/SubmissionReviewPage.tsx`
- Import from `@/features/reviews` NOT deep paths
- Import `Textarea`, `Separator`, `Button` from `@/components/ui`
- Import `useAuth` from `@/contexts`
- MUST update feature index after creating each file

### Quality Gates

```bash
# Git (REQUIRED)
git status          # Must show clean
git log --oneline -5  # Verify commits have "5-2:" prefix
git push -u origin story/5-2-anonymous-submission-view

# Build (REQUIRED)
npm run build       # Must pass
npm run lint        # Must pass
npm run type-check  # Must pass
npm run test        # Must pass (all 624+ existing tests + new tests)

# No migration needed for this story (reviews table created in 5-1)
```

### References

- [Source: epic-5-judging-evaluation-workflow.md#Story 5.2]
- [Source: project-context.md#Anonymous Judging Rules]
- [Source: 5-1-judge-review-dashboard.md] (previous story — reviews table, RPC, types, components)
- [Source: src/features/reviews/] (existing feature structure from 5-1)
- [Source: src/features/submissions/components/SubmissionPreview.tsx] (Bunny iframe pattern reference)
- [Source: src/pages/participant/SubmissionPreviewPage.tsx] (media display pattern reference)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
