# Story 2.4: Contest List & Status Management

Status: done

## Story

As a **Super Admin**,
I want **to view all contests and manage their status**,
So that **I can track and control the contest lifecycle**.

## Acceptance Criteria

### AC1: Contest List Display
**Given** I am on the Contests page
**When** the page loads
**Then** I see a list of all contests as ContestCard components
**And** each card shows: name, status badge, submission count (0 initially), created date

### AC2: Empty State
**Given** I view the contest list
**When** there are no contests
**Then** I see an empty state: "No contests yet" with "Create your first contest" button

### AC3: Contest Detail Navigation
**Given** I click on a contest card
**When** the detail page loads
**Then** I see the full contest details with tabs: Details, Categories, Codes, Judges

### AC4: Edit Contest
**Given** I am on a contest detail page
**When** I click "Edit"
**Then** I can modify: name, description, rules
**And** changes are saved with a success toast
**Note:** Cover image editing is deferred to Epic 4 (Bunny Storage/Stream integration).

### AC5: Status Management
**Given** I want to change contest status
**When** I click the status dropdown
**Then** I can select: Draft, Published, Closed, Reviewed, Finished
**And** the status updates immediately

### AC6: Delete Contest with Confirmation
**Given** I want to delete a contest
**When** I click "Delete"
**Then** I see a confirmation dialog: "Are you sure? This will delete all categories, submissions, and codes. This action cannot be undone."
**And** only after confirming is the contest deleted

## Developer Context

### Architecture Requirements

**Contest Status Flow (from epic):**
```
Draft → Published → Closed → Reviewed → Finished
```

**Database Schema (from Story 2.3):**
- `contests` table already created with status column
- Status values: 'draft', 'published', 'closed', 'reviewed', 'finished'
- ON DELETE CASCADE for related tables

**UI Components Needed:**
- ContestCard (UX17 from epic)
- Status Badge with color coding
- Tabs component for detail page
- AlertDialog for delete confirmation (UX11)

### Previous Story Learnings

**From Story 2.3 (Just Completed):**
- ✅ Database tables: `contests`, `participants` already created
- ✅ API layer: `contestsApi` with `create()`, `list()`, `getById()`
- ✅ TanStack Query hooks: `useContests()`, `useCreateContest()`
- ✅ ContestsPage: Already displays contests in grid layout
- ✅ ContestDetailPage: Placeholder created at `/admin/contests/:contestId`
- ✅ Types: `Contest`, `ContestRow`, `ContestStatus` already defined
- ✅ Zod schema: `createContestSchema` exists
- ✅ Feature index: `features/contests/index.ts` exporting all public API

**What Story 2.3 Already Built:**
```typescript
// features/contests/api/contestsApi.ts
- create() ✅
- list() ✅
- getById() ✅

// features/contests/hooks/
- useContests() ✅
- useCreateContest() ✅

// features/contests/components/
- CreateContestForm ✅

// pages/admin/
- ContestsPage ✅ (displays contests in grid)
- ContestDetailPage ✅ (placeholder only)
```

**From Story 2.2:**
- AdminLayout with sidebar navigation + breadcrumbs
- Sheet component for mobile-friendly modals
- Toast system for success/error messages
- Loading states with Skeleton component

### Technical Requirements

**API Extensions Needed:**

```typescript
// features/contests/api/contestsApi.ts - ADD THESE

export const contestsApi = {
  // ... existing: create, list, getById ...

  async update(id: string, input: Partial<CreateContestInput>) {
    const { data, error } = await supabase
      .from('contests')
      .update({
        name: input.name,
        description: input.description,
        rules: input.rules,
        // cover_image_url handled separately if provided
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: ContestStatus) {
    const { data, error } = await supabase
      .from('contests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('contests')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
```

**TanStack Query Hooks to Add:**

```typescript
// features/contests/hooks/useUpdateContest.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contestsApi } from '../api/contestsApi';

export function useUpdateContest(contestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<CreateContestInput>) =>
      contestsApi.update(contestId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      queryClient.invalidateQueries({ queryKey: ['contest', contestId] });
    }
  });
}

// features/contests/hooks/useUpdateContestStatus.ts
export function useUpdateContestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContestStatus }) =>
      contestsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
    }
  });
}

// features/contests/hooks/useDeleteContest.ts
export function useDeleteContest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contestsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
    }
  });
}

// features/contests/hooks/useContest.ts (singular)
export function useContest(contestId: string) {
  return useQuery({
    queryKey: ['contest', contestId],
    queryFn: () => contestsApi.getById(contestId),
    enabled: !!contestId
  });
}
```

**Component Patterns:**

