# Story 5.5: Top 3 Ranking (Drag & Drop)

Status: implementation-complete

## Story

As a **Judge**,
I want **to rank my top 3 submissions using drag-and-drop**,
So that **the best entries are identified for awards**.

## Acceptance Criteria

### AC1: Proceed to Ranking
**Given** I have reviewed all submissions in a category
**When** I view the category review page
**Then** I see a "Proceed to Ranking" button
**And** the button is disabled if I have NOT reviewed all submissions

### AC2: Ranking Page Layout
**Given** I click "Proceed to Ranking"
**When** the ranking page loads
**Then** I see three ranking positions: 1st Place, 2nd Place, 3rd Place (initially empty)
**And** I see all reviewed submissions sorted by rating (highest first, lowest last)
**And** each submission card shows: participant code, thumbnail, my rating tier and score

### AC3: Drag and Drop to Rank
**Given** I drag a submission card
**When** I drop it onto a ranking position
**Then** the card snaps into that position
**And** the position is visually filled
**And** I see confirmation feedback

### AC4: Replace Ranked Submission
**Given** a ranking position is already filled
**When** I drag another submission onto it
**Then** the new submission replaces the old one
**And** the old submission returns to the available pool

### AC5: Rating Hierarchy Constraint
**Given** I try to rank a lower-rated submission above a higher-rated one
**When** I attempt to drop it in a higher position
**Then** I see an error: "Cannot rank a lower-rated submission above a higher-rated one"
**And** the drop is rejected
**And** submissions with the same rating can be ordered in any position relative to each other

### AC6: Remove from Ranking
**Given** I want to remove a ranked submission
**When** I drag it out of the position (or click a remove button)
**Then** the position becomes empty
**And** the submission returns to the available pool

### AC7: Keyboard Accessibility
**Given** I use keyboard navigation
**When** I focus on a submission and press Enter
**Then** I can use arrow keys to select a ranking position and Enter to confirm

### AC8: Ranking Display
**Given** I have ranked my top 3
**When** I view the ranking
**Then** I see clearly: 1st Place, 2nd Place, 3rd Place with the selected submissions
**And** the ranking respects rating order: 1st >= 2nd >= 3rd (by rating score)

### AC9: Database Migration
**Given** the database migration runs for this story
**When** I check the schema
**Then** `rankings` table exists with: id, category_id, judge_id, rank (1/2/3), submission_id, created_at, updated_at
**And** unique constraint ensures one submission per rank per judge per category

### AC10: Save Rankings
**Given** I have set my top 3 rankings
**When** I click "Save Rankings"
**Then** the rankings are persisted to the database
**And** I see a success confirmation
**And** I can still modify and re-save

## Tasks / Subtasks

- [x] Task 1: Install @dnd-kit library
  - [x] 1.1 Run `npm install @dnd-kit/core @dnd-kit/utilities`
  - [x] 1.2 Verify no version conflicts with React 19
  - [x] 1.3 Do NOT install `@dnd-kit/sortable` — not needed for drop-zone pattern

- [x] Task 2: Create `rankings` table migration (AC9)
  - [x] 2.1 Create migration: `npx supabase migration new create_rankings_table`
  - [x] 2.2 SQL: `rankings` table with columns: `id` (UUID PK), `category_id` (UUID FK → categories), `judge_id` (UUID FK → profiles), `rank` (INTEGER CHECK 1-3), `submission_id` (UUID FK → submissions), `created_at`, `updated_at`
  - [x] 2.3 Unique constraint: `UNIQUE(category_id, judge_id, rank)` — one submission per rank per judge per category
  - [x] 2.4 Additional unique: `UNIQUE(category_id, judge_id, submission_id)` — same submission can't be ranked twice by same judge
  - [x] 2.5 Enable RLS: judges can SELECT/INSERT/UPDATE/DELETE own rankings (where `judge_id = auth.uid()`)
  - [x] 2.6 Admin policy: full access (same pattern as reviews table)
  - [x] 2.7 Indexes: `idx_rankings_judge_id`, `idx_rankings_category_id`
  - [x] 2.8 Auto-update `updated_at` trigger (reuse `update_updated_at_column`)
  - [x] 2.9 Apply migration: `npx supabase db push`

