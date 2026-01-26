# Story 3.4: Judge Login & Dashboard

Status: ready-for-dev

## Story

As a **Judge**,
I want **to log in and see my assigned categories**,
So that **I can access submissions for review**.

## Acceptance Criteria

### AC1: Login with Valid Credentials
**Given** I am on the login page
**When** I enter valid judge credentials
**Then** I am authenticated and redirected to /judge dashboard

### AC2: Dashboard Shows Assigned Categories
**Given** I am logged in as a judge
**When** I view my dashboard
**Then** I see a list of all categories assigned to me
**And** each category shows: contest name, category name, status, submission count

### AC3: Closed Category Display
**Given** a category is "Closed" (ready for judging)
**When** I view it on my dashboard
**Then** I see a "Start Reviewing" button
**And** the card is highlighted/prominent

### AC4: Published Category Display
**Given** a category is "Published" (not yet closed)
**When** I view it on my dashboard
**Then** I see "Awaiting deadline: {date}"
**And** the "Start Reviewing" button is disabled

### AC5: Empty State
**Given** I have no assigned categories
**When** I view my dashboard
**Then** I see an empty state: "No categories assigned yet"

### AC6: Forgot Password Flow
**Given** I forgot my password
**When** I click "Forgot password" on the login page
**Then** I can reset my password via email (same flow as admin)

## Developer Context

### Architecture Requirements

**Authentication Flow (Judge Login):**

Per architecture and existing implementation:

1. Judge enters email + password on `/login` page
2. AuthProvider authenticates via Supabase Auth
3. Profile fetched to determine role
4. LoginPage redirects based on role:
   - `admin` → `/admin/dashboard`
   - `judge` → `/judge/dashboard`

**This is already implemented in LoginPage.tsx (lines 22-25).** No changes needed for login flow.

**Forgot Password:** Already implemented via existing `ForgotPasswordPage.tsx` and `ResetPasswordPage.tsx`. Same flow for admin and judge - no changes needed.

### Technical Requirements

**Feature Location:** Extend `src/features/categories/` for judge API and update `src/pages/judge/`

**New/Modified Files:**
```
src/features/categories/
├── api/
│   └── categoriesApi.ts           # MODIFY: Add listByJudge() method
├── hooks/
│   ├── useCategoriesByJudge.ts    # NEW: Query hook for judge's categories
│   └── index.ts                   # MODIFY: Export new hook
└── index.ts                       # MODIFY: Export new hook

src/pages/judge/
└── DashboardPage.tsx              # MODIFY: Full implementation (currently placeholder)

src/pages/judge/
└── DashboardPage.test.tsx         # NEW: Unit tests for dashboard
```

### API Implementation

**Add to categoriesApi.ts:**

```typescript
// In src/features/categories/api/categoriesApi.ts

/**
 * Fetches categories assigned to a specific judge
 * Includes contest info via division join and submission count
 */
async listByJudge(judgeId: string): Promise<CategoryWithContext[]> {
  // Query categories where assigned_judge_id matches
  // Join divisions → contests to get contest name
  // Include submission count for each category

  const { data: categories, error } = await supabase
    .from('categories')
    .select(`
      *,
      divisions!inner (
        id,
        name,
        contests!inner (
          id,
          name,
          status
        )
      )
    `)
    .eq('assigned_judge_id', judgeId)
    .in('status', ['published', 'closed'])  // Only show published/closed
    .order('created_at', { ascending: true });

  if (error) throw error;
  if (!categories) return [];

  // Get submission counts for each category
  const categoryIds = categories.map((c) => c.id);
  const { data: submissionCounts, error: countError } = await supabase
    .from('submissions')
    .select('category_id')
    .in('category_id', categoryIds);

  if (countError) throw countError;

  // Count submissions per category
  const countMap = new Map<string, number>();
  submissionCounts?.forEach((s) => {
    const current = countMap.get(s.category_id) || 0;
    countMap.set(s.category_id, current + 1);
  });

  // Transform to camelCase and add submission count
  return categories.map((category) => ({
    ...transformCategory(category),
    contestName: category.divisions.contests.name,
    contestId: category.divisions.contests.id,
    divisionName: category.divisions.name,
    submissionCount: countMap.get(category.id) || 0,
  }));
}
```

**New Type (add to category.types.ts):**

```typescript
export interface CategoryWithContext extends Category {
  contestName: string;
  contestId: string;
  divisionName: string;
  submissionCount: number;
}
```

### Hook Implementation

**New hook src/features/categories/hooks/useCategoriesByJudge.ts:**

