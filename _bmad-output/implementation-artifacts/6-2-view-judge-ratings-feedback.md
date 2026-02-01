# Story 6.2: View Judge Ratings & Feedback

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Super Admin**,
I want **to view all judge ratings and feedback for any submission**,
so that **I can ensure fair and quality judging**.

## Acceptance Criteria

1. **Given** I am viewing a submission detail (AdminSubmissionDetail Sheet) **When** I look at the judging section **Then** I see the assigned judge's review (if reviewed).

2. **Given** the submission has been reviewed **When** I view the review section **Then** I see:

   | Field | Value |
   |-------|-------|
   | Judge Name | `profiles.first_name` + `profiles.last_name` (via `reviews.judge_id`) |
   | Rating Tier | Developing Skills / Emerging Producer / Proficient Creator / Advanced Producer / Master Creator |
   | Rating Score | 1-10 |
   | Written Feedback | Text (or "No feedback provided") |
   | Reviewed At | `reviews.updated_at` |

3. **Given** the submission has NOT been reviewed **When** I view the review section **Then** I see "Pending Review" with the assigned judge's name (from `categories.assigned_judge_id` -> `profiles`).

4. **Given** I am on the submissions table (AdminSubmissionsTable) **When** I view the table **Then** I see additional columns: Rating (score), Feedback Preview (truncated), Ranking Position (1st/2nd/3rd or "—") **And** ratings are sortable (highest to lowest).

5. **Given** I want to compare submissions **When** I select multiple submissions **Then** I can view them side-by-side with their ratings. (**DEFERRED** — side-by-side comparison is a significant UX addition. Add to `future-work.md` as Epic 6 enhancement. Story 6.2 focuses on individual and table-level rating visibility.)

## Tasks / Subtasks