- [x] Task 3: Create rankings API and hooks
  - [x] 3.1 Create `src/features/reviews/api/rankingsApi.ts`
  - [x] 3.2 `getRankings(categoryId: string)` — fetch judge's rankings for a category via direct Supabase query with RLS
  - [x] 3.3 `saveRankings(categoryId: string, rankings: { rank: number; submissionId: string }[])` — upsert all 3 rankings in one call (delete existing + insert new)
  - [x] 3.4 Create `src/features/reviews/hooks/useRankings.ts` — TanStack Query hook wrapping `getRankings`
  - [x] 3.5 Create `src/features/reviews/hooks/useSaveRankings.ts` — TanStack mutation hook wrapping `saveRankings`, invalidates rankings query on success
  - [x] 3.6 Query key pattern: `['rankings', categoryId]`

- [x] Task 4: Create ranking types
  - [x] 4.1 Add to `src/features/reviews/types/review.types.ts`:
    - `Ranking` interface: `{ id: string; categoryId: string; judgeId: string; rank: number; submissionId: string; createdAt: string; updatedAt: string }`
    - `RankingPosition` type: `1 | 2 | 3`
    - `RankedSubmission` interface: `{ position: RankingPosition; submission: SubmissionForReview }` (combines ranking with submission data for UI)
  - [x] 4.2 Add `transformRanking` function for snake_case → camelCase

- [x] Task 5: Create `RankingSlot` component (AC2, AC3, AC4, AC6)
  - [x] 5.1 Create `src/features/reviews/components/RankingSlot.tsx`
  - [x] 5.2 Props: `position: RankingPosition`, `submission: SubmissionForReview | null`, `isOver: boolean`, `onRemove: () => void`
  - [x] 5.3 Empty state: dashed border, "Drop submission here" text, position label (1st, 2nd, 3rd)
  - [x] 5.4 Filled state: submission thumbnail, participant code, rating tier + score, remove button (X icon)
  - [x] 5.5 Drop target highlight: when dragging over, border changes to `border-primary`, background to `bg-primary/5`
  - [x] 5.6 Use `useDroppable` from `@dnd-kit/core` with `id` = `slot-${position}`
  - [x] 5.7 Position label styling: gold (1st), silver (2nd), bronze (3rd) with appropriate colors
  - [x] 5.8 ARIA: `role="listbox"`, `aria-label="Rank ${position} position"`

- [x] Task 6: Create `DraggableSubmissionCard` component (AC2, AC3)
  - [x] 6.1 Create `src/features/reviews/components/DraggableSubmissionCard.tsx`
  - [x] 6.2 Props: `submission: SubmissionForReview`, `isRanked: boolean`, `isDragging: boolean`
  - [x] 6.3 Card content: thumbnail (small, 80x60), participant code, rating tier label + score number
  - [x] 6.4 Use `useDraggable` from `@dnd-kit/core` with `id` = submission ID
  - [x] 6.5 Visual states: default (border-border), dragging (opacity-50, ring-2 ring-primary), ranked (opacity-50 + "Ranked" badge)
  - [x] 6.6 Disable drag when already ranked (greyed out in available pool)
  - [x] 6.7 Compact horizontal layout: thumbnail left, text right, fits in a row
  - [x] 6.8 ARIA: `role="option"`, `aria-roledescription="draggable submission"`

