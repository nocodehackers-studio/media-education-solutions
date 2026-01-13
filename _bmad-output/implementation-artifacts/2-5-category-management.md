# Story 2.5: Category Management

Status: review

## Story

As a **Super Admin**,
I want **to create and manage categories within a contest**,
So that **participants can submit to different competition types**.

## Acceptance Criteria

### AC1: Add Category (Contest Status Rules)
**Given** contest status is Draft or Published
**When** I click "Add Category" in the Categories tab
**Then** I see a form to create a new category (starts in Draft status)

**Given** contest status is Closed, Reviewed, or Finished
**When** I view the Categories tab
**Then** the "Add Category" button is disabled/hidden
**And** I see a message "Cannot add categories to a closed contest"

### AC2: Draft Category (Full Editing)
**Given** a category is in Draft status
**When** I view that category
**Then** I can edit all fields: name, type, deadline, rules, description
**And** I can delete the category

### AC3: Published/Closed Category (Read-Only)
**Given** a category is in Published or Closed status
**When** I view that category
**Then** all form fields are disabled (read-only)
**And** I can only change the status

### AC4: Status Change Rules (Submission-Based)
**Given** a category has 0 submissions
**When** I change its status
**Then** I can select: Draft, Published, or Closed

**Given** a category has 1+ submissions
**When** I change its status
**Then** I can only select: Published or Closed
**And** Draft option is disabled with tooltip "Cannot set to Draft - category has submissions"

### AC5: Automatic Deadline Closure
**Given** a category deadline has passed
**When** the page loads (or system checks)
**Then** the category status is automatically set to Closed
**Note:** Server-side enforcement via Edge Function or scheduled job is deferred. Client-side check on page load for MVP.

### AC6: Database Schema
**Given** the database migration runs for this story
**When** I check the schema
**Then** `categories` table exists with: id, contest_id, name, type (video/photo), deadline, rules, description, status, created_at
**And** RLS policies restrict access to authenticated admins only

## Developer Context

### Architecture Requirements

**Database Schema (from core-architectural-decisions.md):**

```sql
categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'photo')),
  rules TEXT,
  description TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now()
)
```

**Note:** The `judge_id` column from architecture is deferred to Epic 3 (Judge Assignment). This story focuses on category CRUD only.

**Category Status Flow:**
```
Draft → Published → Closed
         ↓
    (if 0 submissions, can go back to Draft)
```

**Category Type Enum:**
- `video` - For video submissions (up to 500MB via Bunny Stream)
- `photo` - For photo submissions (up to 10MB via Bunny Storage)

### Previous Story Learnings (Story 2.4)

**What Story 2.4 Built:**
- ✅ ContestDetailPage with Tabs: Details, Categories, Codes, Judges
- ✅ Categories tab currently shows placeholder: `<p>Categories tab - Story 2.5</p>`
- ✅ shadcn/ui components installed: Badge, Select, Tabs, AlertDialog
- ✅ Pattern established: Tab content as separate components (ContestDetailsTab)
- ✅ Edit toggle pattern: Button toggles between view/edit mode
- ✅ Status dropdown with immediate update via mutation hook
- ✅ Delete with AlertDialog confirmation

**Reusable Patterns from Story 2.4:**
```typescript
// Status dropdown pattern (ContestDetailsTab.tsx)
<Select value={status} onValueChange={handleStatusChange}>
  <SelectTrigger className="w-[180px]">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="draft">Draft</SelectItem>
    <SelectItem value="published">Published</SelectItem>
    <SelectItem value="closed">Closed</SelectItem>
  </SelectContent>
</Select>

// Edit toggle pattern
const [isEditing, setIsEditing] = useState(false);
<Button onClick={() => setIsEditing(!isEditing)}>
  {isEditing ? 'Cancel' : 'Edit'}
</Button>

// Delete confirmation pattern (DeleteContestButton.tsx)
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  ...
</AlertDialog>
```

**Git Intelligence (Recent Commits):**
- `51dbab4` - 2-4: Sync optimistic status with prop changes
- `9765c40` - 2-4: Address code review findings
- `7ab4fd6` - 2-4: Implement contest list and status management

### Technical Requirements

**New Feature Structure:**

Create new feature folder: `src/features/categories/`

