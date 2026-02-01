# Story 5.6: Mark Category Complete & Notify Admin

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Judge**,
I want **to mark a category as complete when I've finished all reviews and rankings**,
So that **the admin knows my judging is done and I can no longer accidentally modify my evaluations**.

## Acceptance Criteria

### AC1: Mark as Complete Button Visibility
**Given** I have reviewed ALL submissions in a category
**And** I have saved my top 3 rankings
**When** I view the category review page
**Then** I see a "Mark as Complete" button

### AC2: Button Disabled - Reviews Incomplete
**Given** I have NOT reviewed all submissions
**When** I view the category review page
**Then** the "Mark as Complete" button is disabled (or hidden)
**And** I see "Review all submissions before completing"

### AC3: Button Disabled - Rankings Missing
**Given** I have reviewed all submissions but have NOT saved top 3 rankings
**When** I view the category review page
**Then** the "Mark as Complete" button is disabled
**And** I see "Rank your top 3 before completing"

### AC4: Confirmation Dialog
**Given** I click "Mark as Complete"
**When** I see the confirmation dialog
**Then** it shows: "You reviewed X submissions and ranked your top 3. Mark this category as complete?"
**And** I see "Confirm" and "Cancel" buttons

### AC5: Successful Completion
**Given** I confirm completion in the dialog
**When** the action processes
**Then** the category is marked complete for me (sets `judging_completed_at` timestamp)
**And** I see a success message "Category marked as complete"
**And** I can no longer edit ratings, feedback, or rankings (read-only enforcement)

### AC6: Admin Email Notification
**Given** the category is marked complete
**When** the system processes
**Then** an email notification is sent to the Super Admin via Brevo
**And** the email contains: judge name, contest name, category name, completion timestamp

### AC7: Dashboard Complete Badge
**Given** the category is marked complete
**When** I view it on my judge dashboard
**Then** I see a "Complete" badge on the category card
**And** the "Start Reviewing" button changes to "View Reviews" (read-only)

### AC8: Read-Only Mode on Completed Category
**Given** the category is marked complete
**When** I navigate to the category review page
**Then** I can still view my reviews and rankings
**And** the submission review page shows ratings/feedback as read-only (no editing)
**And** the ranking page shows rankings as read-only (no drag-and-drop, no save button)
**And** the "Mark as Complete" button is replaced with a "Completed" indicator with timestamp

### AC9: Database Migration
**Given** the database migration runs for this story
**When** I check the schema
**Then** `categories` table has a new `judging_completed_at` TIMESTAMPTZ column (nullable)
**And** an RPC function `mark_category_complete(p_category_id UUID)` exists that:
  - Verifies caller is the assigned judge
  - Verifies all submissions have reviews
  - Verifies 3 rankings exist
  - Sets `judging_completed_at = now()`
  - Returns success/error

**Requirements:** FR47, FR48, NFR26

## Tasks / Subtasks

- [x] Task 1: Database migration - Add `judging_completed_at` column (AC9)
  - [x]1.1 Create migration: `npx supabase migration new add_judging_completed_at`
  - [x]1.2 SQL: `ALTER TABLE public.categories ADD COLUMN judging_completed_at TIMESTAMPTZ DEFAULT NULL`
  - [x]1.3 Add database trigger on `reviews` table to prevent INSERT/UPDATE/DELETE when category is completed (joins through submissions → categories where `judging_completed_at IS NOT NULL`)
  - [x]1.4 Add database trigger on `rankings` table to prevent INSERT/UPDATE/DELETE when category is completed (direct `category_id` → categories where `judging_completed_at IS NOT NULL`)
  - [x]1.5 Apply migration: `npx supabase db push`

- [x] Task 2: RPC function - `mark_category_complete` (AC9)
  - [x]2.1 Create migration: `npx supabase migration new add_mark_category_complete_rpc`
  - [x]2.2 SQL: SECURITY DEFINER function with `SET search_path = public`
  - [x]2.3 Validates: `auth.uid()` matches `categories.assigned_judge_id`
  - [x]2.4 Validates: all submitted submissions have reviews by this judge
  - [x]2.5 Validates: 3 rankings exist for this judge + category
  - [x]2.6 Validates: not already completed (`judging_completed_at IS NULL`)
  - [x]2.7 Sets `judging_completed_at = now()` on success
  - [x]2.8 Returns JSON `{success: true/false, error?: string, completed_at?: string}`
  - [x]2.9 Apply migration: `npx supabase db push`

