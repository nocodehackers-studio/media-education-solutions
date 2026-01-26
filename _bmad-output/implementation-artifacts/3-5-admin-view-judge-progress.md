# Story 3.5: Admin View Judge Progress

Status: review

## Story

As a **Super Admin**,
I want **to see how many submissions each judge has reviewed**,
So that **I can track judging progress**.

## Acceptance Criteria

### AC1: Judges Tab Shows Categories with Judges
**Given** I am on the contest Judges tab
**When** the page loads
**Then** I see a list of all categories with their assigned judges
**And** each row shows: category name, judge email (or "Unassigned"), progress

### AC2: Progress Display
**Given** a judge has reviewed some submissions
**When** I view the Judges tab
**Then** I see progress as "X / Y reviewed" (e.g., "5 / 12 reviewed")
**And** a progress bar visualizes the percentage

### AC3: Complete Status Display
**Given** a judge has completed all reviews
**When** I view the Judges tab
**Then** the progress shows "Complete" with a checkmark
**And** the row is visually marked as done (green highlight or badge)

### AC4: Unassigned Category Display
**Given** a category has no judge assigned
**When** I view the Judges tab
**Then** I see "No judge assigned" in the judge column
**And** an "Assign" button is available

### AC5: Judge Detail View
**Given** I click on a judge's email
**When** the action triggers
**Then** I can see detailed review status (which submissions reviewed/pending)

## Developer Context

### Architecture Requirements

**Database State:**
- Categories have `assigned_judge_id` (FK to profiles, nullable)
- Submissions exist once participants upload
- **Reviews table does NOT exist until Epic 5** - implement gracefully

**Implementation Strategy:**
- Phase 1: Display categories with judge assignments and submission counts
- Phase 2: Add review progress once reviews table exists (Epic 5)
- For now: Show "0 / X reviewed" or "Awaiting judging" for all categories

### Technical Requirements

**Feature Location:** Extend `src/features/categories/` and update existing tab

**New/Modified Files:**
```
src/pages/admin/
└── ContestDetailPage.tsx              # MODIFY: Replace Judges tab placeholder

src/features/categories/
├── components/
│   ├── JudgesTab.tsx                  # NEW: Main tab component
│   ├── JudgesTable.tsx                # NEW: Table display
│   ├── JudgeProgressCell.tsx          # NEW: Progress bar + text
│   └── JudgeDetailSheet.tsx           # NEW: Detail modal (AC5)
├── hooks/
│   ├── useJudgeProgress.ts            # NEW: Query for review progress
│   └── index.ts                       # MODIFY: Export new hooks
├── types/
│   └── category.types.ts              # MODIFY: Add JudgeProgress type
└── index.ts                           # MODIFY: Export new components
```

### Existing Code to Leverage

**ContestDetailPage.tsx - Judges Tab Placeholder (lines 116-157):**
```typescript
// Current placeholder - replace with JudgesTab component
<TabsContent value="judges" className="space-y-4">
  <Card>
    <CardHeader>
      <CardTitle>Judges</CardTitle>
      <CardDescription>
        View and manage judge assignments and progress
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">
        Judge management coming soon...
      </p>
    </CardContent>
  </Card>
</TabsContent>
```

**Category Data Already Includes Judge (categoriesApi.listByContest):**
```typescript
// Already fetches assignedJudge via join
.select(`
  *,
  assigned_judge:profiles!categories_assigned_judge_id_fkey (
    id, email, first_name, last_name
  )
`)
```

**AssignJudgeSheet Component (existing, reuse for AC4):**
```typescript
// src/features/categories/components/AssignJudgeSheet.tsx
// Provides form to assign judge to category
import { AssignJudgeSheet } from '@/features/categories';
```

### JudgesTab Implementation

**src/features/categories/components/JudgesTab.tsx:**