**ContestCard Component (AC1):**
```typescript
// features/contests/components/ContestCard.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui';
import { Badge } from '@/components/ui';
import type { Contest } from '../types/contest.types';

interface ContestCardProps {
  contest: Contest;
  onClick: (id: string) => void;
}

export function ContestCard({ contest, onClick }: ContestCardProps) {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    published: 'bg-green-100 text-green-800',
    closed: 'bg-blue-100 text-blue-800',
    reviewed: 'bg-purple-100 text-purple-800',
    finished: 'bg-gray-100 text-gray-800'
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onClick(contest.id)}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{contest.name}</CardTitle>
          <Badge className={statusColors[contest.status]}>
            {contest.status}
          </Badge>
        </div>
        <CardDescription>{contest.description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <div className="text-sm text-muted-foreground">
          <p>Submissions: 0</p>
          <p>Created: {new Date(contest.createdAt).toLocaleDateString()}</p>
        </div>
      </CardFooter>
    </Card>
  );
}
```

**ContestDetailPage with Tabs (AC3):**
```typescript
// pages/admin/ContestDetailPage.tsx - REPLACE PLACEHOLDER
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { useContest } from '@/features/contests';
import { ContestDetailsTab } from '@/features/contests/components/ContestDetailsTab';
// Future: import { CategoriesTab, CodesTab, JudgesTab } from ...

export function ContestDetailPage() {
  const { contestId } = useParams<{ contestId: string }>();
  const { data: contest, isLoading } = useContest(contestId!);

  if (isLoading) return <div>Loading...</div>;
  if (!contest) return <div>Contest not found</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{contest.name}</h1>
        <p className="text-muted-foreground">{contest.contestCode}</p>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="codes">Codes</TabsTrigger>
          <TabsTrigger value="judges">Judges</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <ContestDetailsTab contest={contest} />
        </TabsContent>

        <TabsContent value="categories">
          <p>Categories tab - Story 2.5</p>
        </TabsContent>

        <TabsContent value="codes">
          <p>Codes tab - Story 2.6</p>
        </TabsContent>

        <TabsContent value="judges">
          <p>Judges tab - Epic 3</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**ContestDetailsTab with Edit & Status (AC4, AC5):**
```typescript
// features/contests/components/ContestDetailsTab.tsx
import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { EditContestForm } from './EditContestForm';
import { useUpdateContestStatus } from '../hooks/useUpdateContestStatus';
import type { Contest, ContestStatus } from '../types/contest.types';