- [x] Task 3: Edge Function - `notify-admin-category-complete` (AC6)
  - [x]3.1 Create `supabase/functions/notify-admin-category-complete/index.ts`
  - [x]3.2 Follow `send-judge-invitation` pattern (auth check, service role client, Brevo API)
  - [x]3.3 Verify caller is authenticated judge (same pattern as send-judge-invitation verifies admin)
  - [x]3.4 Fetch category details with contest/division context (join through divisions → contests)
  - [x]3.5 Fetch judge profile (first_name, last_name, email) from `auth.uid()`
  - [x]3.6 Fetch all admin emails: `SELECT email, first_name FROM profiles WHERE role = 'admin'`
  - [x]3.7 Send email to each admin via Brevo API with: judge name, contest name, category name, completion timestamp, link to admin dashboard
  - [x]3.8 Return `{success: true/false, error?: string}`

- [x] Task 4: Update TypeScript types (AC9)
  - [x]4.1 Update `src/features/categories/types/category.types.ts`:
    - Add `judging_completed_at: string | null` to `CategoryRow`
    - Add `judgingCompletedAt: string | null` to `Category`
    - Update `transformCategory` to map the new field
  - [x]4.2 Update `src/features/notifications/types/notification.types.ts`:
    - Add `CategoryCompletePayload` interface: `{ categoryId: string }`
    - Add `CategoryCompleteResponse` interface: `{ success: boolean; error?: string }`

- [x] Task 5: Create API method and mutation hook (AC5)
  - [x]5.1 Add `markCategoryComplete(categoryId: string)` to `src/features/categories/api/categoriesApi.ts`:
    - Calls `mark_category_complete` RPC via `supabase.rpc()`
    - On RPC success, calls `notify-admin-category-complete` Edge Function via `supabase.functions.invoke()`
    - Returns combined result (email failure should NOT fail the overall operation)
  - [x]5.2 Create `src/features/categories/hooks/useMarkCategoryComplete.ts`:
    - TanStack mutation hook wrapping `categoriesApi.markCategoryComplete`
    - On success: invalidates `['categories', 'judge', judgeId]` query (refreshes dashboard)
    - On success: invalidates `['rankings', categoryId]` query (triggers re-render)

- [x] Task 6: Modify `CategoryReviewPage` - Mark as Complete section (AC1, AC2, AC3, AC4, AC5, AC8)
  - [x]6.1 Import `useRankings` hook to check if rankings exist
  - [x]6.2 Import `useMarkCategoryComplete` mutation hook
  - [x]6.3 Import `AlertDialog` components from `@/components/ui`
  - [x]6.4 Compute completion state:
    - `allReviewed = progress.pending === 0`
    - `hasRankings = rankings?.length === 3`
    - `isCompleted = !!category?.judgingCompletedAt`
    - `canComplete = allReviewed && hasRankings && !isCompleted`
  - [x]6.5 Add completion section below "Proceed to Ranking" button:
    - If `isCompleted`: Show "Completed on {date}" indicator with CheckCircle icon and timestamp
    - If `canComplete`: Show enabled "Mark as Complete" AlertDialog trigger button
    - If `!allReviewed`: Show disabled button with "Review all submissions before completing"
    - If `allReviewed && !hasRankings`: Show disabled button with "Rank your top 3 before completing"
  - [x]6.6 AlertDialog content: "You reviewed {total} submissions and ranked your top 3. Mark this category as complete?" with Confirm/Cancel
  - [x]6.7 On confirm: call `markCategoryComplete.mutate(categoryId)`, show success/error toast
  - [x]6.8 Read-only mode when `isCompleted`: hide "Proceed to Ranking" button, show completion indicator, add read-only banner at top

- [x] Task 7: Modify `RankingPage` - Read-only mode (AC8)
  - [x]7.1 Fetch category completion status (check `judgingCompletedAt` from categories cache or new query)
  - [x]7.2 When completed: disable all drag-and-drop interactions (`DndContext` sensors set to empty array or remove `onDragEnd`)
  - [x]7.3 When completed: hide "Save Rankings" button
  - [x]7.4 When completed: show "Category completed" banner at top with timestamp
  - [x]7.5 When completed: hide remove buttons on RankingSlots