```typescript
import { useCategories } from '@/features/categories';
import { JudgesTable } from './JudgesTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components/ui';

interface JudgesTabProps {
  contestId: string;
}

export function JudgesTab({ contestId }: JudgesTabProps) {
  const { data: divisions, isLoading, error } = useCategories(contestId);

  if (isLoading) {
    return <JudgesTabSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-destructive">Failed to load judge data</p>
        </CardContent>
      </Card>
    );
  }

  // Flatten categories from all divisions
  const categories = divisions?.flatMap((d) => d.categories) || [];

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No categories in this contest yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Judge Assignments</CardTitle>
        <CardDescription>
          Track judging progress across all categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <JudgesTable categories={categories} contestId={contestId} />
      </CardContent>
    </Card>
  );
}

function JudgesTabSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### JudgesTable Implementation

**src/features/categories/components/JudgesTable.tsx:**

```typescript
import { useState } from 'react';
import { type Category, AssignJudgeSheet } from '@/features/categories';
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { CheckCircle, UserPlus } from 'lucide-react';
import { JudgeProgressCell } from './JudgeProgressCell';
import { JudgeDetailSheet } from './JudgeDetailSheet';

interface JudgesTableProps {
  categories: Category[];
  contestId: string;
}

export function JudgesTable({ categories, contestId }: JudgesTableProps) {
  const [assigningCategoryId, setAssigningCategoryId] = useState<string | null>(null);
  const [viewingJudge, setViewingJudge] = useState<{
    judgeId: string;
    judgeName: string;
    categoryId: string;
    categoryName: string;
  } | null>(null);

  const assigningCategory = categories.find((c) => c.id === assigningCategoryId);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Judge</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              {/* Category Name */}
              <TableCell className="font-medium">{category.name}</TableCell>

              {/* Judge Email (AC1, AC4, AC5) */}
              <TableCell>
                {category.assignedJudge ? (
                  <button
                    className="text-primary hover:underline cursor-pointer text-left"
                    onClick={() =>
                      setViewingJudge({
                        judgeId: category.assignedJudge!.id,
                        judgeName: category.assignedJudge!.email,
                        categoryId: category.id,
                        categoryName: category.name,
                      })
                    }
                  >
                    {category.assignedJudge.email}
                  </button>
                ) : (
                  <span className="text-muted-foreground">No judge assigned</span>
                )}
              </TableCell>

              {/* Progress (AC2) */}
              <TableCell>
                {category.assignedJudge ? (
                  <JudgeProgressCell categoryId={category.id} />
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>

              {/* Status (AC3) */}
              <TableCell>
                <JudgeStatusBadge categoryId={category.id} hasJudge={!!category.assignedJudge} />
              </TableCell>

              {/* Actions (AC4) */}
              <TableCell>
                {!category.assignedJudge && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAssigningCategoryId(category.id)}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Assign
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Assign Judge Sheet (reuse existing) */}
      {assigningCategory && (
        <AssignJudgeSheet
          open={!!assigningCategoryId}
          onOpenChange={(open) => !open && setAssigningCategoryId(null)}
          category={assigningCategory}
        />
      )}

      {/* Judge Detail Sheet (AC5) */}
      {viewingJudge && (
        <JudgeDetailSheet
          open={!!viewingJudge}
          onOpenChange={(open) => !open && setViewingJudge(null)}
          judgeId={viewingJudge.judgeId}
          judgeName={viewingJudge.judgeName}
          categoryId={viewingJudge.categoryId}
          categoryName={viewingJudge.categoryName}
        />
      )}
    </>
  );
}

