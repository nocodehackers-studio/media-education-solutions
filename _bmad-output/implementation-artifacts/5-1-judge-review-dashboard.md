# Story 5.1: Judge Review Dashboard

Status: in-progress

## Story

As a **Judge**,
I want **to see my review progress for each assigned category**,
So that **I know how many submissions I've reviewed and how many remain**.

## Acceptance Criteria

### AC1: Category Review Page Navigation
**Given** I am logged in as a judge
**When** I click on a category from my dashboard (the "Start Reviewing" button)
**Then** I navigate to the category review page at `/judge/categories/:categoryId`
**And** I see: category name, contest name, total submissions, my progress

### AC2: Review Progress Display
**Given** I am on the category review page
**When** I view the progress section
**Then** I see "X of Y reviewed" with a progress bar
**And** I see a list/grid of all submissions as SubmissionCard components

### AC3: Submission Card Content
**Given** I view the submission cards
**When** I look at each card
**Then** I see: participant code (NOT name), thumbnail, review status (Pending/Reviewed)
**And** reviewed submissions show my rating tier

### AC4: Progress Persistence
**Given** I have reviewed some submissions
**When** I return to the category later
**Then** my progress is preserved
**And** I can continue where I left off

### AC5: Submission Filtering
**Given** I want to filter submissions
**When** I click the filter dropdown
**Then** I can filter by: All, Pending, Reviewed

### AC6: Reviews Table Migration
**Given** the database migration runs for this story
**When** I check the schema
**Then** `reviews` table exists with: id, submission_id, judge_id, rating, feedback, created_at, updated_at
**And** RLS policies ensure judges can only see/edit their own reviews

## Tasks / Subtasks

- [x] Task 1: Create `reviews` table migration (AC6)
  - [x] 1.1 Create migration file `supabase/migrations/{timestamp}_create_reviews_table.sql`
  - [x] 1.2 Schema: `id` UUID PK, `submission_id` UUID FK → submissions(id) ON DELETE CASCADE, `judge_id` UUID FK → profiles(id) ON DELETE CASCADE, `rating` INTEGER CHECK (1-10) nullable (set during Story 5.4), `feedback` TEXT nullable, `created_at` TIMESTAMPTZ, `updated_at` TIMESTAMPTZ
  - [x] 1.3 Add UNIQUE constraint on (`submission_id`, `judge_id`) — one review per judge per submission
  - [x] 1.4 Add index on `judge_id` for efficient lookups
  - [x] 1.5 Add `updated_at` trigger (reuse existing `update_updated_at_column` function if available, or create)
  - [x] 1.6 Add RLS policies:
    - Enable RLS on reviews table
    - Judge SELECT: `auth.uid() = judge_id`
    - Judge INSERT: `auth.uid() = judge_id`
    - Judge UPDATE: `auth.uid() = judge_id`
    - Admin SELECT/INSERT/UPDATE/DELETE: `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')`
  - [x] 1.7 Run `npx supabase db push` to apply migration

- [x] Task 2: Create `get_submissions_for_review` RPC function (AC1, AC2, AC3)
  - [x] 2.1 Create migration file `supabase/migrations/{timestamp}_create_get_submissions_for_review_rpc.sql`
  - [x] 2.2 SECURITY DEFINER function with `SET search_path = public`
  - [x] 2.3 Accepts: `p_category_id UUID`
  - [x] 2.4 Validates caller is assigned judge for this category: `categories.assigned_judge_id = auth.uid()`
  - [x] 2.5 Returns TABLE with: `id`, `media_type`, `media_url`, `thumbnail_url`, `bunny_video_id`, `status`, `submitted_at`, `participant_code` (from participants.code), `review_id` (from reviews LEFT JOIN), `rating`, `feedback`
  - [x] 2.6 Only returns submissions with `status = 'submitted'` (not uploading/uploaded)
  - [x] 2.7 Orders by `submitted_at ASC`
  - [x] 2.8 CRITICAL: Only select `participants.code` — NEVER name, organization, tlc_name, tlc_email (anonymous judging)
  - [x] 2.9 Run `npx supabase db push`