- [x] Task 8: Modify `SubmissionReviewPage` - Read-only mode (AC8)
  - [x]8.1 Check category completion status
  - [x]8.2 When completed: disable rating scale (no clicking/selecting)
  - [x]8.3 When completed: make feedback textarea read-only (`readOnly` prop)
  - [x]8.4 When completed: hide "Save & Next" button, show "Next" navigation only
  - [x]8.5 When completed: show read-only banner

- [x] Task 9: Modify `DashboardPage` - Complete badge (AC7)
  - [x]9.1 Update `CategoryCard` component to check `judgingCompletedAt`
  - [x]9.2 When completed: show `<Badge variant="default">Complete</Badge>` (green) instead of "Closed"
  - [x]9.3 When completed: change button from "Start Reviewing" to "View Reviews"
  - [x]9.4 When completed: keep button enabled (judge can still view read-only)
  - [x]9.5 Update stats: add "Completed" stat card or modify existing counts

- [x] Task 10: Update feature exports
  - [x]10.1 Export `useMarkCategoryComplete` from `src/features/categories/hooks/index.ts` (if exists) or `src/features/categories/index.ts`
  - [x]10.2 Export new notification types from `src/features/notifications/index.ts`

- [x] Task 11: Create tests
  - [x]11.1 Update `src/pages/judge/CategoryReviewPage.test.tsx`:
    - "Mark as Complete" button disabled when reviews incomplete
    - "Mark as Complete" button disabled when rankings missing
    - "Mark as Complete" button enabled when all reviewed + 3 rankings
    - Confirmation dialog shows review count
    - Success state: completion indicator replaces button
    - Read-only mode: "Proceed to Ranking" hidden when completed
  - [x]11.2 Create `src/features/categories/hooks/useMarkCategoryComplete.test.ts`:
    - Calls RPC on mutate
    - Invalidates category and rankings queries on success
    - Handles RPC errors gracefully
  - [x]11.3 Update `src/pages/judge/DashboardPage.test.tsx`:
    - Completed category shows "Complete" badge
    - Completed category shows "View Reviews" button
  - [x]11.4 Update `src/pages/judge/RankingPage.test.tsx`:
    - Read-only mode: no drag-and-drop when completed
    - Read-only mode: no save button when completed
    - Shows completion banner when completed

- [x] Task 12: Run quality gates
  - [x]12.1 `npm run build` passes
  - [x]12.2 `npm run lint` passes
  - [x]12.3 `npm run type-check` passes
  - [x]12.4 `npm run test` passes (all existing + new tests)
  - [x]12.5 Manual smoke test: complete all reviews → save rankings → "Mark as Complete" appears → click → confirm → success toast → read-only mode activated → dashboard shows "Complete" badge
  - [x]12.6 Verify migration: `npx supabase migration list`

### Review Follow-ups (AI)
- [x] [AI-Review][HIGH] Lock down `notify-admin-category-complete` to judges assigned to the category (verify role + assigned_judge_id matches auth.uid()) to prevent any authenticated user from spamming admin emails. [supabase/functions/notify-admin-category-complete/index.ts:23-115]
- [x] [AI-Review][MEDIUM] Prevent email sends when `judging_completed_at` is NULL (fail fast instead of sending with `new Date()` fallback). [supabase/functions/notify-admin-category-complete/index.ts:58-130]
- [x] [AI-Review][MEDIUM] Match AC4 dialog copy exactly: "You reviewed X submissions and ranked your top 3. Mark this category as complete?" [src/pages/judge/CategoryReviewPage.tsx:228-233]
- [x] [AI-Review][MEDIUM] Update SubmissionReviewPage tests to mock `useCategoriesByJudge` and cover read-only mode behaviors. [src/pages/judge/SubmissionReviewPage.test.tsx:24-98]
- [x] [AI-Review][MEDIUM] Add read-only mode coverage to RankingPage tests (banner + no save + no DnD). [src/pages/judge/RankingPage.test.tsx:1-200]
- [x] [AI-Review][MEDIUM] Populate Dev Agent Record → File List to reflect actual git changes for this story (currently empty). [_bmad-output/implementation-artifacts/5-6-mark-category-complete-notify-admin.md:696-706]