// Status badge component
function JudgeStatusBadge({
  categoryId,
  hasJudge,
}: {
  categoryId: string;
  hasJudge: boolean;
}) {
  // TODO: Once reviews table exists, check if all reviews complete
  // For now, show "Awaiting" for assigned judges, nothing for unassigned

  if (!hasJudge) {
    return <Badge variant="outline">Unassigned</Badge>;
  }

  // Placeholder until Epic 5 - reviews table doesn't exist yet
  // Once it does: query review count vs submission count
  return <Badge variant="secondary">Awaiting</Badge>;
}
```

### JudgeProgressCell Implementation

**src/features/categories/components/JudgeProgressCell.tsx:**

```typescript
import { useJudgeProgress } from '@/features/categories';
import { CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui';

interface JudgeProgressCellProps {
  categoryId: string;
}

export function JudgeProgressCell({ categoryId }: JudgeProgressCellProps) {
  const { data: progress, isLoading } = useJudgeProgress(categoryId);

  if (isLoading) {
    return <Skeleton className="h-4 w-24" />;
  }

  // Handle case where reviews table doesn't exist yet
  if (!progress) {
    return <span className="text-sm text-muted-foreground">Awaiting judging</span>;
  }

  const { reviewed, total } = progress;
  const percentage = total > 0 ? (reviewed / total) * 100 : 0;
  const isComplete = reviewed === total && total > 0;

  // Complete state (AC3)
  if (isComplete) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Complete</span>
      </div>
    );
  }

  // Progress bar (AC2)
  return (
    <div className="flex items-center gap-3 min-w-[140px]">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {reviewed} / {total}
      </span>
    </div>
  );
}
```

### useJudgeProgress Hook

**src/features/categories/hooks/useJudgeProgress.ts:**

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface JudgeProgress {
  reviewed: number;
  total: number;
}

/**
 * Fetches review progress for a category
 * Returns submission count and review count
 * NOTE: Reviews table created in Epic 5 - returns null until then
 */
export function useJudgeProgress(categoryId: string) {
  return useQuery({
    queryKey: ['judge-progress', categoryId],
    queryFn: async (): Promise<JudgeProgress | null> => {
      // Get total submissions for category
      const { count: totalSubmissions, error: submissionError } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);

      if (submissionError) {
        // Table might not exist yet - return gracefully
        console.warn('Could not fetch submissions:', submissionError.message);
        return null;
      }

      // Get reviewed count (reviews table - Epic 5)
      // For now, return 0 reviewed since table doesn't exist
      // Once reviews table exists:
      // const { count: reviewed } = await supabase
      //   .from('reviews')
      //   .select('*', { count: 'exact', head: true })
      //   .eq('category_id', categoryId);

      return {
        reviewed: 0, // TODO: Update once reviews table exists
        total: totalSubmissions ?? 0,
      };
    },
    enabled: !!categoryId,
  });
}
```

### JudgeDetailSheet Implementation

**src/features/categories/components/JudgeDetailSheet.tsx:**

```typescript
import {
  Badge,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Skeleton,
} from '@/components/ui';
import { useJudgeProgress } from '@/features/categories';
import { CheckCircle, Clock } from 'lucide-react';

interface JudgeDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  judgeId: string;
  judgeName: string;
  categoryId: string;
  categoryName: string;
}

export function JudgeDetailSheet({
  open,
  onOpenChange,
  judgeId,
  judgeName,
  categoryId,
  categoryName,
}: JudgeDetailSheetProps) {
  const { data: progress, isLoading } = useJudgeProgress(categoryId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Judge Progress</SheetTitle>
          <SheetDescription>
            {judgeName} reviewing {categoryName}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Submissions</p>
              {isLoading ? (
                <Skeleton className="h-8 w-12 mt-1" />
              ) : (
                <p className="text-2xl font-bold">{progress?.total ?? 0}</p>
              )}
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Reviewed</p>
              {isLoading ? (
                <Skeleton className="h-8 w-12 mt-1" />
              ) : (
                <p className="text-2xl font-bold">{progress?.reviewed ?? 0}</p>
              )}
            </div>
          </div>

          {/* Submission List Placeholder */}
          <div className="space-y-2">
            <h3 className="font-medium">Submissions</h3>
            <p className="text-sm text-muted-foreground">
              Detailed submission review status will be available once judging begins (Epic 5).
            </p>
            {/* TODO: Epic 5 - List submissions with reviewed/pending status
            <div className="space-y-2">
              {submissions.map((submission) => (
                <div key={submission.id} className="flex items-center justify-between p-3 border rounded">
                  <span>Submission #{submission.id.slice(0, 8)}</span>
                  {submission.reviewed ? (
                    <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Reviewed</Badge>
                  ) : (
                    <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
                  )}
                </div>
              ))}
            </div>
            */}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

### ContestDetailPage Update

**Update src/pages/admin/ContestDetailPage.tsx:**

Replace the Judges tab placeholder:

```typescript
// Add import
import { JudgesTab } from '@/features/categories';