- [x] Task 7: Create `RankingPage` component (AC1-AC10)
  - [x] 7.1 Create `src/pages/judge/RankingPage.tsx`
  - [x] 7.2 Route: `/judge/categories/:categoryId/ranking`
  - [x] 7.3 Layout: header (back to category, category name), two-column on desktop (rankings left, available pool right), stacked on mobile
  - [x] 7.4 Wrap content in `DndContext` from `@dnd-kit/core`
  - [x] 7.5 Configure sensors: `PointerSensor` (mouse + touch), `KeyboardSensor` (accessibility)
  - [x] 7.6 Left section: 3 `RankingSlot` components stacked vertically
  - [x] 7.7 Right section: scrollable list of `DraggableSubmissionCard` components, sorted by rating DESC
  - [x] 7.8 Handle `onDragEnd`: validate rating constraint, place submission in slot, handle replacements
  - [x] 7.9 Rating constraint validation function: `validateRankingOrder(rankings)` — check that ranked[n].rating >= ranked[n+1].rating, allow equal ratings
  - [x] 7.10 Error state: show toast or inline error when constraint violated
  - [x] 7.11 "Save Rankings" button: enabled when all 3 positions filled, calls `useSaveRankings` mutation
  - [x] 7.12 Success feedback: show "Rankings saved" toast via `sonner`
  - [x] 7.13 Loading state: skeleton for slots and available pool
  - [x] 7.14 Data source: `useSubmissionsForReview(categoryId)` for submissions + `useRankings(categoryId)` for persisted rankings
  - [x] 7.15 Initialize ranked state from persisted rankings on load (if previously saved)

- [x] Task 8: Add keyboard ranking support (AC7)
  - [x] 8.1 In `RankingPage`, implement keyboard flow:
    - Tab to available submission → Enter to "pick up"
    - Arrow Up/Down to select ranking position (1st, 2nd, 3rd)
    - Enter to confirm placement
    - Escape to cancel
  - [x] 8.2 Use `@dnd-kit/core` `KeyboardSensor` with `coordinateGetter` for slot-based navigation
  - [x] 8.3 Visual indicator for keyboard mode: focus ring on selected slot during placement

- [x] Task 9: Add "Proceed to Ranking" button to CategoryReviewPage (AC1)
  - [x] 9.1 Modify `src/pages/judge/CategoryReviewPage.tsx`
  - [x] 9.2 Add button after the submission grid: "Proceed to Ranking"
  - [x] 9.3 Button disabled when `progress.pending > 0` — show "Review all submissions before ranking" tooltip or text
  - [x] 9.4 Button enabled when `progress.pending === 0` — navigates to `/judge/categories/${categoryId}/ranking`
  - [x] 9.5 Style: `Button` with `variant="default"`, full-width on mobile, centered
  - [x] 9.6 Icon: `Trophy` from lucide-react

- [x] Task 10: Update router with ranking route
  - [x] 10.1 Modify `src/router/index.tsx`
  - [x] 10.2 Add route: `{ path: '/judge/categories/:categoryId/ranking', element: <JudgeRoute><LazyRoute><RankingPage /></LazyRoute></JudgeRoute> }`
  - [x] 10.3 Import `RankingPage` lazily: `const RankingPage = lazy(() => import('@/pages/judge/RankingPage').then(m => ({ default: m.RankingPage })))`

- [x] Task 11: Update feature exports
  - [x] 11.1 Update `src/features/reviews/components/index.ts` with RankingSlot, DraggableSubmissionCard
  - [x] 11.2 Update `src/features/reviews/index.ts` with new components, hooks, types, API
  - [x] 11.3 Export: `RankingSlot`, `DraggableSubmissionCard`, `useRankings`, `useSaveRankings`, `rankingsApi`, `Ranking`, `RankingPosition`, `RankedSubmission`

- [x] Task 12: Create tests
  - [x] 12.1 Create `src/features/reviews/components/RankingSlot.test.tsx`
    - Empty slot renders with position label and drop text
    - Filled slot shows submission info and remove button
    - Remove button calls onRemove
    - Drop target highlight when `isOver` is true
    - ARIA attributes present
  - [x] 12.2 Create `src/features/reviews/components/DraggableSubmissionCard.test.tsx`
    - Renders participant code, rating tier, and score
    - Ranked state shows opacity and badge
    - ARIA attributes present
  - [x] 12.3 Create `src/pages/judge/RankingPage.test.tsx`
    - Renders 3 empty ranking slots
    - Renders available submissions sorted by rating DESC
    - Save button disabled when not all 3 ranked
    - Save button enabled when all 3 ranked
    - Constraint validation: reject lower-rated above higher-rated
    - Equal ratings allowed in any order
    - Loading state renders skeletons
    - Back button navigates to category page
  - [x] 12.4 Create `src/features/reviews/hooks/useRankings.test.ts`
    - Fetches rankings for category
    - Returns empty array when no rankings
  - [x] 12.5 Add test to `CategoryReviewPage.test.tsx`:
    - "Proceed to Ranking" button disabled when pending > 0
    - "Proceed to Ranking" button enabled and navigates when pending === 0