- [x] Task 3: Create review types and API (AC1, AC2, AC3)
  - [x] 3.1 Create `src/features/reviews/types/review.types.ts`
  - [x] 3.2 Define `SubmissionForReview` type: `{ id, mediaType, mediaUrl, thumbnailUrl, bunnyVideoId, status, submittedAt, participantCode, reviewId, rating, feedback }`
  - [x] 3.3 Define `ReviewProgress` type: `{ total, reviewed, pending, percentage }`
  - [x] 3.4 Define `RatingTier` type with tier labels and score ranges
  - [x] 3.5 Define `SubmissionFilter` type: `'all' | 'pending' | 'reviewed'`
  - [x] 3.6 Add helper function `getRatingTier(rating: number): RatingTier` to map scores to tier labels
  - [x] 3.7 Create `src/features/reviews/api/reviewsApi.ts`
  - [x] 3.8 Implement `getSubmissionsForReview(categoryId: string)` calling `supabase.rpc('get_submissions_for_review', { p_category_id: categoryId })`
  - [x] 3.9 Transform snake_case DB response to camelCase TypeScript types
  - [x] 3.10 Export from types index and feature index

- [x] Task 4: Create `useSubmissionsForReview` hook (AC1, AC2, AC4)
  - [x] 4.1 Create `src/features/reviews/hooks/useSubmissionsForReview.ts`
  - [x] 4.2 TanStack Query hook with queryKey `['submissions-for-review', categoryId]`
  - [x] 4.3 Returns `SubmissionForReview[]` with loading/error states
  - [x] 4.4 Computes `ReviewProgress` from data (count reviewed vs total)
  - [x] 4.5 Export from hooks index and feature index
  - [x] 4.6 Create `useSubmissionsForReview.test.ts`

- [x] Task 5: Create `SubmissionCard` component (AC3)
  - [x] 5.1 Create `src/features/reviews/components/SubmissionCard.tsx`
  - [x] 5.2 Display: participant code prominently, thumbnail image (photo: `mediaUrl` scaled, video: `thumbnailUrl` or placeholder)
  - [x] 5.3 Show review status badge: "Pending" (amber) or "Reviewed" (green)
  - [x] 5.4 Reviewed cards show rating tier label and score (e.g., "Advanced Producer · 8")
  - [x] 5.5 Card is clickable — navigates to `/judge/review/:submissionId` (route placeholder for Story 5.2)
  - [x] 5.6 Show media type icon (video/photo) on the card
  - [x] 5.7 Export from components index and feature index
  - [x] 5.8 Create `SubmissionCard.test.tsx`

- [x] Task 6: Create `ReviewProgress` component (AC2)
  - [x] 6.1 Create `src/features/reviews/components/ReviewProgress.tsx`
  - [x] 6.2 Shows "X of Y reviewed" text
  - [x] 6.3 Visual progress bar (use shadcn `Progress` component if available, or Tailwind width-based)
  - [x] 6.4 Show percentage
  - [x] 6.5 Export from components index and feature index
  - [x] 6.6 Create `ReviewProgress.test.tsx`

- [x] Task 7: Create `SubmissionFilter` component (AC5)
  - [x] 7.1 Create `src/features/reviews/components/SubmissionFilter.tsx`
  - [x] 7.2 Use shadcn `Select` component with options: All, Pending, Reviewed
  - [x] 7.3 Controlled component with `value` and `onChange` props
  - [x] 7.4 Export from components index and feature index
  - [x] 7.5 Create `SubmissionFilter.test.tsx`