- [x] Task 1: Extend admin submission types with review/ranking data (AC: #2, #3, #4)
  - [x] 1.1 Add `AdminSubmissionReview` interface to `src/features/submissions/types/adminSubmission.types.ts` with fields: `reviewId`, `judgeId`, `judgeName`, `rating`, `ratingTier`, `feedback`, `reviewedAt`
  - [x] 1.2 Add `AdminSubmissionRanking` interface: `rankingPosition` (1 | 2 | 3 | null)
  - [x] 1.3 Extend `AdminSubmission` interface with optional `review?: AdminSubmissionReview | null` and `rankingPosition?: number | null`
  - [x] 1.4 Extend `AdminSubmissionRow` interface to include nested `reviews` and `rankings` from Supabase join
  - [x] 1.5 Update `transformAdminSubmission()` to map review + ranking data
  - [x] 1.6 Export new types from `src/features/submissions/index.ts`

- [x] Task 2: Update admin submissions API to join reviews + rankings (AC: #1, #2, #3, #4)
  - [x] 2.1 Update `adminSubmissionsApi.getContestSubmissions()` Supabase select to include: `reviews(id, judge_id, rating, feedback, updated_at, profiles:judge_id(first_name, last_name))` and `rankings(rank)`
  - [x] 2.2 Also include `categories.assigned_judge_id` and nested `profiles:assigned_judge_id(first_name, last_name)` for pending review judge name
  - [x] 2.3 Use LEFT JOIN (no `!inner`) for reviews and rankings since not all submissions have them
  - [x] 2.4 Update `AdminSubmissionRow` type to match new query shape

- [x] Task 3: Create AdminReviewSection component (AC: #1, #2, #3)
  - [x] 3.1 Create `src/features/submissions/components/AdminReviewSection.tsx`
  - [x] 3.2 Props: `review: AdminSubmissionReview | null`, `assignedJudgeName: string | null`
  - [x] 3.3 If reviewed: show judge name, rating tier + score using `getRatingTier()` from reviews feature, feedback text, reviewed date
  - [x] 3.4 If NOT reviewed: show "Pending Review" with assigned judge name (or "No judge assigned" if null)
  - [x] 3.5 Use same `dl` grid layout pattern as existing sections in AdminSubmissionDetail
  - [x] 3.6 Import `getRatingTier` from `@/features/reviews` for tier label display
  - [x] 3.7 Export from `src/features/submissions/components/index.ts`

- [x] Task 4: Add review section to AdminSubmissionDetail (AC: #1, #2, #3)
  - [x] 4.1 Update `src/features/submissions/components/AdminSubmissionDetail.tsx`
  - [x] 4.2 Add new "Judge Review" section between Submission Metadata and Media Preview sections
  - [x] 4.3 Render `AdminReviewSection` with review data from `submission.review` and assigned judge name
  - [x] 4.4 If submission has ranking position, show it in the review section

- [x] Task 5: Add rating/ranking columns to AdminSubmissionsTable (AC: #4)
  - [x] 5.1 Update `src/features/submissions/components/AdminSubmissionsTable.tsx`
  - [x] 5.2 Add "Rating" column after Status — display score (e.g., "7/10") or "—" if unreviewed
  - [x] 5.3 Add "Rank" column — display "1st", "2nd", "3rd" or "—"
  - [x] 5.4 Add sorting support: `sortField` and `sortDirection` state, clickable column headers
  - [x] 5.5 Default sort: by `submittedAt` descending (current behavior), with rating as secondary sort option
  - [x] 5.6 Both new columns hidden on mobile (`hidden sm:table-cell`)

- [x] Task 6: Pass assigned judge info through API (AC: #3)
  - [x] 6.1 Add `assignedJudgeName: string | null` to `AdminSubmission` interface
  - [x] 6.2 Update `AdminSubmissionRow` to include `categories.profiles` for assigned judge
  - [x] 6.3 Update `transformAdminSubmission()` to build judge name from `first_name` + `last_name`

- [x] Task 7: Update feature exports
  - [x] 7.1 Update `src/features/submissions/components/index.ts` — add `AdminReviewSection`
  - [x] 7.2 Update `src/features/submissions/index.ts` — add new type exports
  - [x] 7.3 Update `PROJECT_INDEX.md` with new component

- [x] Task 8: Unit tests
  - [x] 8.1 `src/features/submissions/components/AdminReviewSection.test.tsx` — reviewed state (all fields displayed), pending state, no judge assigned state
  - [x] 8.2 `src/features/submissions/components/AdminSubmissionDetail.test.tsx` — update existing tests to verify review section renders
  - [x] 8.3 `src/features/submissions/components/AdminSubmissionsTable.test.tsx` — update to verify rating/rank columns, sorting behavior
  - [x] 8.4 `src/features/submissions/hooks/useAdminSubmissions.test.ts` — verify query includes review/ranking data

### Review Follow-ups (AI)
- [ ] [AI-Review][HIGH] Add Feedback Preview (truncated) column to AdminSubmissionsTable and render preview from `review.feedback` (show "No feedback" or "—" when empty) to satisfy AC #4.
- [ ] [AI-Review][MEDIUM] Add coverage that verifies the admin submissions query includes review + ranking joins (current hook tests mock the API and do not assert query shape).
- [ ] [AI-Review][MEDIUM] Generate and paste the Dev Agent Record → File List from `git status` (section currently empty).

## Dev Notes

### Architecture Decisions

- **Extend existing AdminSubmission, NOT separate query:** The review + ranking data should be fetched in the SAME query as the submission list (via Supabase joins). Do NOT create a separate API call for review data. This keeps the table and detail view in sync with a single query/cache entry.
- **Direct Supabase queries (NOT RPC):** Admin has full RLS access on all tables via `is_admin()` policy. Use direct `.from('submissions').select(...)` with joins. Do NOT use `get_submissions_for_review` RPC — that's judge-only and strips PII.
- **Reuse `getRatingTier()` from reviews feature:** Import from `@/features/reviews` for tier label mapping. Do NOT duplicate the tier logic.
- **Sorting is client-side:** With the current data being fetched per-contest (not paginated), sorting by rating can be done client-side in the table component. No server-side sorting needed.
- **Side-by-side comparison deferred:** AC #5 (multi-select comparison) is deferred to `future-work.md`. This story focuses on individual review visibility in the detail panel and summary data in the table.

### Database Schema Reference

**`reviews` table columns (relevant):**
```
id UUID PK, submission_id UUID FK (UNIQUE with judge_id),
judge_id UUID FK -> profiles(id),
rating INTEGER (1-10), feedback TEXT,
created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
```

**`rankings` table columns (relevant):**
```
id UUID PK, category_id UUID FK, judge_id UUID FK,
rank INTEGER (1-3), submission_id UUID FK,
UNIQUE(category_id, judge_id, rank),
UNIQUE(category_id, judge_id, submission_id)
```

**`profiles` table columns (for judge name):**
```
id UUID PK, email TEXT, role TEXT ('admin'|'judge'),
first_name TEXT (nullable), last_name TEXT (nullable)
```

**`categories` table (for assigned judge):**
```
assigned_judge_id UUID FK -> profiles(id) ON DELETE SET NULL
```

### Query Pattern

```typescript
// Updated admin submissions query - extends Story 6.1 query with review + ranking joins
const { data, error } = await supabase
  .from('submissions')
  .select(`
    id, media_type, media_url, bunny_video_id, thumbnail_url,
    status, submitted_at, created_at,
    participants!inner(id, code, name, organization_name, tlc_name, tlc_email),
    categories!inner(
      id, name, type, assigned_judge_id,
      divisions!inner(contest_id),
      assigned_judge:profiles!assigned_judge_id(first_name, last_name)
    ),
    reviews(id, judge_id, rating, feedback, updated_at,
      judge:profiles!judge_id(first_name, last_name)
    ),
    rankings(rank)
  `)
  .eq('categories.divisions.contest_id', contestId)
  .order('submitted_at', { ascending: false });
```

**Key points:**
- `reviews` and `rankings` use LEFT JOIN (no `!inner`) — not all submissions have reviews/rankings
- `reviews` joins to `profiles` via `judge_id` to get judge name
- `categories` joins to `profiles` via `assigned_judge_id` to get assigned judge name for "Pending Review" display
- A submission has at most ONE review (UNIQUE on `submission_id, judge_id`) and ONE ranking entry per the current single-judge-per-category model
- `rankings.rank` gives the position (1, 2, or 3) — null if not in top 3

**Supabase naming aliases:** Use `assigned_judge:profiles!assigned_judge_id` and `judge:profiles!judge_id` to disambiguate the two profiles joins.

### Existing Components to Reuse

| Component | Location | Usage |
|-----------|----------|-------|
| `getRatingTier`, `RATING_TIERS` | `src/features/reviews/types/review.types.ts` | Map rating score to tier label |
| `Badge` | `src/components/ui/badge.tsx` | Ranking position badges |
| `formatSubmissionDate` | `src/features/submissions/types/adminSubmission.types.ts` | Format `reviewedAt` date |
| `AdminSubmissionDetail` | `src/features/submissions/components/AdminSubmissionDetail.tsx` | Add review section to existing component |
| `AdminSubmissionsTable` | `src/features/submissions/components/AdminSubmissionsTable.tsx` | Add rating/rank columns to existing table |

### Existing Patterns to Follow

- **Transform functions:** Same `snake_case` -> `camelCase` pattern as `transformAdminSubmission()` in `adminSubmission.types.ts`
- **Component layout:** Use `<section className="space-y-3">` + `<h3>` + `<dl className="grid grid-cols-[auto_1fr]">` pattern from existing AdminSubmissionDetail sections
- **Feature imports:** Import `getRatingTier` from `@/features/reviews` (feature index), NOT deep path
- **Test patterns:** Co-locate tests, mock supabase, use `@testing-library/react`

### Rating Tier Display Format

```
Rating: 7/10 (Advanced Producer)
```

Use `getRatingTier(rating)` to get the tier label. The `RatingDisplay` component from reviews feature is designed for judge INPUT (two-tier selection UI) — for admin READ-ONLY display, use a simple text format instead. Do NOT import/reuse `RatingDisplay` component here; it's overkill for a read-only label.

### Edge Cases to Handle

1. **No review exists:** `reviews` join returns empty array `[]` — display "Pending Review"
2. **No assigned judge:** `categories.assigned_judge_id` is NULL — display "No judge assigned"
3. **Review exists but no ranking:** Submission was reviewed but not in top 3 — `rankings` is empty
4. **Judge name is null:** `profiles.first_name` / `last_name` can be null — fallback to email or "Unknown Judge"
5. **Submission disqualified:** Still show review data if it exists (admin needs full visibility)

### Supabase Array vs Object Return

When a submission has 0 or 1 reviews, Supabase returns:
- `reviews: []` (no review) — treat as null
- `reviews: [{ ... }]` (one review) — take first element

Same for `rankings: []` or `rankings: [{ ... }]`.

Handle this in `transformAdminSubmission()`:
```typescript
review: row.reviews?.[0] ? {
  reviewId: row.reviews[0].id,
  judgeId: row.reviews[0].judge_id,
  judgeName: buildJudgeName(row.reviews[0].judge),
  rating: row.reviews[0].rating,
  ratingTier: row.reviews[0].rating ? getRatingTier(row.reviews[0].rating)?.label ?? null : null,
  feedback: row.reviews[0].feedback,
  reviewedAt: row.reviews[0].updated_at,
} : null,
rankingPosition: row.rankings?.[0]?.rank ?? null,
```

### Things NOT in Scope for This Story

- Override feedback/rankings (Story 6.3) — admin only VIEWS, no edit controls
- Disqualification workflow (Story 6.4)
- Side-by-side comparison (deferred from AC #5 to `future-work.md`)
- Winners page (Stories 6.5/6.6)
- Participant feedback view (Story 6.7)
- No new database migrations needed — `reviews`, `rankings`, `profiles`, `categories` tables all exist with admin RLS policies

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
src/features/submissions/
  components/AdminReviewSection.tsx          (NEW)
  components/AdminReviewSection.test.tsx     (NEW)
```

**Modified files:**
```
src/features/submissions/
  types/adminSubmission.types.ts             (MODIFIED — add review/ranking types + transform)
  api/adminSubmissionsApi.ts                 (MODIFIED — extend query with reviews/rankings joins)
  components/AdminSubmissionDetail.tsx       (MODIFIED — add judge review section)
  components/AdminSubmissionDetail.test.tsx  (MODIFIED — update tests)
  components/AdminSubmissionsTable.tsx       (MODIFIED — add rating/rank columns + sorting)
  components/AdminSubmissionsTable.test.tsx  (MODIFIED — update tests)
  components/index.ts                        (MODIFIED — add AdminReviewSection export)
  index.ts                                   (MODIFIED — add new type exports)
  hooks/useAdminSubmissions.test.ts          (MODIFIED — verify expanded data)

src/pages/admin/
  AdminSubmissionsPage.tsx                   (NO CHANGE — composition unchanged)

PROJECT_INDEX.md                             (MODIFIED — add AdminReviewSection reference)
```

**Alignment:** All new files are within the existing `src/features/submissions/` feature boundary. No new feature folders. Admin review display components go in submissions feature (admin-prefixed), following the pattern established in Story 6.1.

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-6-admin-oversight-results-publication.md#Story 6.2]
- [Source: _bmad-output/implementation-artifacts/6-1-admin-view-all-submissions.md — Previous story patterns and architecture]
- [Source: src/features/reviews/types/review.types.ts — RATING_TIERS, getRatingTier, Ranking types]
- [Source: src/features/submissions/types/adminSubmission.types.ts — AdminSubmission, transform pattern]
- [Source: src/features/submissions/api/adminSubmissionsApi.ts — Supabase query pattern to extend]
- [Source: src/features/submissions/components/AdminSubmissionDetail.tsx — Component to add review section]
- [Source: src/features/submissions/components/AdminSubmissionsTable.tsx — Table to add columns]
- [Source: supabase/migrations/20260131020610_create_reviews_table.sql — Reviews schema]
- [Source: supabase/migrations/20260131221749_create_rankings_table.sql — Rankings schema]
- [Source: supabase/migrations/00001_create_profiles.sql — Profiles schema (first_name, last_name)]
- [Source: supabase/migrations/20260122120754_add_judge_assignment_to_categories.sql — assigned_judge_id]
- [Source: _bmad-output/project-context.md — All critical rules and patterns]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Adversarial review completed: 15 findings total, 7 real, 8 noise/pre-existing
- Resolution approach: auto-fix all real findings
- F1 (Critical): Fixed nullable rating type mismatch with DB schema
- F2 (High): Extracted shared `formatRankingPosition` helper, removed duplication
- F4 (High): Made `reviews`/`rankings` arrays nullable to match Supabase behavior
- F5 (High): Added 15 unit tests for `transformAdminSubmission` and `formatRankingPosition`
- F9 (Medium): Fixed `buildJudgeName` to return `null` for missing profiles, enabling "No judge assigned" display
- F11 (Medium): Added keyboard accessibility (tabIndex, onKeyDown, aria-sort) to sortable table headers
- F14 (Low): Added `break-words` class to feedback text to prevent layout overflow

### File List

**New Files:**
- _bmad-output/implementation-artifacts/6-2-view-judge-ratings-feedback.md
- src/features/submissions/components/AdminReviewSection.test.tsx
- src/features/submissions/components/AdminReviewSection.tsx
- src/features/submissions/types/adminSubmission.types.test.ts

**Modified Files:**
- PROJECT_INDEX.md
- _bmad-output/implementation-artifacts/future-work.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- src/features/submissions/api/adminSubmissionsApi.ts
- src/features/submissions/components/AdminSubmissionDetail.test.tsx
- src/features/submissions/components/AdminSubmissionDetail.tsx
- src/features/submissions/components/AdminSubmissionsTable.test.tsx
- src/features/submissions/components/AdminSubmissionsTable.tsx
- src/features/submissions/components/index.ts
- src/features/submissions/hooks/useAdminSubmissions.test.ts
- src/features/submissions/index.ts
- src/features/submissions/types/adminSubmission.types.ts