- [x] Task 13: Run quality gates
  - [x] 13.1 `npm run build` passes
  - [x] 13.2 `npm run lint` passes
  - [x] 13.3 `npm run type-check` passes
  - [x] 13.4 `npm run test` passes (all existing + new tests)
  - [x] 13.5 Manual smoke test: review all submissions → "Proceed to Ranking" appears → click → ranking page loads → drag submission to 1st → drag another to 2nd → drag third to 3rd → constraint blocks if needed → Save Rankings → success toast
  - [x] 13.6 Manual smoke test: keyboard navigation → Tab to submission → Enter → Arrow keys to select slot → Enter → confirm → repeat for all 3

## Dev Notes

### Architecture Requirements

**New Library: @dnd-kit**
This story requires installing `@dnd-kit/core` and `@dnd-kit/utilities`. This is the recommended DnD library for React 19:
- Lightweight (~20KB gzipped)
- First-class TypeScript support
- Built-in accessibility (keyboard sensors, ARIA)
- Works with Tailwind CSS and shadcn/ui
- Do NOT install `@dnd-kit/sortable` — we use a drop-zone pattern (drag to slots), not list reordering

**Feature Organization:**
New ranking components, hooks, and types go in the existing `src/features/reviews/` feature (not a new `rankings` feature). Ranking is part of the judge review workflow.

**Page Organization:**
`RankingPage` goes in `src/pages/judge/` following the established pattern.

### Dependencies from Stories 5-1 through 5-4 (Already Implemented)

| Asset | Location | Usage |
|-------|----------|-------|
| `useSubmissionsForReview` hook | `@/features/reviews` | USE AS-IS: provides submissions with ratings |
| `SubmissionForReview` type | `@/features/reviews` | USE AS-IS: has rating, participantCode, thumbnail |
| `RATING_TIERS`, `getRatingTier` | `@/features/reviews` | USE AS-IS: display rating tier on cards |
| `CategoryReviewPage` | `src/pages/judge/` | MODIFY: add "Proceed to Ranking" button |
| `CategoryReviewPage.test.tsx` | `src/pages/judge/` | MODIFY: add ranking button tests |
| `ReviewProgress` type | `@/features/reviews` | USE AS-IS: check `progress.pending === 0` |
| `SubmissionCard` component | `@/features/reviews` | REFERENCE ONLY: visual pattern for card design |
| Router config | `src/router/index.tsx` | MODIFY: add ranking route |
| `reviews` table | Supabase | USE AS-IS: stores ratings referenced by rankings |
| `sonner` toast library | already installed | USE: success/error feedback |

### @dnd-kit Integration Pattern

```typescript
import { DndContext, DragEndEvent, useDroppable, useDraggable } from '@dnd-kit/core';
import { PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';

// In RankingPage:
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(KeyboardSensor)
);

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over) return; // Dropped outside any slot

  const submissionId = active.id as string;
  const slotId = over.id as string; // "slot-1", "slot-2", "slot-3"
  const position = parseInt(slotId.split('-')[1]) as RankingPosition;

  // Find the submission
  const submission = submissions.find(s => s.id === submissionId);
  if (!submission) return;

  // Validate rating constraint
  const newRankings = [...currentRankings];
  newRankings[position - 1] = submission;

  if (!validateRankingOrder(newRankings)) {
    toast.error('Cannot rank a lower-rated submission above a higher-rated one');
    return;
  }

  // If slot was occupied, return old submission to pool
  // Place new submission in slot
  setCurrentRankings(newRankings);
}

return (
  <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
    {/* Ranking slots and available pool */}
  </DndContext>
);
```