// Replace placeholder TabsContent (around line 149-157)
<TabsContent value="judges" className="space-y-4">
  <JudgesTab contestId={contestId} />
</TabsContent>
```

### Export Updates

**Update src/features/categories/components/index.ts:**
```typescript
export { JudgesTab } from './JudgesTab';
export { JudgesTable } from './JudgesTable';
export { JudgeProgressCell } from './JudgeProgressCell';
export { JudgeDetailSheet } from './JudgeDetailSheet';
```

**Update src/features/categories/hooks/index.ts:**
```typescript
export { useJudgeProgress } from './useJudgeProgress';
```

**Update src/features/categories/index.ts:**
```typescript
// Components
export { JudgesTab } from './components/JudgesTab';
// ... other exports

// Hooks
export { useJudgeProgress } from './hooks/useJudgeProgress';
```

### Previous Story Intelligence

**From Story 3-4 (Judge Login & Dashboard):**
- Added `CategoryWithContext` type with contest/division names
- Pattern for fetching categories with joins established
- Similar table/list display patterns

**From Story 3-1 (Assign Judge to Category):**
- `AssignJudgeSheet` component available for reuse
- Category has `assignedJudgeId` and `invitedAt` columns
- Judge assignment mutation: `useAssignJudge` hook

**From Story 3-2 (Judge Invitation Email):**
- Categories already include `assignedJudge` via join in API
- `invited_at` timestamp indicates invitation was sent

**From ContestDetailPage Pattern:**
- Tabs component with TabsList, TabsTrigger, TabsContent
- Card wrapper for each tab's content
- Consistent loading/error patterns

### Database Dependencies

**Existing Tables (available now):**
- `categories` - with `assigned_judge_id` FK
- `submissions` - for counting total submissions
- `profiles` - for judge info

**Future Tables (Epic 5):**
- `reviews` - for tracking which submissions reviewed

**Graceful Degradation:**
- Until `reviews` table exists, show "0 / X reviewed" or "Awaiting judging"
- Progress bar shows 0% until Epic 5 implementation
- Detail sheet shows placeholder message

### Testing Guidance

**Unit Tests (src/features/categories/components/JudgesTab.test.tsx):**

1. **Loading state:** Shows skeleton while fetching
2. **Empty state:** Shows message when no categories
3. **Categories with judges (AC1):** Displays category name, judge email
4. **Unassigned categories (AC4):** Shows "No judge assigned" + Assign button
5. **Progress display (AC2):** Shows "X / Y reviewed" with progress bar
6. **Complete status (AC3):** Shows checkmark and "Complete" when done
7. **Click judge email (AC5):** Opens JudgeDetailSheet
8. **Click Assign button:** Opens AssignJudgeSheet

**Mock Setup:**
```typescript
vi.mock('@/features/categories', async () => ({
  ...await vi.importActual('@/features/categories'),
  useCategories: vi.fn(() => ({
    data: mockDivisionsWithCategories,
    isLoading: false,
    error: null,
  })),
  useJudgeProgress: vi.fn(() => ({
    data: { reviewed: 5, total: 10 },
    isLoading: false,
  })),
}));
```

### Quality Gates

Before marking as "review":

```bash
# Git Status (REQUIRED)
git status          # Must show clean
git log --oneline -5  # Verify commits have "3-5:" prefix
git push -u origin story/3-5-admin-view-judge-progress

# Quality Gates (REQUIRED)
npm run build       # Must pass
npm run lint        # Must pass
npm run type-check  # Must pass
npm run test        # Must pass