## Dev Notes

### Architecture Requirements

**Completion Flow (2-step: RPC + Edge Function):**

```
Judge clicks "Mark as Complete"
  → AlertDialog confirmation
  → Client calls mark_category_complete RPC
    → Server validates: assigned judge + all reviewed + 3 rankings
    → Sets judging_completed_at = now()
  → On RPC success, client calls notify-admin-category-complete Edge Function
    → Edge Function sends Brevo email to all admins
    → Email failure does NOT undo the completion (fire-and-forget)
  → Client invalidates queries → UI updates to read-only
```

**Read-Only Enforcement (Defense in Depth):**
1. **Database layer:** Triggers on `reviews` and `rankings` tables block modifications when `categories.judging_completed_at IS NOT NULL`
2. **Frontend layer:** UI components check `judgingCompletedAt` and disable editing

### Dependencies from Stories 5-1 through 5-5 (Already Implemented)

| Asset | Location | Usage |
|-------|----------|-------|
| `useSubmissionsForReview` hook | `@/features/reviews` | USE AS-IS: `progress.pending` for completion check |
| `useRankings` hook | `@/features/reviews` | USE AS-IS: `rankings.length === 3` for completion check |
| `ReviewProgress` component | `@/features/reviews` | USE AS-IS: shows review progress |
| `CategoryReviewPage` | `src/pages/judge/CategoryReviewPage.tsx` | MODIFY: add Mark as Complete section |
| `RankingPage` | `src/pages/judge/RankingPage.tsx` | MODIFY: add read-only mode |
| `DashboardPage` | `src/pages/judge/DashboardPage.tsx` | MODIFY: add Complete badge |
| `useCategoriesByJudge` hook | `@/features/categories` | USE AS-IS: provides `judgingCompletedAt` after type update |
| `categoriesApi` | `@/features/categories` | MODIFY: add `markCategoryComplete` method |
| `CategoryRow` / `Category` types | `@/features/categories` | MODIFY: add `judging_completed_at` / `judgingCompletedAt` |
| `transformCategory` function | `@/features/categories` | MODIFY: map new field |
| `AlertDialog` component | `@/components/ui` | USE AS-IS: confirmation dialog |
| `Badge` component | `@/components/ui` | USE AS-IS: "Complete" badge |
| `send-judge-invitation` Edge Function | `supabase/functions/` | REFERENCE ONLY: pattern for new Edge Function |
| `save_rankings` RPC | `supabase/migrations/` | REFERENCE ONLY: pattern for new RPC |
| `sonner` toast library | already installed | USE: success/error feedback |
| `notification.types.ts` | `@/features/notifications` | MODIFY: add `CategoryCompletePayload` |

### Database Migration: `judging_completed_at` Column

```sql
-- Add completion tracking to categories
ALTER TABLE public.categories
ADD COLUMN judging_completed_at TIMESTAMPTZ DEFAULT NULL;

-- Index for queries filtering completed/incomplete
CREATE INDEX idx_categories_judging_completed
  ON public.categories(judging_completed_at)
  WHERE judging_completed_at IS NOT NULL;

-- Trigger: Prevent review modifications on completed categories
CREATE OR REPLACE FUNCTION public.prevent_review_modification_on_completed()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM categories c
    JOIN submissions s ON s.category_id = c.id
    WHERE s.id = COALESCE(NEW.submission_id, OLD.submission_id)
    AND c.judging_completed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Cannot modify reviews for a completed category';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_review_modification
  BEFORE INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_review_modification_on_completed();

-- Trigger: Prevent ranking modifications on completed categories
CREATE OR REPLACE FUNCTION public.prevent_ranking_modification_on_completed()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM categories
    WHERE id = COALESCE(NEW.category_id, OLD.category_id)
    AND judging_completed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Cannot modify rankings for a completed category';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_ranking_modification
  BEFORE INSERT OR UPDATE OR DELETE ON public.rankings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_ranking_modification_on_completed();
```

### RPC Function: `mark_category_complete`