### Rating Constraint Validation

```typescript
function validateRankingOrder(
  rankings: (SubmissionForReview | null)[]
): boolean {
  const filled = rankings.filter((r): r is SubmissionForReview => r !== null);

  // Check all consecutive pairs: higher rank must have >= rating
  for (let i = 0; i < filled.length - 1; i++) {
    const current = filled[i];
    const next = filled[i + 1];
    // Only validate if both positions have ratings
    if (current.rating !== null && next.rating !== null) {
      if (current.rating < next.rating) return false;
    }
  }
  return true;
}

// Important edge case:
// - Same rating (e.g., both 8): allowed in any order (judge's discretion)
// - Only reject when higher-ranked position has strictly lower rating
// - Null ratings should not block ranking (defensive, shouldn't happen if all reviewed)
```

### Rankings Table Migration

```sql
CREATE TABLE public.rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 3),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category_id, judge_id, rank),
  UNIQUE(category_id, judge_id, submission_id)
);

-- Indexes
CREATE INDEX idx_rankings_judge_id ON public.rankings(judge_id);
CREATE INDEX idx_rankings_category_id ON public.rankings(category_id);

-- Auto-update trigger
CREATE TRIGGER update_rankings_updated_at
  BEFORE UPDATE ON public.rankings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Judges can view own rankings"
  ON public.rankings FOR SELECT
  USING (auth.uid() = judge_id);

CREATE POLICY "Judges can create own rankings"
  ON public.rankings FOR INSERT
  WITH CHECK (auth.uid() = judge_id);

CREATE POLICY "Judges can update own rankings"
  ON public.rankings FOR UPDATE
  USING (auth.uid() = judge_id)
  WITH CHECK (auth.uid() = judge_id);

CREATE POLICY "Judges can delete own rankings"
  ON public.rankings FOR DELETE
  USING (auth.uid() = judge_id);

CREATE POLICY "Admins have full access to rankings"
  ON public.rankings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

### Save Rankings Strategy

Rankings are saved as a batch (delete all existing + insert 3 new rows):

```typescript
// In rankingsApi.ts:
async saveRankings(
  categoryId: string,
  judgeId: string,
  rankings: { rank: number; submissionId: string }[]
): Promise<void> {
  // Step 1: Delete existing rankings for this judge + category
  const { error: deleteError } = await (supabase.from as any)('rankings')
    .delete()
    .match({ category_id: categoryId, judge_id: judgeId });

  if (deleteError) throw deleteError;

  // Step 2: Insert new rankings
  const rows = rankings.map(r => ({
    category_id: categoryId,
    judge_id: judgeId,
    rank: r.rank,
    submission_id: r.submissionId,
  }));

  const { error: insertError } = await (supabase.from as any)('rankings')
    .insert(rows);

  if (insertError) throw insertError;
}
```

NOTE: The `supabase.from as any` pattern is necessary because the `rankings` table was created by migration and is not in the generated Supabase types. This is the same pattern used for `reviews` in Story 5-2.

### Ranking Page Layout

```
┌────────────────────────────────────────────────────────┐
│  ← Back to Category          Photo Contest - Nature    │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌─ Rankings ──────────┐  ┌─ Available Submissions ──┐ │
│  │                     │  │                          │ │
│  │ 🥇 1st Place        │  │ [P-ABC123] Master (9)   │ │
│  │ ┌─────────────────┐ │  │ [P-DEF456] Advanced (8) │ │
│  │ │ Drop here       │ │  │ [P-GHI789] Advanced (7) │ │
│  │ └─────────────────┘ │  │ [P-JKL012] Proficient(6)│ │
│  │                     │  │ [P-MNO345] Proficient(5) │ │
│  │ 🥈 2nd Place        │  │ [P-PQR678] Emerging (4) │ │
│  │ ┌─────────────────┐ │  │ [P-STU901] Developing(2)│ │
│  │ │ Drop here       │ │  │                          │ │
│  │ └─────────────────┘ │  │                          │ │
│  │                     │  │                          │ │
│  │ 🥉 3rd Place        │  │                          │ │
│  │ ┌─────────────────┐ │  │                          │ │
│  │ │ Drop here       │ │  │                          │ │
│  │ └─────────────────┘ │  │                          │ │
│  │                     │  │                          │ │
│  └─────────────────────┘  └──────────────────────────┘ │
│                                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │              [ Save Rankings ]                   │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘

Mobile: stacked (rankings on top, available pool below)
```

### New/Modified Files

```
src/features/reviews/components/
├── RankingSlot.tsx                    # NEW: droppable ranking position
├── RankingSlot.test.tsx               # NEW: tests
├── DraggableSubmissionCard.tsx        # NEW: draggable submission card for ranking
├── DraggableSubmissionCard.test.tsx   # NEW: tests
└── index.ts                          # MODIFY: export new components

src/features/reviews/hooks/
├── useRankings.ts                     # NEW: query hook for rankings
├── useRankings.test.ts                # NEW: tests
├── useSaveRankings.ts                 # NEW: mutation hook
└── index.ts                          # MODIFY (if exists) or feature index

src/features/reviews/api/
└── rankingsApi.ts                     # NEW: rankings API

src/features/reviews/types/
└── review.types.ts                    # MODIFY: add ranking types

src/features/reviews/
└── index.ts                          # MODIFY: export new ranking components/hooks/types

src/pages/judge/
├── RankingPage.tsx                    # NEW: main ranking page
├── RankingPage.test.tsx               # NEW: tests
├── CategoryReviewPage.tsx             # MODIFY: add "Proceed to Ranking" button
└── CategoryReviewPage.test.tsx        # MODIFY: add ranking button test

src/router/
└── index.tsx                          # MODIFY: add ranking route

supabase/migrations/
└── {timestamp}_create_rankings_table.sql  # NEW: rankings table + RLS
```

### Reuse from Previous Stories (DO NOT RECREATE)

- `useSubmissionsForReview` hook — USE AS-IS: provides all submissions with ratings for the ranking pool
- `SubmissionForReview` type — USE AS-IS: has rating, participantCode, thumbnailUrl, mediaType
- `RATING_TIERS`, `getRatingTier` — USE AS-IS: display tier label on ranking cards
- `CategoryReviewPage` — EXTEND: add "Proceed to Ranking" button (don't restructure)
- `ReviewProgress` type (via `useSubmissionsForReview.progress`) — USE AS-IS: check `pending === 0`
- `SubmissionCard` — REFERENCE ONLY for visual pattern; ranking cards need different layout (compact, draggable)
- `Button`, `Skeleton`, `Separator`, `Badge` from `@/components/ui`
- `Trophy`, `GripVertical`, `X`, `ArrowLeft` icons from `lucide-react`
- `toast` from `sonner` — for save success/error feedback
- Router pattern: `JudgeRoute` + `LazyRoute` wrappers

### Testing Guidance

**Unit Tests (RankingSlot.test.tsx):**
1. Empty slot renders position label and "Drop here" text
2. Filled slot renders submission thumbnail, code, and rating
3. Remove button calls onRemove callback
4. isOver prop applies highlight styles
5. ARIA attributes present (role, label)

**Unit Tests (DraggableSubmissionCard.test.tsx):**
1. Renders participant code, rating tier, and score
2. Ranked state shows dimmed appearance and badge
3. ARIA attributes present

**Integration Tests (RankingPage.test.tsx):**
1. Renders 3 empty ranking slots on load
2. Renders available submissions sorted by rating DESC
3. "Save Rankings" button disabled when fewer than 3 ranked
4. "Save Rankings" button calls mutation when all 3 ranked
5. Loading state shows skeletons
6. Back button navigates to category page
7. Pre-existing rankings loaded on mount
8. Constraint validation: blocks lower-rated above higher-rated (mock DnD event)

**Testing DnD in jsdom:**
DnD interactions are difficult to test with jsdom. Focus on:
- Component rendering and state (slots, cards, buttons)
- Constraint validation function (pure function, easy to unit test)
- Save mutation calls
- Leave actual drag-and-drop gesture testing for manual/E2E testing
- Test `handleDragEnd` logic by calling it directly with mock `DragEndEvent`

**CategoryReviewPage tests:**
1. "Proceed to Ranking" button disabled when submissions pending
2. "Proceed to Ranking" button enabled and navigates when all reviewed

### Project Structure Notes

- New components go in `src/features/reviews/components/` (NOT a separate `rankings` feature)
- New hooks go in `src/features/reviews/hooks/`
- New API goes in `src/features/reviews/api/`
- New types extend `src/features/reviews/types/review.types.ts`
- New page goes in `src/pages/judge/`
- Import from `@/features/reviews` NOT deep paths
- Export all new components/hooks/types from feature index immediately
- `@dnd-kit` packages go in `package.json` dependencies (not devDependencies)

### Quality Gates

```bash
# Git (REQUIRED)
git status          # Must show clean
git log --oneline -5  # Verify commits have "5-5:" prefix
git push -u origin story/5-5-top-3-ranking-drag-drop