```
src/features/categories/
├── api/
│   └── categoriesApi.ts          # Supabase CRUD operations
├── components/
│   ├── CategoriesTab.tsx         # Main tab content for ContestDetailPage
│   ├── CategoriesTab.test.tsx
│   ├── CategoryCard.tsx          # Display category in grid/list
│   ├── CategoryCard.test.tsx
│   ├── CreateCategoryForm.tsx    # Form for new category
│   ├── CreateCategoryForm.test.tsx
│   ├── EditCategoryForm.tsx      # Form for editing (disabled when Published/Closed)
│   ├── EditCategoryForm.test.tsx
│   ├── DeleteCategoryButton.tsx  # Delete with confirmation
│   └── index.ts
├── hooks/
│   ├── useCategories.ts          # Query: list categories by contest
│   ├── useCategory.ts            # Query: single category
│   ├── useCreateCategory.ts      # Mutation: create
│   ├── useUpdateCategory.ts      # Mutation: update
│   ├── useUpdateCategoryStatus.ts # Mutation: status change
│   ├── useDeleteCategory.ts      # Mutation: delete
│   └── index.ts
├── types/
│   ├── category.types.ts         # Category, CategoryStatus, CategoryType
│   ├── category.schemas.ts       # Zod schemas
│   └── index.ts
└── index.ts                      # REQUIRED: export all public API
```

**Types Definition:**

```typescript
// features/categories/types/category.types.ts

export type CategoryStatus = 'draft' | 'published' | 'closed';
export type CategoryType = 'video' | 'photo';

// Database row (snake_case)
export interface CategoryRow {
  id: string;
  contest_id: string;
  name: string;
  type: CategoryType;
  rules: string | null;
  description: string | null;
  deadline: string;
  status: CategoryStatus;
  created_at: string;
}

// Application type (camelCase)
export interface Category {
  id: string;
  contestId: string;
  name: string;
  type: CategoryType;
  rules: string | null;
  description: string | null;
  deadline: string;
  status: CategoryStatus;
  createdAt: string;
}

// Transform function
export function transformCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    contestId: row.contest_id,
    name: row.name,
    type: row.type,
    rules: row.rules,
    description: row.description,
    deadline: row.deadline,
    status: row.status,
    createdAt: row.created_at,
  };
}
```

**Zod Schemas:**

```typescript
// features/categories/types/category.schemas.ts
import { z } from 'zod';

export const categoryTypeSchema = z.enum(['video', 'photo']);
export const categoryStatusSchema = z.enum(['draft', 'published', 'closed']);

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  type: categoryTypeSchema,
  description: z.string().optional(),
  rules: z.string().optional(),
  deadline: z.string().min(1, 'Deadline is required'),  // ISO string
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
```

**API Layer:**

```typescript
// features/categories/api/categoriesApi.ts
import { supabase } from '@/lib/supabase';
import { transformCategory } from '../types/category.types';
import type { CreateCategoryInput, UpdateCategoryInput } from '../types/category.schemas';
import type { CategoryStatus, CategoryRow } from '../types/category.types';

export const categoriesApi = {
  async listByContest(contestId: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('contest_id', contestId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data as CategoryRow[]).map(transformCategory);
  },

  async getById(categoryId: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (error) throw error;
    return transformCategory(data as CategoryRow);
  },

  async create(contestId: string, input: CreateCategoryInput) {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        contest_id: contestId,
        name: input.name,
        type: input.type,
        description: input.description,
        rules: input.rules,
        deadline: input.deadline,
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;
    return transformCategory(data as CategoryRow);
  },

  async update(categoryId: string, input: UpdateCategoryInput) {
    const { data, error } = await supabase
      .from('categories')
      .update({
        name: input.name,
        type: input.type,
        description: input.description,
        rules: input.rules,
        deadline: input.deadline,
      })
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;
    return transformCategory(data as CategoryRow);
  },

  async updateStatus(categoryId: string, status: CategoryStatus) {
    const { data, error } = await supabase
      .from('categories')
      .update({ status })
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;
    return transformCategory(data as CategoryRow);
  },

  async delete(categoryId: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) throw error;
  },

  // Check submission count for status change rules
  async getSubmissionCount(categoryId: string): Promise<number> {
    const { count, error } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId);

    if (error) throw error;
    return count ?? 0;
  },
};
```