```sql
CREATE OR REPLACE FUNCTION public.mark_category_complete(p_category_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_judge_id UUID;
  v_completed_at TIMESTAMPTZ;
  v_total_submissions INT;
  v_total_reviews INT;
  v_total_rankings INT;
BEGIN
  v_judge_id := auth.uid();

  -- Verify caller is assigned judge and get current completion status
  SELECT judging_completed_at INTO v_completed_at
  FROM categories
  WHERE id = p_category_id AND assigned_judge_id = v_judge_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'NOT_ASSIGNED_JUDGE');
  END IF;

  -- Check not already completed
  IF v_completed_at IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'ALREADY_COMPLETED');
  END IF;

  -- Count submitted submissions in category
  SELECT COUNT(*) INTO v_total_submissions
  FROM submissions
  WHERE category_id = p_category_id AND status = 'submitted';

  IF v_total_submissions = 0 THEN
    RETURN json_build_object('success', false, 'error', 'NO_SUBMISSIONS');
  END IF;

  -- Count reviews by this judge for submissions in this category
  SELECT COUNT(*) INTO v_total_reviews
  FROM reviews r
  JOIN submissions s ON s.id = r.submission_id
  WHERE s.category_id = p_category_id AND r.judge_id = v_judge_id;

  IF v_total_reviews < v_total_submissions THEN
    RETURN json_build_object('success', false, 'error', 'REVIEWS_INCOMPLETE');
  END IF;

  -- Count rankings by this judge for this category
  SELECT COUNT(*) INTO v_total_rankings
  FROM rankings
  WHERE category_id = p_category_id AND judge_id = v_judge_id;

  IF v_total_rankings < 3 THEN
    RETURN json_build_object('success', false, 'error', 'RANKINGS_INCOMPLETE');
  END IF;

  -- Mark complete
  UPDATE categories
  SET judging_completed_at = now()
  WHERE id = p_category_id;

  RETURN json_build_object('success', true, 'completed_at', now()::text);
END;
$$;
```

### Edge Function: `notify-admin-category-complete`

Follow `send-judge-invitation` Edge Function pattern exactly:
1. CORS handling (same headers)
2. Verify caller authenticated via JWT
3. Create service role client for admin queries
4. Fetch category details: name, contest name (join through divisions → contests)
5. Fetch judge profile: `profiles` WHERE `id = auth.uid()`
6. Fetch admin emails: `profiles` WHERE `role = 'admin'`
7. Send Brevo email to each admin with HTML template containing:
   - Judge name (first_name + last_name)
   - Contest name
   - Category name
   - Completion timestamp
   - Link to admin dashboard (using `APP_URL` env var)
8. Return `{success: true/false}`

**Environment Variables (same as send-judge-invitation, already configured):**
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `APP_URL`

**Email Template Structure:**
```
Subject: "Judge completed: {categoryName} - {contestName}"

Body:
- Header: "Judging Complete!"
- Judge: {judgeName} has completed judging for:
- Category: {categoryName}
- Contest: {contestName}
- Completed at: {timestamp}
- Submissions reviewed: {count}
- CTA: "View Results" → links to admin dashboard
```

### API Method: `markCategoryComplete`

```typescript
// In categoriesApi.ts
async markCategoryComplete(categoryId: string): Promise<{ success: boolean; completedAt?: string; error?: string }> {
  // Step 1: Call RPC to validate and mark complete
  const { data, error } = await supabase.rpc('mark_category_complete', {
    p_category_id: categoryId,
  });

  if (error) throw error;

  // RPC returns JSON with success/error
  const result = data as { success: boolean; error?: string; completed_at?: string };
  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Step 2: Trigger admin notification (fire-and-forget, failure doesn't undo completion)
  try {
    await supabase.functions.invoke('notify-admin-category-complete', {
      body: { categoryId },
    });
  } catch (emailError) {
    console.warn('Admin notification failed (non-blocking):', emailError);
  }

  return { success: true, completedAt: result.completed_at };
}
```

### Mutation Hook: `useMarkCategoryComplete`

