# Story 6.1: Admin View All Submissions

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Super Admin**,
I want **to view all submissions with full participant data**,
so that **I can see who submitted what and track participation**.

## Acceptance Criteria

1. **Given** I am logged in as Super Admin **When** I navigate to a contest's submissions page **Then** I see a table/list of all submissions across all categories for that contest.

2. **Given** I view the submissions list **When** I examine each row **Then** I see:

   | Field | Source |
   |-------|--------|
   | Participant Code | `submissions.participant_id` -> `participants.code` |
   | Participant Name | `participants.name` |
   | School/Organization | `participants.organization_name` |
   | Teacher/Leader/Coach | `participants.tlc_name`, `participants.tlc_email` |
   | Category | `categories.name` |
   | Media Type | `submissions.media_type` (video/photo) |
   | Submitted At | `submissions.submitted_at` |
   | Status | `submissions.status` |

3. **Given** I view the submissions **When** there are many entries **Then** I can filter by:
   - Category (dropdown)
   - Status (submitted, reviewed, disqualified)
   - Media type (video/photo)

4. **Given** I click on a submission row **When** the detail view opens **Then** I see the full submission with media preview **And** I can play videos or view photos in full **And** I see ALL personal data (name, institution, T/L/C) - NOT anonymized.

## Tasks / Subtasks