- [x] Task 8: Create `CategoryReviewPage` (AC1, AC2, AC3, AC4, AC5)
  - [x] 8.1 Create `src/pages/judge/CategoryReviewPage.tsx`
  - [x] 8.2 Get `categoryId` from URL params (`useParams`)
  - [x] 8.3 Fetch submissions via `useSubmissionsForReview(categoryId)`
  - [x] 8.4 Show category header: category name, contest name (from `useCategoriesByJudge` or pass via state/query)
  - [x] 8.5 Render `ReviewProgress` component
  - [x] 8.6 Render `SubmissionFilter` with local state
  - [x] 8.7 Render grid of `SubmissionCard` components (filtered by selected filter)
  - [x] 8.8 Loading skeleton state
  - [x] 8.9 Error state with retry
  - [x] 8.10 Empty state: "No submissions in this category yet"
  - [x] 8.11 Back button to navigate to `/judge/dashboard`
  - [x] 8.12 Create `CategoryReviewPage.test.tsx`

- [x] Task 9: Update router and judge dashboard (AC1)
  - [x] 9.1 Add route `/judge/categories/:categoryId` → `CategoryReviewPage` in `src/router/index.tsx`
  - [x] 9.2 Wrap with `JudgeRoute` guard and `LazyRoute` / `Suspense`
  - [x] 9.3 Update `DashboardPage.tsx`: change "Start Reviewing" button from toast to `navigate('/judge/categories/${category.id}')`
  - [x] 9.4 Fix pre-existing test failure in `DashboardPage.test.tsx` (date formatting drift — see Dev Notes)

- [x] Task 10: Set up `src/features/reviews/` feature structure
  - [x] 10.1 Create directory structure: `components/`, `hooks/`, `types/`, `api/`
  - [x] 10.2 Create `src/features/reviews/components/index.ts` exporting SubmissionCard, ReviewProgress, SubmissionFilter
  - [x] 10.3 Create `src/features/reviews/hooks/index.ts` exporting useSubmissionsForReview
  - [x] 10.4 Create `src/features/reviews/types/index.ts` exporting all types
  - [x] 10.5 Create `src/features/reviews/api/index.ts` exporting reviewsApi
  - [x] 10.6 Update `src/features/reviews/index.ts` with all exports (replace empty placeholder)

- [x] Task 11: Run quality gates
  - [x] 11.1 `npm run build` passes
  - [x] 11.2 `npm run lint` passes
  - [x] 11.3 `npm run type-check` passes
  - [x] 11.4 `npm run test` passes (target: all passing including fixed DashboardPage test)
  - [x] 11.5 Deploy migration: `npx supabase db push`
  - [x] 11.6 Manual smoke test: login as judge → dashboard → click "Start Reviewing" → category review page → see submissions with progress

### Review Follow-ups (AI)
- [ ] [AI-Review][HIGH] Add WITH CHECK admin policy on reviews to enforce admin-only writes (supabase/migrations/20260131020610_create_reviews_table.sql:43)
- [ ] [AI-Review][HIGH] Harden SECURITY DEFINER RPC auth checks for judge access (supabase/migrations/20260131020611_create_get_submissions_for_review_rpc.sql:1)
- [ ] [AI-Review][MEDIUM] Document untracked file in Dev Agent Record File List (_bmad-output/implementation-artifacts/epic-4-retrospective.md)
- [ ] [AI-Review][MEDIUM] Add aria-label to SubmissionCard button role for screen readers (src/features/reviews/components/SubmissionCard.tsx:29)
- [ ] [AI-Review][MEDIUM] Avoid double getRatingTier call for reviewed cards (src/features/reviews/components/SubmissionCard.tsx:85)
- [ ] [AI-Review][LOW] Update PROJECT_INDEX.md reviews exports to reflect current API (PROJECT_INDEX.md:15)

## Dev Notes

### Architecture Requirements

**Judge Authentication (Supabase Auth):**
Judges HAVE Supabase Auth accounts (unlike participants). They log in with email+password. Use the standard Supabase client with RLS policies — NOT Edge Functions. The `useAuth()` context provides `user.id` which matches `profiles.id` and `categories.assigned_judge_id`.

**Anonymous Judging (CRITICAL):**
Judge queries must NEVER expose participant PII. The `get_submissions_for_review` RPC function ensures only `participants.code` is returned — never name, organization_name, tlc_name, or tlc_email. Do NOT create direct Supabase queries that JOIN participants with broader column selection.