```typescript
// src/features/categories/hooks/useMarkCategoryComplete.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts';
import { categoriesApi } from '../api/categoriesApi';

export function useMarkCategoryComplete() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (categoryId: string) =>
      categoriesApi.markCategoryComplete(categoryId),
    onSuccess: (_data, categoryId) => {
      // Invalidate judge dashboard categories (refreshes judgingCompletedAt)
      queryClient.invalidateQueries({ queryKey: ['categories', 'judge', user?.id] });
      // Invalidate rankings cache for read-only enforcement
      queryClient.invalidateQueries({ queryKey: ['rankings', categoryId] });
    },
  });
}
```

### CategoryReviewPage Completion Section

```typescript
// New imports needed:
import { CheckCircle2, Flag } from 'lucide-react';
import { useRankings } from '@/features/reviews';
import { useMarkCategoryComplete } from '@/features/categories';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui';

// In component body:
const { data: rankings } = useRankings(categoryId);
const markComplete = useMarkCategoryComplete();

const allReviewed = progress.pending === 0;
const hasRankings = (rankings?.length ?? 0) >= 3;
const isCompleted = !!category?.judgingCompletedAt;
const canComplete = allReviewed && hasRankings && !isCompleted;

// Completion section (placed after "Proceed to Ranking" section):
{isCompleted ? (
  <div className="flex items-center justify-center gap-2 text-green-600 py-4">
    <CheckCircle2 className="h-5 w-5" />
    <span className="font-medium">
      Completed on {new Date(category.judgingCompletedAt!).toLocaleDateString()}
    </span>
  </div>
) : submissions && submissions.length > 0 ? (
  <div className="flex flex-col items-center gap-2 pt-2">
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          disabled={!canComplete || markComplete.isPending}
          variant="default"
          className="gap-2 w-full sm:w-auto"
        >
          <Flag className="h-4 w-4" />
          {markComplete.isPending ? 'Marking...' : 'Mark as Complete'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark Category as Complete?</AlertDialogTitle>
          <AlertDialogDescription>
            You reviewed {progress.total} submissions and ranked your top 3.
            Once marked as complete, you will no longer be able to edit your
            ratings, feedback, or rankings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => markComplete.mutate(categoryId!)}>
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    {!allReviewed && (
      <p className="text-sm text-muted-foreground">Review all submissions before completing</p>
    )}
    {allReviewed && !hasRankings && (
      <p className="text-sm text-muted-foreground">Rank your top 3 before completing</p>
    )}
  </div>
) : null}
```

### Dashboard CategoryCard Completion Updates

```typescript
// In CategoryCard component (DashboardPage.tsx):
const isCompleted = !!category.judgingCompletedAt;

// Badge: replace status badge when completed
<Badge variant={isCompleted ? 'default' : isClosed ? 'default' : 'secondary'}>
  {isCompleted ? 'Complete' : isClosed ? 'Closed' : 'Published'}
</Badge>

// Button: change label when completed
<Button
  onClick={onStartReviewing}
  disabled={!isClosed && !isCompleted}
  variant={isClosed || isCompleted ? 'default' : 'outline'}
>
  <Play className="mr-2 h-4 w-4" />
  {isCompleted ? 'View Reviews' : isClosed ? 'Start Reviewing' : 'Not Ready'}
</Button>
```

### RankingPage Read-Only Mode

```typescript
// In RankingPage.tsx:
// Get completion status from categories cache
const { data: categories } = useCategoriesByJudge(user?.id);
const category = categories?.find((c) => c.id === categoryId);
const isCompleted = !!category?.judgingCompletedAt;

// Disable DndContext when completed
const sensors = useSensors(
  ...(!isCompleted ? [
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  ] : [])
);

// Hide "Save Rankings" button when completed
// Hide remove buttons on RankingSlots when completed
// Show completion banner at top
```

### Type Updates Required

```typescript
// In category.types.ts:
export interface CategoryRow {
  // ... existing fields ...
  judging_completed_at: string | null;  // NEW
}

export interface Category {
  // ... existing fields ...
  judgingCompletedAt: string | null;  // NEW
}

// In transformCategory:
const baseCategory = {
  // ... existing fields ...
  judgingCompletedAt: row.judging_completed_at,  // NEW
};
```

### SubmissionReviewPage Read-Only Pattern

Check if SubmissionReviewPage exists at `src/pages/judge/SubmissionReviewPage.tsx`. Pass `isReadOnly` based on `category.judgingCompletedAt`:
- Disable RatingScale click handlers
- Set `readOnly` attribute on feedback textarea
- Replace "Save & Next" with navigation-only button
- Show subtle "Read-only: Category completed" banner