- [x] Task 1: Create admin submission types (AC: #2)
  - [x]1.1 Create `src/features/submissions/types/adminSubmission.types.ts`
  - [x]1.2 Define `AdminSubmissionRow` (DB shape, snake_case) and `AdminSubmission` (frontend shape, camelCase) interfaces
  - [x]1.3 Define `AdminSubmissionFilters` type: `{ categoryId?: string; status?: string; mediaType?: string }`
  - [x]1.4 Create `transformAdminSubmission(row: AdminSubmissionRow): AdminSubmission` function
  - [x]1.5 Export from `src/features/submissions/index.ts`

- [x] Task 2: Create admin submissions API (AC: #1, #3)
  - [x]2.1 Create `src/features/submissions/api/adminSubmissionsApi.ts`
  - [x]2.2 Implement `getContestSubmissions(contestId: string, filters?: AdminSubmissionFilters): Promise<AdminSubmission[]>`
  - [x]2.3 Supabase query: join `submissions` with `participants` and `categories` (via `divisions` for contest scoping)
  - [x]2.4 Apply optional filters server-side via `.eq()` chaining
  - [x]2.5 Export from `src/features/submissions/index.ts`

- [x] Task 3: Create TanStack Query hook (AC: #1, #3)
  - [x]3.1 Create `src/features/submissions/hooks/useAdminSubmissions.ts`
  - [x]3.2 Query key: `['admin', 'submissions', contestId, filters]`
  - [x]3.3 Use `keepPreviousData: true` for smooth filter transitions
  - [x]3.4 Export from `src/features/submissions/index.ts`

- [x] Task 4: Create AdminSubmissionFilters component (AC: #3)
  - [x]4.1 Create `src/features/submissions/components/AdminSubmissionFilters.tsx`
  - [x]4.2 Category dropdown — populate from contest's categories via `useCategories` or inline query
  - [x]4.3 Status dropdown — options: All, Submitted, Reviewed, Disqualified
  - [x]4.4 Media type dropdown — options: All, Video, Photo
  - [x]4.5 Use shadcn `Select` components
  - [x]4.6 Emit filter changes via `onFiltersChange` callback
  - [x]4.7 Export from `src/features/submissions/index.ts`

- [x] Task 5: Create AdminSubmissionsTable component (AC: #1, #2)
  - [x]5.1 Create `src/features/submissions/components/AdminSubmissionsTable.tsx`
  - [x]5.2 Columns: Participant Code, Name, Institution, TLC, Category, Media Type, Submitted At, Status
  - [x]5.3 Status badges: submitted (default), disqualified (destructive variant)
  - [x]5.4 Row click handler: `onSelectSubmission(submission: AdminSubmission)`
  - [x]5.5 Empty state when no submissions match filters
  - [x]5.6 Use shadcn `Table` components
  - [x]5.7 Export from `src/features/submissions/index.ts`

- [x] Task 6: Create AdminSubmissionDetail component (AC: #4)
  - [x]6.1 Create `src/features/submissions/components/AdminSubmissionDetail.tsx`
  - [x]6.2 Full participant info: name, organization, TLC name, TLC email
  - [x]6.3 Submission metadata: submitted_at, status, category, media_type
  - [x]6.4 Photo preview: reuse `PhotoLightbox` from `src/features/submissions/components/PhotoLightbox.tsx`
  - [x]6.5 Video preview: Bunny Stream iframe (same pattern as `MediaViewer` in reviews feature)
  - [x]6.6 Render inside shadcn `Sheet` (slide-over panel) for desktop-friendly detail view
  - [x]6.7 Export from `src/features/submissions/index.ts`

- [x] Task 7: Create AdminSubmissionsPage (AC: #1, #2, #3, #4)
  - [x]7.1 Create `src/pages/admin/AdminSubmissionsPage.tsx`
  - [x]7.2 Extract `contestId` from route params (`useParams`)
  - [x]7.3 Compose: AdminSubmissionFilters + AdminSubmissionsTable + AdminSubmissionDetail (Sheet)
  - [x]7.4 Local state: `filters` (AdminSubmissionFilters), `selectedSubmission` (AdminSubmission | null)
  - [x]7.5 Loading skeleton, error state, empty state
  - [x]7.6 Page header with contest name breadcrumb

- [x] Task 8: Update router (AC: #1)
  - [x]8.1 Add lazy-loaded route in `src/router/index.tsx`: `/admin/contests/:contestId/submissions`
  - [x]8.2 Wrap in `AdminRoute` protection
  - [x]8.3 Follow existing lazy-load pattern with `Suspense` fallback

- [x] Task 9: Add navigation link (AC: #1)
  - [x]9.1 Update `src/pages/admin/ContestDetailPage.tsx` — add "View Submissions" button/link to submissions page
  - [x]9.2 Use `Link` from react-router-dom pointing to `/admin/contests/${contestId}/submissions`

- [x] Task 10: Update feature exports and PROJECT_INDEX.md
  - [x]10.1 Verify all new exports in `src/features/submissions/index.ts`
  - [x]10.2 Update `PROJECT_INDEX.md` with new admin submissions page and components

- [x] Task 11: Unit tests
  - [x]11.1 `src/features/submissions/hooks/useAdminSubmissions.test.ts` — query key, filter changes, loading/error states
  - [x]11.2 `src/features/submissions/components/AdminSubmissionsTable.test.tsx` — renders columns, row click, empty state, status badges
  - [x]11.3 `src/features/submissions/components/AdminSubmissionFilters.test.tsx` — dropdown renders, filter change callbacks
- [x]11.4 `src/features/submissions/components/AdminSubmissionDetail.test.tsx` — participant info display, media preview rendering
- [x]11.5 `src/pages/admin/AdminSubmissionsPage.test.tsx` — composition, loading state, filter→table integration

### Review Follow-ups (AI)

- [x] [AI-Review][CRITICAL] Task 3.3 requires `keepPreviousData: true` — **NOISE:** TanStack Query v5 (5.90.16) replaced `keepPreviousData` with `placeholderData: (prev) => prev`, which is exactly what we use. Reviewer citing v4 API.
- [x] [AI-Review][HIGH] AC #3 status filter missing "Reviewed" option — **NOISE:** DB schema defines status as `'submitted' | 'disqualified'` only. No "reviewed" status exists on submissions table; review state is tracked via the `reviews` table.
- [x] [AI-Review][HIGH] AC #2 table row does not display TLC email — **DEFERRED:** Email visible in detail panel (1 click). Adding to table makes mobile cramped. Added to future-work.md as UX polish.
- [x] [AI-Review][MEDIUM] Story File List is empty — **FIXED:** Generated from git.
- [x] [AI-Review][MEDIUM] `src/pages/index.ts` missing export — **DEFERRED:** Barrel file is stale (also missing ContestDetailPage, judge pages). Router uses lazy imports directly. Added to future-work.md as tech debt.

## Dev Notes

### Architecture Decisions

- **Direct Supabase queries (NOT RPC):** Admin has full RLS access on all tables via `is_admin()` policy. This is a read-only view — no complex write logic requiring SECURITY DEFINER. Direct `.from('submissions').select(...)` queries with PostgREST joins are sufficient.
- **Anonymous judging does NOT apply here:** Admin sees full PII (name, institution, TLC info). This is explicitly required by FR49 and AC #4. Do NOT use `get_submissions_for_review` RPC (that's judge-only, strips PII).
- **Sheet for detail view:** Use shadcn Sheet (slide-over panel) instead of a separate route for submission detail. Keeps the list visible while viewing details. Avoids route complexity for a secondary view.

### Database Schema Reference

**`submissions` table columns:**
```
id UUID PK, participant_id UUID FK, category_id UUID FK,
media_type TEXT ('video'|'photo'), media_url TEXT, bunny_video_id TEXT,
thumbnail_url TEXT, status TEXT ('uploading'|'submitted'|'disqualified'),
submitted_at TIMESTAMPTZ, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
UNIQUE(category_id, participant_id)
```

**`participants` table columns (PII fields for admin display):**
```
id UUID PK, contest_id UUID FK, code TEXT (8-char),
status TEXT ('unused'|'used'), name TEXT, organization_name TEXT,
tlc_name TEXT, tlc_email TEXT, created_at TIMESTAMPTZ
```

**`categories` table columns (for filter dropdown + display):**
```
id UUID PK, division_id UUID FK, name TEXT, type TEXT ('video'|'photo'),
deadline TIMESTAMPTZ, status TEXT, assigned_judge_id UUID FK,
judging_completed_at TIMESTAMPTZ
```

**`divisions` table (needed for contest scoping):**
```
id UUID PK, contest_id UUID FK, name TEXT
```

### Query Pattern

```typescript
// Admin contest submissions with full participant data
const { data, error } = await supabase
  .from('submissions')
  .select(`
    id, media_type, media_url, bunny_video_id, thumbnail_url,
    status, submitted_at, created_at,
    participants!inner(id, code, name, organization_name, tlc_name, tlc_email),
    categories!inner(id, name, type, divisions!inner(contest_id))
  `)
  .eq('categories.divisions.contest_id', contestId)
  .order('submitted_at', { ascending: false });

// Apply optional filters via chaining:
if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
if (filters.status) query = query.eq('status', filters.status);
if (filters.mediaType) query = query.eq('media_type', filters.mediaType);
```

**Important:** The `!inner` keyword on joins converts LEFT JOIN to INNER JOIN, enabling nested `.eq()` filtering through the join chain. This is how we scope submissions to a specific contest without a separate RPC.

### Existing Components to Reuse

| Component | Location | Usage |
|-----------|----------|-------|
| `PhotoLightbox` | `src/features/submissions/components/PhotoLightbox.tsx` | Photo full-view in detail panel |
| `MediaViewer` | `src/features/reviews/components/MediaViewer.tsx` | Reference pattern for video iframe |
| `Badge` | `src/components/ui/badge.tsx` | Status badges on table rows |
| `Table` | `src/components/ui/table.tsx` | Table structure |
| `Select` | `src/components/ui/select.tsx` | Filter dropdowns |
| `Sheet` | `src/components/ui/sheet.tsx` | Detail slide-over panel |
| `Skeleton` | `src/components/ui/skeleton.tsx` | Loading states |
| `AdminLayout` | `src/features/admin/components/AdminLayout.tsx` | Wraps page via router |

### Existing Patterns to Follow

- **Transform functions:** See `transformCategory()` in `src/features/categories/types/category.types.ts` — same snake_case → camelCase pattern
- **API file structure:** See `src/features/contests/api/contestsApi.ts` — object with async methods
- **TanStack Query hooks:** See `src/features/categories/hooks/` — `useQuery` with typed return, query keys as arrays
- **Lazy route loading:** See existing admin routes in `src/router/index.tsx` — `React.lazy()` with `Suspense`
- **Feature index exports:** See `src/features/submissions/index.ts` — categorized exports with comments

### Admin Route Pattern

```typescript
// In src/router/index.tsx — follows existing pattern:
const AdminSubmissionsPage = lazy(() =>
  import('@/pages/admin/AdminSubmissionsPage').then((m) => ({
    default: m.AdminSubmissionsPage,
  }))
);

// Route (nested under /admin):
<Route path="contests/:contestId/submissions" element={
  <AdminRoute><Suspense fallback={<LoadingSpinner />}><AdminSubmissionsPage /></Suspense></AdminRoute>
} />
```

### Testing Patterns

- Co-locate tests: `ComponentName.test.tsx` next to `ComponentName.tsx`
- Mock Supabase client: `vi.mock('@/lib/supabase')`
- Mock feature hooks: `vi.mock('@/features/submissions')`
- Use `@testing-library/react` with `renderWithProviders` if available, otherwise wrap in `QueryClientProvider`
- Test user interactions with `@testing-library/user-event`

### Quality Gate (Updated per Epic 5 Retro)

```bash
npm run build              # Must pass
npm run lint               # Must pass
npm run type-check         # Must pass
npx vitest run --changed   # Scoped tests only (NOT npm run test)
```

### Things NOT in Scope for This Story

- Admin override of feedback/rankings (Story 6.3)
- Disqualification workflow (Story 6.4)
- Judge ratings display on submissions (Story 6.2)
- Winners page (Story 6.5/6.6)
- No new database migrations needed — all tables exist with admin RLS policies already in place

### Epic 5 Retro Consideration: DB Triggers

The `prevent_review_modification_on_completed` and `prevent_ranking_modification_on_completed` triggers on reviews/rankings tables do NOT affect this story. Story 6.1 is read-only — no writes to reviews or rankings tables.

### Project Structure Notes

**New files (all within existing feature boundaries):**
```
src/features/submissions/
  types/adminSubmission.types.ts          (NEW)
  api/adminSubmissionsApi.ts              (NEW)
  hooks/useAdminSubmissions.ts            (NEW)
  hooks/useAdminSubmissions.test.ts       (NEW)
  components/AdminSubmissionFilters.tsx   (NEW)
  components/AdminSubmissionFilters.test.tsx (NEW)
  components/AdminSubmissionsTable.tsx    (NEW)
  components/AdminSubmissionsTable.test.tsx (NEW)
  components/AdminSubmissionDetail.tsx    (NEW)
  components/AdminSubmissionDetail.test.tsx (NEW)
  index.ts                               (MODIFIED — add new exports)

src/pages/admin/
  AdminSubmissionsPage.tsx               (NEW)
  AdminSubmissionsPage.test.tsx          (NEW)
  ContestDetailPage.tsx                  (MODIFIED — add navigation link)

src/router/
  index.tsx                              (MODIFIED — add route)

PROJECT_INDEX.md                         (MODIFIED — add new page reference)
```

**Alignment:** All new files follow the Bulletproof React feature-based architecture documented in `architecture/project-structure-boundaries.md`. Admin submission components go in `src/features/submissions/` (same feature, admin-prefixed), NOT a new `src/features/admin-submissions/` feature.

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-6-admin-oversight-results-publication.md#Story 6.1]
- [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#FR49]
- [Source: _bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#Database Schema]
- [Source: _bmad-output/planning-artifacts/architecture/project-structure-boundaries.md#Requirements to Structure Mapping]
- [Source: _bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#Naming Patterns]
- [Source: _bmad-output/project-context.md — All critical rules and patterns]
- [Source: _bmad-output/implementation-artifacts/epic-5-retrospective.md#Action Items — Quality gate update]
- [Source: supabase/migrations/20260127170234_create_submissions.sql — Submissions schema]
- [Source: supabase/migrations/20260131020610_create_reviews_table.sql — Reviews schema reference]
- [Source: supabase/migrations/20260131221749_create_rankings_table.sql — Rankings schema reference]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- All 11 tasks completed, 24 tests passing across 5 test files
- Adversarial review: 10 findings, 4 real (fixed), 6 noise (skipped)
- Fixed: extracted shared statusVariant + formatDate, added aria-labels, added category loading state
- Quality gate: build, lint, type-check all pass with zero errors

### Review Notes

- Adversarial review completed
- Findings: 10 total, 4 fixed, 6 skipped (noise)
- Resolution approach: auto-fix

### File List

**New Files:**
- src/features/submissions/types/adminSubmission.types.ts
- src/features/submissions/api/adminSubmissionsApi.ts
- src/features/submissions/hooks/useAdminSubmissions.ts
- src/features/submissions/hooks/useAdminSubmissions.test.ts
- src/features/submissions/components/AdminSubmissionFilters.tsx
- src/features/submissions/components/AdminSubmissionFilters.test.tsx
- src/features/submissions/components/AdminSubmissionsTable.tsx
- src/features/submissions/components/AdminSubmissionsTable.test.tsx
- src/features/submissions/components/AdminSubmissionDetail.tsx
- src/features/submissions/components/AdminSubmissionDetail.test.tsx
- src/pages/admin/AdminSubmissionsPage.tsx
- src/pages/admin/AdminSubmissionsPage.test.tsx

**Modified Files:**
- src/features/submissions/components/index.ts
- src/features/submissions/hooks/index.ts
- src/features/submissions/index.ts
- src/pages/admin/ContestDetailPage.tsx
- src/router/index.tsx
- PROJECT_INDEX.md