export function ContestDetailsTab({ contest }: { contest: Contest }) {
  const [isEditing, setIsEditing] = useState(false);
  const updateStatus = useUpdateContestStatus();

  const handleStatusChange = async (status: ContestStatus) => {
    await updateStatus.mutateAsync({ id: contest.id, status });
    toast.success('Status updated');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Contest Details</CardTitle>
        <div className="flex gap-2">
          <Select value={contest.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="finished">Finished</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <EditContestForm
            contest={contest}
            onSuccess={() => setIsEditing(false)}
          />
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Description</h3>
              <p className="text-muted-foreground">{contest.description || 'No description'}</p>
            </div>
            <div>
              <h3 className="font-medium">Rules</h3>
              <p className="text-muted-foreground">{contest.rules || 'No rules'}</p>
            </div>
            <div>
              <h3 className="font-medium">Contest Code</h3>
              <p className="font-mono">{contest.contestCode}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Delete with Confirmation (AC6):**
```typescript
// features/contests/components/DeleteContestButton.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
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
import { useDeleteContest } from '../hooks/useDeleteContest';

export function DeleteContestButton({ contestId }: { contestId: string }) {
  const navigate = useNavigate();
  const deleteContest = useDeleteContest();

  const handleDelete = async () => {
    await deleteContest.mutateAsync(contestId);
    toast.success('Contest deleted');
    navigate('/admin/contests');
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete Contest</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete all categories, submissions, and codes. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### UI Components to Install

**shadcn/ui components needed:**
```bash
npx shadcn@latest add badge        # Status badges
npx shadcn@latest add select       # Status dropdown
npx shadcn@latest add tabs         # Detail page tabs
npx shadcn@latest add alert-dialog # Delete confirmation
```

### File Structure

```
src/
├── features/
│   └── contests/
│       ├── api/
│       │   └── contestsApi.ts           # UPDATE: add update, updateStatus, delete
│       ├── components/
│       │   ├── ContestCard.tsx          # NEW: Display contest in grid
│       │   ├── ContestCard.test.tsx     # NEW
│       │   ├── ContestDetailsTab.tsx    # NEW: Details tab with edit/status
│       │   ├── EditContestForm.tsx      # NEW: Edit form (similar to Create)
│       │   ├── EditContestForm.test.tsx # NEW
│       │   ├── DeleteContestButton.tsx  # NEW: Delete with confirmation
│       │   └── index.ts                 # UPDATE: export new components
│       ├── hooks/
│       │   ├── useContest.ts            # NEW: Fetch single contest
│       │   ├── useUpdateContest.ts      # NEW: Update mutation
│       │   ├── useUpdateContestStatus.ts # NEW: Status mutation
│       │   ├── useDeleteContest.ts      # NEW: Delete mutation
│       │   └── index.ts                 # UPDATE: export new hooks
│       └── index.ts                     # UPDATE: export all new items
├── pages/
│   └── admin/
│       ├── ContestsPage.tsx             # UPDATE: use ContestCard
│       └── ContestDetailPage.tsx        # UPDATE: replace placeholder with real impl
└── components/ui/
    ├── badge.tsx                        # NEW (shadcn)
    ├── select.tsx                       # NEW (shadcn)
    ├── tabs.tsx                         # NEW (shadcn)
    ├── alert-dialog.tsx                 # NEW (shadcn)
    └── index.ts                         # UPDATE: export new components
```

### Testing Guidance

**Unit Tests:**
- ContestCard.test.tsx: Renders contest info, status badge, handles click
- EditContestForm.test.tsx: Validation, submit, success/error handling
- DeleteContestButton.test.tsx: Shows dialog, confirms deletion

**Manual Testing Checklist:**
1. Navigate to /admin/contests
2. See list of contests (or empty state if none)
3. Click on a contest card
4. Navigate to contest detail page with tabs
5. View Details tab: See contest info
6. Click "Edit" button: Form appears
7. Modify name, description, rules
8. Click "Save": Success toast appears
9. Click status dropdown: Select "Published"
10. Verify status updates immediately
11. Click "Delete Contest" button
12. See confirmation dialog with warning
13. Click "Cancel": Dialog closes, contest remains
14. Click "Delete" again, then "Delete" in dialog
15. Contest deleted, redirected to contests list

### Quality Gates

Before marking as "review":

```bash
# Git Status (REQUIRED)
□ git status          # Must show: "nothing to commit, working tree clean"
□ git log --oneline -5  # Verify commits have "2-4:" prefix
□ git push -u origin story/2-4-contest-list-status-management

# Quality Gates (REQUIRED)
□ npm run build       # Must pass
□ npm run lint        # Must pass
□ npm run type-check  # Must pass
□ npm run test        # Must pass

# Import Compliance
□ All imports from feature index
□ No React namespace imports
```

### Reference Documents

- [Source: epic-2-super-admin-authentication-contest-management.md#Story 2.4]
- [Source: Story 2.3 learnings - contestsApi, hooks, types already exist]
- [Source: project-context.md#Feature Architecture]
- [Source: ux-design/design-system-foundation.md#UX17 ContestCard]
- [Source: ux-design/design-system-foundation.md#UX11 Confirmation dialogs]
- [shadcn/ui Tabs: https://ui.shadcn.com/docs/components/tabs]
- [shadcn/ui Select: https://ui.shadcn.com/docs/components/select]
- [shadcn/ui AlertDialog: https://ui.shadcn.com/docs/components/alert-dialog]

## Tasks / Subtasks

- [x] **Task 1: Install shadcn UI components**
  - [x] Install badge component
  - [x] Install select component
  - [x] Install tabs component
  - [x] Install alert-dialog component

- [x] **Task 2: Extend API layer** (AC4, AC5, AC6)
  - [x] Add `update()` method to contestsApi
  - [x] Add `updateStatus()` method to contestsApi
  - [x] Add `delete()` method to contestsApi
  - [x] Document API test deferral (no local Supabase, no mocks)

- [x] **Task 3: Add TanStack Query hooks**
  - [x] Create `useContest` hook (single contest query)
  - [x] Create `useUpdateContest` hook (mutation)
  - [x] Create `useUpdateContestStatus` hook (mutation)
  - [x] Create `useDeleteContest` hook (mutation)

- [x] **Task 4: Create ContestCard component** (AC1)
  - [x] Create ContestCard with name, status badge, submission count, created date
  - [x] Add status color coding
  - [x] Add click handler for navigation
  - [x] Write unit tests

- [x] **Task 5: Update ContestsPage** (AC1, AC2)
  - [x] Replace current grid with ContestCard components
  - [x] Add empty state with "Create your first contest" button
  - [x] Add navigation to contest detail on card click

- [x] **Task 6: Create EditContestForm component** (AC4)
  - [x] Create form with name, description, rules fields
  - [x] Use existing Zod schema for validation
  - [x] Handle submit with success toast
  - [x] Write unit tests

- [x] **Task 7: Create ContestDetailsTab** (AC4, AC5)
  - [x] Display contest details (description, rules, code)
  - [x] Add edit toggle with EditContestForm
  - [x] Add status dropdown with immediate update
  - [x] Write unit tests

- [x] **Task 8: Create DeleteContestButton** (AC6)
  - [x] Create AlertDialog with confirmation message
  - [x] Handle delete with success toast
  - [x] Navigate back to contests list after delete
  - [x] Write unit tests

- [x] **Task 9: Implement ContestDetailPage** (AC3)
  - [x] Replace placeholder with full implementation
  - [x] Add Tabs: Details, Categories, Codes, Judges
  - [x] Integrate ContestDetailsTab in Details tab
  - [x] Add DeleteContestButton to page
  - [x] Add placeholder content for future tabs

- [x] **Task 10: Update feature index and quality gates**
  - [x] Export all new components from features/contests/index.ts
  - [x] Export all new hooks from features/contests/index.ts
  - [x] Run npm run lint
  - [x] Run npm run type-check
  - [x] Run npm run test
  - [x] Run npm run build

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - No debug issues encountered

### Completion Notes

Successfully implemented all 6 acceptance criteria for contest list and status management:

**AC1 - Contest List Display:** Created ContestCard component displaying name, status badge, submission count (0), and created date with status color coding.

**AC2 - Empty State:** ContestsPage already had empty state from Story 2.3. Updated to use ContestCard for contest grid display.

**AC3 - Contest Detail Navigation:** Implemented ContestDetailPage with four tabs (Details, Categories, Codes, Judges). Click on ContestCard navigates to detail page.

**AC4 - Edit Contest:** Created EditContestForm with name, description, rules fields. Integrated into ContestDetailsTab with edit toggle. Shows success toast on save. Cover image editing deferred to Epic 4.

**AC5 - Status Management:** Added status dropdown in ContestDetailsTab allowing selection of Draft, Published, Closed, Reviewed, Finished. Status updates immediately via optimistic UI + useUpdateContestStatus hook.

**AC6 - Delete Contest:** Created DeleteContestButton with AlertDialog confirmation showing warning about cascading deletions. Navigates to contests list after successful delete.

**Review Updates:** Synced optimistic status changes, aligned status badge colors with UX spec, and clarified empty state copy. Deferred cover image editing, API unit tests, and mobile empty-state CTA accessibility to future work (see Review Follow-ups).

**Quality Gates:**
- Lint: 0 errors (4 warnings from shadcn components - expected)
- Type-check: Passes
- Tests: 124 tests pass (27 new tests for this story)
- Build: Succeeds

## Review Follow-ups (AI)

- [ ] [AI-Review][Medium] Add API unit tests for contestsApi.update/updateStatus/delete (deferred: no local Supabase, no mocks). (src/features/contests/api/contestsApi.ts)
- [ ] [AI-Review][Medium] Validate mobile empty state CTA accessibility for Sheet trigger. (src/pages/admin/ContestsPage.tsx)
- [ ] [AI-Review][Medium] Add cover image edit/upload once Bunny Storage/Stream is available (Epic 4). (src/features/contests/components/EditContestForm.tsx)

## File List

**New Files:**
- src/components/ui/alert-dialog.tsx
- src/components/ui/badge.tsx
- src/components/ui/select.tsx
- src/components/ui/tabs.tsx
- src/features/contests/components/ContestCard.test.tsx
- src/features/contests/components/ContestCard.tsx
- src/features/contests/components/ContestDetailsTab.test.tsx
- src/features/contests/components/ContestDetailsTab.tsx
- src/features/contests/components/DeleteContestButton.test.tsx
- src/features/contests/components/DeleteContestButton.tsx
- src/features/contests/components/EditContestForm.test.tsx
- src/features/contests/components/EditContestForm.tsx
- src/features/contests/hooks/useContest.ts
- src/features/contests/hooks/useDeleteContest.ts
- src/features/contests/hooks/useUpdateContest.ts
- src/features/contests/hooks/useUpdateContestStatus.ts

**Modified Files:**
- package-lock.json
- package.json
- src/components/ui/index.ts
- src/features/contests/api/contestsApi.ts
- src/features/contests/components/index.ts
- src/features/contests/hooks/index.ts
- src/features/contests/index.ts
- src/features/contests/types/contest.schemas.ts
- src/pages/admin/ContestDetailPage.tsx
- src/pages/admin/ContestsPage.tsx

## Change Log

| Date | Change | Files |
|------|--------|-------|
| 2026-01-13 | Implement contest list and status management (AC1-AC6) | See File List above |
| 2026-01-13 | Review updates: status colors, optimistic status sync, empty state copy, deferred items noted | See Review Follow-ups |