**TanStack Query Hooks:**

```typescript
// features/categories/hooks/useCategories.ts
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '../api/categoriesApi';

export function useCategories(contestId: string) {
  return useQuery({
    queryKey: ['categories', contestId],
    queryFn: () => categoriesApi.listByContest(contestId),
    enabled: !!contestId,
  });
}

// features/categories/hooks/useCreateCategory.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/categoriesApi';
import type { CreateCategoryInput } from '../types/category.schemas';

export function useCreateCategory(contestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCategoryInput) => categoriesApi.create(contestId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', contestId] });
    },
  });
}

// features/categories/hooks/useUpdateCategoryStatus.ts
export function useUpdateCategoryStatus(contestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, status }: { categoryId: string; status: CategoryStatus }) =>
      categoriesApi.updateStatus(categoryId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', contestId] });
    },
  });
}

// features/categories/hooks/useDeleteCategory.ts
export function useDeleteCategory(contestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => categoriesApi.delete(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', contestId] });
    },
  });
}
```

**CategoriesTab Component (Main Tab):**

```typescript
// features/categories/components/CategoriesTab.tsx
import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui';
import { useCategories } from '../hooks/useCategories';
import { CategoryCard } from './CategoryCard';
import { CreateCategoryForm } from './CreateCategoryForm';
import type { Contest } from '@/features/contests';

interface CategoriesTabProps {
  contest: Contest;
}

export function CategoriesTab({ contest }: CategoriesTabProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: categories, isLoading } = useCategories(contest.id);

  const canAddCategory = contest.status === 'draft' || contest.status === 'published';

  if (isLoading) {
    return <div>Loading categories...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Categories</CardTitle>
        {canAddCategory ? (
          <Sheet open={createOpen} onOpenChange={setCreateOpen}>
            <SheetTrigger asChild>
              <Button>Add Category</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Create Category</SheetTitle>
              </SheetHeader>
              <CreateCategoryForm
                contestId={contest.id}
                onSuccess={() => setCreateOpen(false)}
              />
            </SheetContent>
          </Sheet>
        ) : (
          <p className="text-sm text-muted-foreground">
            Cannot add categories to a closed contest
          </p>
        )}
      </CardHeader>
      <CardContent>
        {categories?.length === 0 ? (
          <p className="text-muted-foreground">No categories yet. Add one to get started.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {categories?.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                contestId={contest.id}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**CategoryCard Component:**

```typescript
// features/categories/components/CategoryCard.tsx
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';
import { Badge, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui';
import { useUpdateCategoryStatus } from '../hooks/useUpdateCategoryStatus';
import { categoriesApi } from '../api/categoriesApi';
import { EditCategoryForm } from './EditCategoryForm';
import { DeleteCategoryButton } from './DeleteCategoryButton';
import type { Category, CategoryStatus } from '../types/category.types';
import { toast } from 'sonner';

interface CategoryCardProps {
  category: Category;
  contestId: string;
}

export function CategoryCard({ category, contestId }: CategoryCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [submissionCount, setSubmissionCount] = useState<number | null>(null);
  const updateStatus = useUpdateCategoryStatus(contestId);

  const isDraft = category.status === 'draft';
  const isEditable = isDraft;

  const statusColors: Record<CategoryStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    published: 'bg-green-100 text-green-800',
    closed: 'bg-blue-100 text-blue-800',
  };

  const typeColors: Record<string, string> = {
    video: 'bg-purple-100 text-purple-800',
    photo: 'bg-orange-100 text-orange-800',
  };

  const handleStatusChange = async (newStatus: CategoryStatus) => {
    // Check submission count for Draft restriction
    if (newStatus === 'draft') {
      const count = await categoriesApi.getSubmissionCount(category.id);
      if (count > 0) {
        toast.error('Cannot set to Draft - category has submissions');
        return;
      }
    }

    await updateStatus.mutateAsync({ categoryId: category.id, status: newStatus });
    toast.success('Status updated');
  };

  // Check deadline - auto-close if passed (MVP client-side check)
  const deadlinePassed = new Date(category.deadline) < new Date();
  if (deadlinePassed && category.status !== 'closed') {
    // Trigger status update to closed
    handleStatusChange('closed');
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{category.name}</CardTitle>
          <div className="flex gap-2">
            <Badge className={typeColors[category.type]}>{category.type}</Badge>
            <Badge className={statusColors[category.status]}>{category.status}</Badge>
          </div>
        </div>
        <CardDescription>
          Deadline: {new Date(category.deadline).toLocaleDateString()}
          {deadlinePassed && <span className="text-red-500 ml-2">(Passed)</span>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {category.description && (
          <p className="text-sm text-muted-foreground">{category.description}</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Select
          value={category.status}
          onValueChange={(value) => handleStatusChange(value as CategoryStatus)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft" disabled={!isDraft}>Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          {isEditable && (
            <>
              <Sheet open={editOpen} onOpenChange={setEditOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">Edit</Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Edit Category</SheetTitle>
                  </SheetHeader>
                  <EditCategoryForm
                    category={category}
                    contestId={contestId}
                    onSuccess={() => setEditOpen(false)}
                  />
                </SheetContent>
              </Sheet>
              <DeleteCategoryButton
                categoryId={category.id}
                contestId={contestId}
                categoryName={category.name}
              />
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
```

**UI Components to Install:**

```bash
# DatePicker for deadline field
npx shadcn@latest add calendar
npx shadcn@latest add popover
```

**Note:** Use `Intl.DateTimeFormat` for date formatting per architecture rules (no date-fns dependency).

### Database Migration

**Migration File:**

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_categories_table.sql

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'photo')),
  rules TEXT,
  description TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_categories_contest_id ON public.categories(contest_id);
CREATE INDEX idx_categories_status ON public.categories(status);
CREATE INDEX idx_categories_deadline ON public.categories(deadline);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin full access
CREATE POLICY "Admins can manage categories"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

### Integration with ContestDetailPage

**Update ContestDetailPage.tsx:**

```typescript
// Replace placeholder with CategoriesTab
import { CategoriesTab } from '@/features/categories';

// In the Tabs component:
<TabsContent value="categories">
  <CategoriesTab contest={contest} />
</TabsContent>
```

### Testing Guidance

**Unit Tests:**
- CategoriesTab.test.tsx: Renders categories, shows empty state, Add button disabled for closed contests
- CategoryCard.test.tsx: Displays info, status badge colors, edit/delete buttons only for draft
- CreateCategoryForm.test.tsx: Validation, type selection, deadline picker, success toast
- EditCategoryForm.test.tsx: Pre-populated fields, validation, success toast
- DeleteCategoryButton.test.tsx: Shows dialog, confirms deletion

**Manual Testing Checklist:**
1. Navigate to contest detail page → Categories tab
2. Contest is Draft/Published → "Add Category" button visible
3. Click "Add Category" → Form appears in Sheet
4. Fill form: name, type (video/photo), deadline, description, rules
5. Submit → Category created with Draft status
6. Category card shows: name, type badge, status badge, deadline
7. Click "Edit" on Draft category → Edit form appears
8. Modify fields → Save → Success toast
9. Change status dropdown: Draft → Published → Closed
10. Try setting Published category back to Draft → Works (0 submissions)
11. Delete Draft category → Confirmation dialog → Deleted
12. Change contest status to Closed → "Add Category" button hidden
13. Published/Closed category → Edit/Delete buttons hidden

### Quality Gates

Before marking as "review":

```bash
# Git Status (REQUIRED)
□ git status          # Must show clean
□ git log --oneline -5  # Verify commits have "2-5:" prefix
□ git push -u origin story/2-5-category-management

# Quality Gates (REQUIRED)
□ npm run build       # Must pass
□ npm run lint        # Must pass
□ npm run type-check  # Must pass
□ npm run test        # Must pass

# Import Compliance
□ All imports from feature index
□ No React namespace imports
□ New feature index.ts exports all public API
```

### Reference Documents

- [Source: epic-2-super-admin-authentication-contest-management.md#Story 2.5]
- [Source: architecture/core-architectural-decisions.md#Data Architecture]
- [Source: project-context.md#Feature Architecture]
- [Source: Story 2.4 - ContestDetailPage with Tabs pattern]
- [shadcn/ui Calendar: https://ui.shadcn.com/docs/components/calendar]
- [shadcn/ui Popover: https://ui.shadcn.com/docs/components/popover]

## Tasks / Subtasks

- [x] Create story branch and mark story in-progress
- [x] Create database migration for categories table
- [x] Create category types, schemas, and transform functions
- [x] Create categoriesApi with CRUD operations
- [x] Create TanStack Query hooks for categories
- [x] Install shadcn calendar and popover for date picker
- [x] Create CreateCategoryForm component
- [x] Create EditCategoryForm component
- [x] Create DeleteCategoryButton component
- [x] Create CategoryCard component with status management
- [x] Create CategoriesTab component
- [x] Update feature index.ts with all exports
- [x] Integrate CategoriesTab into ContestDetailPage
- [x] Write unit tests for all components
- [x] Run quality gates (build, lint, type-check, test)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - Implementation proceeded without significant debug issues.

### Completion Notes

**Implementation Summary:**
- Created full categories feature with CRUD operations
- Database migration creates categories table with RLS policies
- CategoriesTab component integrates into ContestDetailPage
- CategoryCard displays category info with status/type badges
- CreateCategoryForm and EditCategoryForm with date picker (shadcn Calendar)
- DeleteCategoryButton with AlertDialog confirmation
- Status dropdown with submission-based restrictions (AC4)
- Deadline auto-close check on component mount (AC5)

**Quality Gates:**
- ✅ Type check: Pass
- ✅ Lint: Pass (4 warnings in shadcn components - expected)
- ✅ Build: Pass
- ✅ Tests: 155 tests pass (31 new tests for categories)

**Notes:**
- Some Radix UI Select interaction tests skipped due to jsdom compatibility (noted for Playwright integration tests)
- Added pointer capture and scrollIntoView mocks to test setup for Radix components

## Review Follow-ups (AI)

_To be filled by Code Review agent_

## File List

New files created:
- supabase/migrations/20260113001602_create_categories_table.sql
- src/components/ui/calendar.tsx
- src/components/ui/popover.tsx
- src/features/categories/api/categoriesApi.ts
- src/features/categories/components/CategoriesTab.tsx
- src/features/categories/components/CategoriesTab.test.tsx
- src/features/categories/components/CategoryCard.tsx
- src/features/categories/components/CategoryCard.test.tsx
- src/features/categories/components/CreateCategoryForm.tsx
- src/features/categories/components/CreateCategoryForm.test.tsx
- src/features/categories/components/DeleteCategoryButton.tsx
- src/features/categories/components/DeleteCategoryButton.test.tsx
- src/features/categories/components/EditCategoryForm.tsx
- src/features/categories/components/EditCategoryForm.test.tsx
- src/features/categories/components/index.ts
- src/features/categories/hooks/index.ts
- src/features/categories/hooks/useCategories.ts
- src/features/categories/hooks/useCategory.ts
- src/features/categories/hooks/useCreateCategory.ts
- src/features/categories/hooks/useDeleteCategory.ts
- src/features/categories/hooks/useUpdateCategory.ts
- src/features/categories/hooks/useUpdateCategoryStatus.ts
- src/features/categories/types/category.schemas.ts
- src/features/categories/types/category.types.ts
- src/features/categories/types/index.ts

Modified files:
- package.json (added react-day-picker, @radix-ui/react-popover)
- package-lock.json
- src/components/ui/index.ts (added Calendar, Popover exports)
- src/features/categories/index.ts (full feature exports)
- src/lib/errorCodes.ts (added category-specific error codes)
- src/pages/admin/ContestDetailPage.tsx (integrated CategoriesTab)
- src/test/setup.ts (added Radix UI mocks)
- src/types/supabase.ts (added categories and submissions types)
- _bmad-output/implementation-artifacts/sprint-status.yaml (status: in-progress)

## Change Log

| Date | Change | Files |
|------|--------|-------|
| 2026-01-13 | Story 2-5 implementation complete | 31 files (see File List) |
| 2026-01-13 | Code review fixes: AC4 loading state, refetch before Draft, inline restriction message, standardized error codes, Intl.DateTimeFormat, React type imports | CategoryCard.tsx, categoriesApi.ts, errorCodes.ts, forms, tests |