**Why RPC Function (Not Direct Query):**
A direct Supabase client query with `.select('*, participants(code)')` would work with RLS, BUT the RLS policy on participants would need to expose all columns to judges. Using a SECURITY DEFINER RPC function gives precise column control, ensuring anonymous judging at the database level. This is an intentional architectural decision.

**Single Judge Per Category:**
The current architecture assigns one judge per category via `categories.assigned_judge_id`. The `reviews` table includes `judge_id` for traceability and forward-compatibility, but the UNIQUE constraint on `(submission_id, judge_id)` combined with single-judge-per-category means effectively one review per submission.

### Rating Tiers Reference

| Tier | Label | Score Range |
|------|-------|-------------|
| 1 | Developing Skills | 1-2 |
| 2 | Emerging Producer | 3-4 |
| 3 | Proficient Creator | 5-6 |
| 4 | Advanced Producer | 7-8 |
| 5 | Master Creator | 9-10 |

These tiers are used in SubmissionCard display (Story 5.1) and will be used for the rating form in Story 5.4.

### Pre-Existing Test Failure

`src/pages/judge/DashboardPage.test.tsx` has a pre-existing failure due to date formatting drift (relative time comparison). This was noted since Story 4-7. Since we're modifying the DashboardPage in this story (navigation fix), fix this test as part of Task 9.4. The fix is likely updating the expected date string or mocking `Date.now()` consistently.

### N+1 Query Note (from Epic 3 Retrospective)

`categoriesApi.listByJudge()` currently makes individual count queries per category for submission counts. This was flagged in Epic 3 retro for fix in Epic 5. The new `get_submissions_for_review` RPC handles per-category queries efficiently. For the dashboard-level counts, consider a future optimization with a single RPC that returns categories with counts — but this is NOT required for Story 5.1. The current approach works.

### Technical Requirements

**Feature Location:** `src/features/reviews/` (NEW feature — replaces empty placeholder)

**New/Modified Files:**
```
src/features/reviews/                    # NEW feature directory (replace empty placeholder)
├── api/
│   ├── reviewsApi.ts                   # NEW: API layer calling RPC
│   └── index.ts                        # NEW: Export API
├── components/
│   ├── SubmissionCard.tsx              # NEW: Submission card for judge review
│   ├── SubmissionCard.test.tsx         # NEW: Tests
│   ├── ReviewProgress.tsx             # NEW: Progress bar component
│   ├── ReviewProgress.test.tsx        # NEW: Tests
│   ├── SubmissionFilter.tsx           # NEW: Filter dropdown
│   ├── SubmissionFilter.test.tsx      # NEW: Tests
│   └── index.ts                       # NEW: Component exports
├── hooks/
│   ├── useSubmissionsForReview.ts     # NEW: TanStack Query hook
│   ├── useSubmissionsForReview.test.ts # NEW: Tests
│   └── index.ts                       # NEW: Hook exports
├── types/
│   ├── review.types.ts                # NEW: Types and tier helpers
│   └── index.ts                       # NEW: Type exports
└── index.ts                           # MODIFY: Replace empty placeholder with all exports

src/pages/judge/
├── CategoryReviewPage.tsx             # NEW: Category review page
├── CategoryReviewPage.test.tsx        # NEW: Tests
├── DashboardPage.tsx                  # MODIFY: Fix "Start Reviewing" navigation
└── DashboardPage.test.tsx             # MODIFY: Fix pre-existing test failure

src/router/
└── index.tsx                          # MODIFY: Add /judge/categories/:categoryId route

supabase/migrations/
├── {timestamp}_create_reviews_table.sql                    # NEW: Reviews table + RLS
└── {timestamp}_create_get_submissions_for_review_rpc.sql   # NEW: RPC function
```

### Reuse from Previous Stories (DO NOT RECREATE)