# Manual Test (REQUIRED)
# 1. Navigate to /admin/contests/{id} → Judges tab
# 2. See table with all categories
# 3. Categories with judges show email (clickable)
# 4. Categories without judges show "No judge assigned" + Assign button
# 5. Click Assign → AssignJudgeSheet opens
# 6. Click judge email → JudgeDetailSheet opens with stats
# 7. Progress shows "0 / X" or "Awaiting judging" (reviews table not yet created)
```

### Reference Documents

- [Source: epic-3-judge-onboarding-assignment.md#Story 3.5]
- [Source: project-context.md#Feature Architecture]
- [Source: src/pages/admin/ContestDetailPage.tsx] (tab pattern)
- [Source: src/features/categories/components/AssignJudgeSheet.tsx] (reuse)
- [Source: src/features/contests/components/CodeListTable.tsx] (table pattern)
- [Source: 3-4-judge-login-dashboard.md#Developer Context]

## Tasks / Subtasks

- [x] Create JudgesTab component (AC1)
  - [x] Create src/features/categories/components/JudgesTab.tsx
  - [x] Implement loading skeleton
  - [x] Implement empty state
  - [x] Use useCategories to get flat list of categories

- [x] Create JudgesTable component (AC1, AC4)
  - [x] Create src/features/categories/components/JudgesTable.tsx
  - [x] Display category name, judge email, progress, status columns
  - [x] Show "No judge assigned" for unassigned categories
  - [x] Reuse AssignJudgeSheet (with built-in trigger button)

- [x] Create JudgeProgressCell component (AC2, AC3)
  - [x] Create src/features/categories/components/JudgeProgressCell.tsx
  - [x] Display progress bar with percentage
  - [x] Display "X / Y reviewed" text
  - [x] Show "Complete" with checkmark when done

- [x] Create useJudgeProgress hook
  - [x] Create src/features/categories/hooks/useJudgeProgress.ts
  - [x] Query submission count for category
  - [x] Return 0 reviewed until reviews table exists

- [x] Create JudgeDetailSheet component (AC5)
  - [x] Create src/features/categories/components/JudgeDetailSheet.tsx
  - [x] Display judge name and category
  - [x] Show total/reviewed stats
  - [x] Add placeholder for submission list (Epic 5)

- [x] Update ContestDetailPage
  - [x] Replace Judges tab placeholder with JudgesTab component
  - [x] Pass contestId prop

- [x] Update feature exports
  - [x] Export new components from components/index.ts
  - [x] Export useJudgeProgress from hooks/index.ts
  - [x] Export from main index.ts

- [x] Write unit tests
  - [x] Test JudgesTab loading/empty/success states
  - [x] Test JudgesTable row rendering
  - [x] Test progress cell variants
  - [x] Test sheet opening behavior

- [x] Run quality gates and verify

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - implementation went smoothly.

### Review Notes

- Adversarial review completed with 12 findings
- 5 findings fixed (F1, F3, F5, F9 + F2 TODO added)
- 7 findings skipped (LOW severity or noise)
- Resolution approach: Auto-fix

### Completion Notes

All acceptance criteria implemented:
- AC1: Categories with assigned judges display properly with email and progress
- AC2: Progress displays as "X / Y reviewed" with visual progress bar
- AC3: Complete status shows checkmark (ready for when reviews exist)
- AC4: Unassigned categories show "No judge assigned" with Assign button
- AC5: Clicking judge email opens JudgeDetailSheet with stats

Notes:
- Reviews table doesn't exist yet (Epic 5), so reviewed count is always 0
- Reused existing AssignJudgeSheet component which includes its own trigger button
- useCategories returns flat list directly from API (no division flattening needed)

### File List

**New Files:**
- src/features/categories/components/JudgesTab.tsx
- src/features/categories/components/JudgesTab.test.tsx
- src/features/categories/components/JudgesTable.tsx
- src/features/categories/components/JudgeProgressCell.tsx
- src/features/categories/components/JudgeDetailSheet.tsx
- src/features/categories/hooks/useJudgeProgress.ts

**Modified Files:**
- src/pages/admin/ContestDetailPage.tsx
- src/features/categories/components/index.ts
- src/features/categories/hooks/index.ts
- src/features/categories/index.ts