# Build (REQUIRED)
npm run build       # Must pass
npm run lint        # Must pass
npm run type-check  # Must pass
npm run test        # Must pass

# Migration (REQUIRED)
npx supabase migration list  # Verify rankings migration applied
```

### References

- [Source: epic-5-judging-evaluation-workflow.md#Story 5.5]
- [Source: 5-4-rating-feedback-form.md] (previous story — 699 tests, rating + feedback complete)
- [Source: src/pages/judge/CategoryReviewPage.tsx] (entry point for ranking)
- [Source: src/features/reviews/hooks/useSubmissionsForReview.ts] (data source)
- [Source: src/features/reviews/types/review.types.ts] (SubmissionForReview, RATING_TIERS)
- [Source: src/router/index.tsx] (route pattern)
- [Source: supabase/migrations/20260131020610_create_reviews_table.sql] (RLS pattern reference)
- [Source: project-context.md#Supabase Setup] (migration commands)
- [Source: project-context.md#Anonymous Judging Rules] (no PII in judge queries)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

- All 13 tasks completed
- Migration applied to remote Supabase
- 735 tests pass (55 new/modified)
- Zero lint errors, zero type errors
- Build passes clean
- `isOver` correctly sourced from `useDroppable` hook (not prop)
- Ranking state initialization refactored to avoid lint violations (no setState in effect, no ref in render)

### File List

**New Files:**
- `supabase/migrations/20260131221749_create_rankings_table.sql`
- `src/features/reviews/api/rankingsApi.ts`
- `src/features/reviews/hooks/useRankings.ts`
- `src/features/reviews/hooks/useSaveRankings.ts`
- `src/features/reviews/components/RankingSlot.tsx`
- `src/features/reviews/components/DraggableSubmissionCard.tsx`
- `src/pages/judge/RankingPage.tsx`
- `src/features/reviews/components/RankingSlot.test.tsx`
- `src/features/reviews/components/DraggableSubmissionCard.test.tsx`
- `src/pages/judge/RankingPage.test.tsx`
- `src/features/reviews/hooks/useRankings.test.ts`

**Modified Files:**
- `src/features/reviews/types/review.types.ts` (ranking types added)
- `src/features/reviews/types/review.types.test.ts` (ranking type tests added)
- `src/features/reviews/api/index.ts` (export rankingsApi)
- `src/features/reviews/hooks/index.ts` (export useRankings, useSaveRankings)
- `src/features/reviews/types/index.ts` (export ranking types)
- `src/features/reviews/components/index.ts` (export RankingSlot, DraggableSubmissionCard)
- `src/features/reviews/index.ts` (export all new ranking exports)
- `src/pages/judge/CategoryReviewPage.tsx` (Proceed to Ranking button)
- `src/pages/judge/CategoryReviewPage.test.tsx` (ranking button tests)
- `src/router/index.tsx` (ranking route)
- `package.json` / `package-lock.json` (@dnd-kit dependencies)