```typescript
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '../api/categoriesApi';

export function useCategoriesByJudge(judgeId: string | undefined) {
  return useQuery({
    queryKey: ['categories', 'judge', judgeId],
    queryFn: () => {
      if (!judgeId) throw new Error('Judge ID required');
      return categoriesApi.listByJudge(judgeId);
    },
    enabled: !!judgeId,
  });
}
```

### JudgeDashboardPage Implementation

**Update src/pages/judge/DashboardPage.tsx:**

```typescript
import { useAuth } from '@/contexts';
import { useCategoriesByJudge } from '@/features/categories';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/components/ui';
import { Calendar, ClipboardList, LogOut, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export function JudgeDashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: categories, isLoading, error, refetch } = useCategoriesByJudge(user?.id);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to sign out');
    }
  };

  // Stats
  const totalCategories = categories?.length || 0;
  const closedCategories = categories?.filter((c) => c.status === 'closed').length || 0;
  const awaitingCategories = categories?.filter((c) => c.status === 'published').length || 0;

  // Loading state
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Error state
  if (error) {
    return <DashboardError error={error} onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome, {user?.firstName || user?.email?.split('@')[0]}
            </h1>
            <p className="text-muted-foreground">
              Review submissions for your assigned categories
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Assigned Categories"
            value={totalCategories}
            icon={ClipboardList}
          />
          <StatCard
            title="Ready to Review"
            value={closedCategories}
            icon={Play}
            highlight
          />
          <StatCard
            title="Awaiting Deadline"
            value={awaitingCategories}
            icon={Calendar}
          />
        </div>

        {/* Categories List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Categories</h2>

          {/* Empty State (AC5) */}
          {totalCategories === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No categories assigned yet
                </p>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  You'll see your assigned categories here once an admin assigns you
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {categories?.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onStartReviewing={() => navigate(`/judge/categories/${category.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}