**Already implemented — reuse directly:**
- `JudgeRoute` guard component (`src/router/JudgeRoute.tsx`) — wraps judge routes
- `useAuth()` from `@/contexts` — provides `user.id` for judge identity
- `useCategoriesByJudge(judgeId)` from `@/features/categories` — for category context in header
- `LazyRoute` wrapper for lazy-loaded routes
- `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Badge`, `Button`, `Skeleton` from `@/components/ui`
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` from `@/components/ui` (for filter)
- `Progress` from `@/components/ui` (if available — check, otherwise use Tailwind)
- Loading skeleton pattern from `DashboardPage.tsx`
- Error state pattern with retry button from `DashboardPage.tsx`
- `toast` from sonner for notifications

**From Epic 4 (Component Reuse for Story 5.3):**
- `PhotoLightbox` from `@/features/submissions` — will be reused in Story 5.3 for judge photo review
- Bunny Stream iframe embed pattern — will be reused in Story 5.3 for judge video playback
- Note: Story 5.1 only needs thumbnails, not full media playback

### RPC Function Implementation

```sql
-- supabase/migrations/{timestamp}_create_get_submissions_for_review_rpc.sql

CREATE OR REPLACE FUNCTION public.get_submissions_for_review(p_category_id UUID)
RETURNS TABLE (
  id UUID,
  media_type TEXT,
  media_url TEXT,
  thumbnail_url TEXT,
  bunny_video_id TEXT,
  status TEXT,
  submitted_at TIMESTAMPTZ,
  participant_code TEXT,
  review_id UUID,
  rating INTEGER,
  feedback TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verify the current user is the assigned judge for this category
  IF NOT EXISTS (
    SELECT 1 FROM public.categories
    WHERE categories.id = p_category_id
    AND categories.assigned_judge_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized for this category';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.media_type,
    s.media_url,
    s.thumbnail_url,
    s.bunny_video_id,
    s.status,
    s.submitted_at,
    p.code AS participant_code,
    r.id AS review_id,
    r.rating,
    r.feedback
  FROM public.submissions s
  JOIN public.participants p ON p.id = s.participant_id
  LEFT JOIN public.reviews r ON r.submission_id = s.id AND r.judge_id = auth.uid()
  WHERE s.category_id = p_category_id
  AND s.status = 'submitted'
  ORDER BY s.submitted_at ASC;
END;
$$;
```

### Reviews Table Migration

```sql
-- supabase/migrations/{timestamp}_create_reviews_table.sql

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(submission_id, judge_id)
);

-- Index for efficient judge lookups
CREATE INDEX idx_reviews_judge_id ON public.reviews(judge_id);
CREATE INDEX idx_reviews_submission_id ON public.reviews(submission_id);

-- Auto-update updated_at timestamp
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- NOTE: If update_updated_at_column() doesn't exist, create it:
-- CREATE OR REPLACE FUNCTION public.update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = now();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Judge policies: can manage own reviews only
CREATE POLICY "Judges can view own reviews"
  ON public.reviews FOR SELECT
  USING (auth.uid() = judge_id);

CREATE POLICY "Judges can create own reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = judge_id);

CREATE POLICY "Judges can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = judge_id)
  WITH CHECK (auth.uid() = judge_id);

-- Admin policies: full access
CREATE POLICY "Admins have full access to reviews"
  ON public.reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

### SubmissionCard Thumbnail Strategy

- **Photo submissions:** Use `mediaUrl` (direct Bunny CDN URL) with `object-cover` and a fixed card size. The CDN URL is publicly accessible.
- **Video submissions:** Use `thumbnailUrl` if available (Bunny Stream auto-generates thumbnails). If `thumbnailUrl` is null (video still processing), show a video placeholder icon.
- **Card dimensions:** Use consistent card sizing (e.g., `w-full aspect-video` for the thumbnail area) to maintain grid alignment.

### CategoryReviewPage Category Context

The page needs category name and contest name for the header. Two approaches:
1. **Recommended:** Fetch from `useCategoriesByJudge(user?.id)` which is already cached by TanStack Query from the dashboard, then find the matching category by ID. No extra API call.
2. **Alternative:** Pass category name via React Router state when navigating from dashboard. But this breaks when page is accessed directly via URL.

Use approach 1 — it leverages the existing cached data.

### Testing Guidance

**Unit Tests (SubmissionCard.test.tsx):**
1. Renders participant code prominently
2. Shows thumbnail for photo submission
3. Shows thumbnail for video submission (uses thumbnailUrl)
4. Shows placeholder when thumbnailUrl is null
5. Shows "Pending" badge when no review
6. Shows "Reviewed" badge with tier when review exists
7. Card is clickable and navigates to review route

**Unit Tests (ReviewProgress.test.tsx):**
1. Shows "0 of 5 reviewed" for no reviews
2. Shows "3 of 5 reviewed" with correct percentage
3. Shows "5 of 5 reviewed" for complete
4. Progress bar renders at correct width

**Unit Tests (SubmissionFilter.test.tsx):**
1. Renders with default "All" selected
2. Shows dropdown with three options
3. Calls onChange when option selected

**Unit Tests (CategoryReviewPage.test.tsx):**
1. Shows loading skeleton while fetching
2. Displays category header with name and contest
3. Shows progress bar with correct counts
4. Renders submission cards in grid
5. Filter "Pending" shows only unreviewed submissions
6. Filter "Reviewed" shows only reviewed submissions
7. Empty state when no submissions
8. Error state with retry button
9. Back button navigates to dashboard

**Unit Tests (useSubmissionsForReview.test.ts):**
1. Calls RPC with correct category ID
2. Transforms snake_case response to camelCase
3. Computes review progress correctly
4. Returns loading/error states

### Project Structure Notes

- ALL new files go in `src/features/reviews/` — this is a NEW feature
- Replace the empty placeholder `src/features/reviews/index.ts` with proper exports
- MUST update feature index after creating each file
- Import from `@/features/reviews` NOT deep paths
- Import from `@/components/ui` for shadcn components
- Import from `@/contexts` for `useAuth`
- Import from `@/features/categories` for `useCategoriesByJudge`
- Page goes in `src/pages/judge/` following existing pattern

### Quality Gates

```bash
# Git (REQUIRED)
git status          # Must show clean
git log --oneline -5  # Verify commits have "5-1:" prefix
git push -u origin story/5-1-judge-review-dashboard

# Build (REQUIRED)
npm run build       # Must pass
npm run lint        # Must pass
npm run type-check  # Must pass
npm run test        # Must pass (ALL tests including fixed DashboardPage)

# Migration (REQUIRED)
npx supabase db push  # Apply reviews table + RPC function
npx supabase migration list  # Verify migrations applied
```

### References

- [Source: epic-5-judging-evaluation-workflow.md#Story 5.1]
- [Source: project-context.md#Anonymous Judging Rules]
- [Source: project-context.md#Supabase Security Rules]
- [Source: core-architectural-decisions.md#Data Architecture - reviews table]
- [Source: core-architectural-decisions.md#Data Architecture - rankings table]
- [Source: 4-7-edit-replace-withdraw-submission.md] (previous story intelligence)
- [Source: src/pages/judge/DashboardPage.tsx] (existing judge dashboard to extend)
- [Source: src/features/categories/hooks/useCategoriesByJudge.ts] (cached category data)
- [Source: src/features/submissions/types/submission.types.ts] (submission types reference)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Type error: Supabase generated types don't include new RPC — fixed with @ts-expect-error
- ReviewProgress test: Radix Progress doesn't expose aria-valuenow in jsdom — simplified assertion

### Completion Notes List

- All 11 tasks complete, all 6 ACs satisfied
- 624/624 tests passing (58 new tests in 7 files)
- Pre-existing DashboardPage test failure fixed (date drift + toast→navigation)
- Build, lint, type-check all pass clean

## Review Notes

- Adversarial review completed: 15 findings total
- 8 fixed (F1, F2, F3, F4, F5, F7, F14, F15), 7 skipped (noise/not-applicable)
- Resolution approach: auto-fix
- Key fixes: RPC GRANT/REVOKE hardening, null guard on API data, auth error distinction, img lazy loading, error state navigation, getRatingTier safety, type hack improvement, edge case tests

### File List