### Project Structure Notes

- All category-related changes stay in `src/features/categories/`
- Edge Function follows existing structure in `supabase/functions/`
- No new features folder needed — extends categories + reviews
- Import from `@/features/categories` and `@/features/reviews` NOT deep paths
- Export all new hooks/types from feature index immediately

### Reuse from Previous Stories (DO NOT RECREATE)

- `useSubmissionsForReview` hook — USE AS-IS: `progress` object for completion check
- `useRankings` hook — USE AS-IS: check `rankings.length === 3`
- `useCategoriesByJudge` hook — USE AS-IS: provides category data including new `judgingCompletedAt`
- `AlertDialog` components — USE AS-IS from `@/components/ui`
- `Badge` component — USE AS-IS for "Complete" badge
- `toast` from `sonner` — USE AS-IS for success/error feedback
- Brevo API pattern — REFERENCE `send-judge-invitation` Edge Function
- RPC pattern — REFERENCE `save_rankings` and `mark_category_complete` structure
- `CheckCircle2`, `Flag`, `Eye` icons from `lucide-react`

### Testing Guidance

**CategoryReviewPage.test.tsx (update):**
1. "Mark as Complete" button disabled when `progress.pending > 0`
2. "Mark as Complete" button disabled when rankings.length < 3
3. "Mark as Complete" button enabled when all reviewed + 3 rankings
4. AlertDialog shows review count on click
5. On confirm: calls mutation, shows success toast
6. Completed state: shows "Completed on {date}" indicator
7. Completed state: hides "Proceed to Ranking" button

**useMarkCategoryComplete.test.ts (new):**
1. Calls `mark_category_complete` RPC with category ID
2. Invalidates category and rankings queries on success
3. Returns error when RPC fails

**DashboardPage.test.tsx (update):**
1. Completed category shows "Complete" badge
2. Completed category shows "View Reviews" button text
3. Completed category button is still enabled (for viewing)

**RankingPage.test.tsx (update):**
1. Read-only mode: no drag-and-drop interactions
2. Read-only mode: no "Save Rankings" button
3. Shows completion banner

**Testing Notes:**
- Mock `useRankings` to return 3 rankings for completion tests
- Mock `useMarkCategoryComplete` mutation for CategoryReviewPage tests
- Mock `useCategoriesByJudge` with `judgingCompletedAt` set for read-only tests
- Edge Function tested manually (email delivery verification)

### Quality Gates

```bash
# Git (REQUIRED)
git status          # Must show clean
git log --oneline -5  # Verify commits have "5-6:" prefix
git push -u origin story/5-6-mark-category-complete-notify-admin

# Build (REQUIRED)
npm run build       # Must pass
npm run lint        # Must pass
npm run type-check  # Must pass
npm run test        # Must pass

# Migration (REQUIRED)
npx supabase migration list  # Verify both migrations applied
```

### References

- [Source: epic-5-judging-evaluation-workflow.md#Story 5.6]
- [Source: 5-5-top-3-ranking-drag-drop.md] (previous story — rankings, @dnd-kit, 735 tests)
- [Source: src/pages/judge/CategoryReviewPage.tsx] (primary modification target)
- [Source: src/pages/judge/DashboardPage.tsx] (Complete badge)
- [Source: src/features/categories/types/category.types.ts] (CategoryRow, Category, transformCategory)
- [Source: src/features/categories/api/categoriesApi.ts] (add markCategoryComplete method)
- [Source: src/features/reviews/hooks/useRankings.ts] (rankings completion check)
- [Source: src/features/reviews/hooks/useSubmissionsForReview.ts] (progress tracking)
- [Source: supabase/functions/send-judge-invitation/index.ts] (Edge Function pattern)
- [Source: supabase/migrations/20260131230000_add_save_rankings_rpc.sql] (RPC pattern)
- [Source: project-context.md#Supabase Setup] (migration commands — online only)
- [Source: project-context.md#Supabase Security Rules] (SECURITY DEFINER + SET search_path)
- [Source: project-context.md#Anonymous Judging Rules] (no PII in judge queries)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