function StatCard({ title, value, icon: Icon, highlight }: StatCardProps) {
  return (
    <Card className={highlight && value > 0 ? 'border-primary bg-primary/5' : ''}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${highlight && value > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${highlight && value > 0 ? 'text-primary' : ''}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

// Category Card Component (AC2, AC3, AC4)
interface CategoryCardProps {
  category: CategoryWithContext;
  onStartReviewing: () => void;
}

function CategoryCard({ category, onStartReviewing }: CategoryCardProps) {
  const isClosed = category.status === 'closed';
  const deadlineText = isClosed
    ? 'Ready for review'
    : `Awaiting deadline: ${formatDistanceToNow(new Date(category.deadline), { addSuffix: true })}`;

  return (
    <Card className={isClosed ? 'border-primary shadow-md' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{category.name}</CardTitle>
            <CardDescription>
              {category.contestName} • {category.divisionName}
            </CardDescription>
          </div>
          <Badge variant={isClosed ? 'default' : 'secondary'}>
            {isClosed ? 'Closed' : 'Published'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{deadlineText}</p>
            <p className="text-sm">
              <span className="font-medium">{category.submissionCount}</span> submissions
            </p>
          </div>
          <Button
            onClick={onStartReviewing}
            disabled={!isClosed}
            variant={isClosed ? 'default' : 'outline'}
          >
            <Play className="mr-2 h-4 w-4" />
            {isClosed ? 'Start Reviewing' : 'Not Ready'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Error State
interface DashboardErrorProps {
  error: Error;
  onRetry: () => void;
}

function DashboardError({ error, onRetry }: DashboardErrorProps) {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive font-medium mb-2">Failed to load dashboard</p>
            <p className="text-sm text-muted-foreground mb-4">
              {error.message || 'An unexpected error occurred'}
            </p>
            <Button onClick={onRetry}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### Previous Story Intelligence

**From Story 3-3 (Judge Password Setup):**
- SetPasswordPage validates session with URL hash `type` parameter (invite/recovery/magiclink)
- Judge dashboard route `/judge/dashboard` is already protected by JudgeRoute
- send-judge-invitation Edge Function generates invite link via `auth.admin.generateLink()`
- Pattern: Use `authApi.fetchProfile()` to get profile after session established

**From Story 3-2 (Judge Invitation Email):**
- Categories have `assigned_judge_id` and `invited_at` columns
- When category closes, judge is invited
- Email includes contest name, category name, submission count

**From Story 3-1 (Assign Judge to Category):**
- Judges are created via `create-judge` Edge Function
- Profile created with role='judge' via database trigger
- Category assignment updates `assigned_judge_id` column

**From Admin Dashboard Pattern (src/pages/admin/DashboardPage.tsx):**
- Three-state pattern: loading, error, success
- StatCard component for metrics at top
- Grid layout for main content
- Empty state with icon and description
- Skeleton loading states
- Error state with retry button

### Codebase Patterns to Follow

**Import from feature index (project-context.md rule):**
```typescript
// CORRECT
import { useCategoriesByJudge, type CategoryWithContext } from '@/features/categories';

// WRONG - Never deep import
import { useCategoriesByJudge } from '@/features/categories/hooks/useCategoriesByJudge';
```

**Component structure (implementation-patterns.md):**
1. Imports (React first, external, internal)
2. Types (interface for props)
3. Component (named export)
4. Hooks first, handlers, then render

**TanStack Query pattern (project-context.md):**
- Use global queryClient settings (don't override refetchOnWindowFocus)
- Query keys follow convention: `['resource', 'filter', filterValue]`

### Testing Guidance

**Unit Tests (src/pages/judge/DashboardPage.test.tsx):**

1. **Loading state:**
   - Renders skeleton when data is loading

2. **Empty state (AC5):**
   - Shows "No categories assigned yet" when categories array is empty

3. **Categories display (AC2):**
   - Renders all assigned categories
   - Each card shows contest name, category name, status, submission count

4. **Closed category (AC3):**
   - Card has highlight styling (border-primary)
   - "Start Reviewing" button is enabled
   - Badge shows "Closed"

5. **Published category (AC4):**
   - Card has default styling
   - Shows "Awaiting deadline: {relative time}"
   - "Start Reviewing" button is disabled
   - Badge shows "Published"

6. **Stats cards:**
   - Shows correct counts for total, closed, awaiting

7. **Logout:**
   - Clicking logout calls signOut and navigates to /login

8. **Error state:**
   - Shows error message with retry button
   - Clicking retry calls refetch

**Mock Setup:**
```typescript
vi.mock('@/contexts', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'judge-123', email: 'judge@test.com', firstName: 'Test', role: 'judge' },
    signOut: vi.fn(),
  })),
}));

vi.mock('@/features/categories', () => ({
  useCategoriesByJudge: vi.fn(() => ({
    data: mockCategories,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));
```

### Quality Gates

Before marking as "review":

```bash
# Git Status (REQUIRED)
git status          # Must show clean
git log --oneline -5  # Verify commits have "3-4:" prefix
git push -u origin story/3-4-judge-login-dashboard

# Quality Gates (REQUIRED)
npm run build       # Must pass
npm run lint        # Must pass
npm run type-check  # Must pass
npm run test        # Must pass

# Manual Test (REQUIRED)
# 1. Log in as existing judge → Redirected to /judge/dashboard
# 2. Dashboard shows assigned categories with contest name, category name, status, count
# 3. Published category: Shows deadline, button disabled
# 4. Closed category: Card highlighted, "Start Reviewing" enabled
# 5. Create new judge with no assignments → Empty state displayed
# 6. Test forgot password link on login page
# 7. Log out → Redirected to login
```

### Reference Documents

- [Source: epic-3-judge-onboarding-assignment.md#Story 3.4]
- [Source: project-context.md#Authentication Rules]
- [Source: architecture/core-architectural-decisions.md#Authentication & Security]
- [Source: 3-3-judge-password-setup.md#Developer Context]
- [Source: src/pages/admin/DashboardPage.tsx] (pattern reference)
- [Source: src/features/categories/api/categoriesApi.ts] (API patterns)
- [Source: src/features/categories/hooks/useCategoriesByDivision.ts] (hook pattern)

## Tasks / Subtasks

- [ ] Create API method for fetching judge categories (AC2)
  - [ ] Add `listByJudge()` method to categoriesApi.ts
  - [ ] Add `CategoryWithContext` type to category.types.ts
  - [ ] Include submission count in response
  - [ ] Filter to published/closed categories only

- [ ] Create TanStack Query hook (AC2)
  - [ ] Create src/features/categories/hooks/useCategoriesByJudge.ts
  - [ ] Update src/features/categories/hooks/index.ts with export
  - [ ] Update src/features/categories/index.ts with export

- [ ] Implement JudgeDashboardPage (AC1-AC5)
  - [ ] Update src/pages/judge/DashboardPage.tsx
  - [ ] Implement header with user greeting and logout
  - [ ] Implement stat cards (total, closed, awaiting)
  - [ ] Implement category card component
  - [ ] Implement closed category styling (AC3)
  - [ ] Implement published category display (AC4)
  - [ ] Implement empty state (AC5)
  - [ ] Implement loading skeleton
  - [ ] Implement error state with retry

- [ ] Write unit tests
  - [ ] Create src/pages/judge/DashboardPage.test.tsx
  - [ ] Test loading, empty, success, error states
  - [ ] Test category card variants (closed vs published)
  - [ ] Test logout functionality

- [ ] Verify login flow works (AC1, AC6)
  - [ ] Confirm judge login redirects to /judge/dashboard
  - [ ] Confirm forgot password flow works for judges

- [ ] Run quality gates and verify

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes

### File List
