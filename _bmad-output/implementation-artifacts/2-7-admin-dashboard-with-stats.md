# Story 2.7: Admin Dashboard with Stats

Status: done

## Story

As a **Super Admin**,
I want **to see an overview of all contests with key metrics**,
So that **I can quickly assess contest health and judge progress**.

## Acceptance Criteria

### AC1: Summary Statistics
**Given** I am on the admin dashboard
**When** the page loads
**Then** I see a summary section with: Total Contests, Active Contests, Total Submissions

**Note:** Total Submissions will show 0 until Epic 4 (Participant Submission) is implemented. The submissions table doesn't have data yet.

### AC2: Active Contests List
**Given** I have active contests (status = 'published')
**When** I view the dashboard
**Then** I see a list of active contests with: name, status, submission count, judge progress percentage

**Note:** Submission count and judge progress will show 0/placeholder until Epic 3-5 are implemented. Focus on displaying contest data that exists now.

### AC3: Judge Progress Display
**Given** a contest has judges assigned
**When** I view its dashboard card
**Then** I see "Judge Progress: X/Y reviewed" where X is completed reviews and Y is total submissions

**Note:** This will show "No judges assigned" until Epic 3 (Judge Onboarding) is implemented. Placeholder UI is acceptable.

### AC4: Contest Navigation
**Given** I click on a contest in the dashboard
**When** I am redirected
**Then** I land on that contest's detail page

### AC5: Empty State
**Given** there are no contests
**When** I view the dashboard
**Then** I see an empty state with "Create your first contest" CTA

## Developer Context

### Architecture Requirements

**Data Sources:**
- `contests` table - for contest counts and list
- `participants` table - for participant code counts (available)
- `submissions` table - exists but empty until Epic 4
- `reviews` table - exists but empty until Epic 5

**Stat Calculations:**
```typescript
// Available now (Epic 2 data)
totalContests = COUNT(contests)
activeContests = COUNT(contests WHERE status = 'published')
totalParticipants = COUNT(participants) // codes generated

// Deferred (Epic 4+ data)
totalSubmissions = COUNT(submissions) // 0 until Epic 4
judgeProgress = COUNT(reviews) / COUNT(submissions) // N/A until Epic 5
```

### Previous Story Learnings (Story 2.6)

**What Story 2.6 Built:**
- ✅ Extended contestsApi with participant code methods
- ✅ useParticipantCodes and useGenerateCodes hooks
- ✅ Table component installed (shadcn/ui)
- ✅ 204 tests passing

**Current DashboardPage (from Story 2.2):**
- StatCard component exists with hardcoded "—" values
- Recent Contests placeholder exists
- Judge Progress placeholder exists
- Need to replace placeholders with real data

**Git Intelligence (Recent Commits):**
- `70d5d45` - fix: Use outline badge for unused codes per UX19 spec
- `3a65b6f` - fix: Address QA round 2 findings
- `a744041` - fix: Address code review findings for story 2-6

### Technical Requirements

**API Extensions:**

```typescript
// features/contests/api/contestsApi.ts - ADD THESE

async getStats() {
  // Total contests
  const { count: totalContests, error: contestsError } = await supabase
    .from('contests')
    .select('*', { count: 'exact', head: true });

  if (contestsError) throw contestsError;

  // Active contests (published)
  const { count: activeContests, error: activeError } = await supabase
    .from('contests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');

  if (activeError) throw activeError;

  // Total participants (codes generated)
  const { count: totalParticipants, error: participantsError } = await supabase
    .from('participants')
    .select('*', { count: 'exact', head: true });

  if (participantsError) throw participantsError;

  // Total submissions (0 until Epic 4)
  const { count: totalSubmissions, error: submissionsError } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true });

  // submissions table may not exist yet - handle gracefully
  const submissions = submissionsError ? 0 : (totalSubmissions ?? 0);

  return {
    totalContests: totalContests ?? 0,
    activeContests: activeContests ?? 0,
    totalParticipants: totalParticipants ?? 0,
    totalSubmissions: submissions,
  };
},

async listRecentContests(limit: number = 5) {
  const { data, error } = await supabase
    .from('contests')
    .select('id, name, status, contest_code, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(transformContest);
},

async listActiveContests() {
  const { data, error } = await supabase
    .from('contests')
    .select('id, name, status, contest_code, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(transformContest);
},
```

**Types:**

```typescript
// features/contests/types/contest.types.ts - ADD

export interface DashboardStats {
  totalContests: number;
  activeContests: number;
  totalParticipants: number;
  totalSubmissions: number;
}
```

**TanStack Query Hooks:**

```typescript
// features/contests/hooks/useDashboardStats.ts
import { useQuery } from '@tanstack/react-query';
import { contestsApi } from '../api/contestsApi';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => contestsApi.getStats(),
    staleTime: 30_000, // 30 seconds - stats don't need to be real-time
  });
}

// features/contests/hooks/useRecentContests.ts
export function useRecentContests(limit: number = 5) {
  return useQuery({
    queryKey: ['recent-contests', limit],
    queryFn: () => contestsApi.listRecentContests(limit),
  });
}

// features/contests/hooks/useActiveContests.ts
export function useActiveContests() {
  return useQuery({
    queryKey: ['active-contests'],
    queryFn: () => contestsApi.listActiveContests(),
  });
}
```

**Updated DashboardPage:**

```typescript
// pages/admin/DashboardPage.tsx - UPDATED
import { useNavigate } from 'react-router-dom';
import { Trophy, Activity, FileVideo, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/components/ui';
import { useDashboardStats, useRecentContests } from '@/features/contests';

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentContests, isLoading: contestsLoading } = useRecentContests(5);

  const handleContestClick = (contestId: string) => {
    navigate(`/admin/contests/${contestId}`);
  };

  const handleCreateContest = () => {
    navigate('/admin/contests');
  };

  // Show loading skeleton while fetching
  if (statsLoading) {
    return <DashboardSkeleton />;
  }

  const hasContests = (stats?.totalContests ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of all contests</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Contests"
          value={stats?.totalContests ?? 0}
          icon={Trophy}
        />
        <StatCard
          title="Active Contests"
          value={stats?.activeContests ?? 0}
          icon={Activity}
        />
        <StatCard
          title="Total Submissions"
          value={stats?.totalSubmissions ?? 0}
          icon={FileVideo}
        />
      </div>

      {/* Content */}
      {hasContests ? (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Contests */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Contests</CardTitle>
            </CardHeader>
            <CardContent>
              {contestsLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                <div className="space-y-3">
                  {recentContests?.map((contest) => (
                    <div
                      key={contest.id}
                      className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-md"
                      onClick={() => handleContestClick(contest.id)}
                    >
                      <div>
                        <p className="font-medium">{contest.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {contest.contestCode}
                        </p>
                      </div>
                      <Badge variant={contest.status === 'published' ? 'default' : 'secondary'}>
                        {contest.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Judge Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Judge Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>No judges assigned yet</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Judge assignments available in Epic 3
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Empty State (AC5) */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No contests yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first contest to get started
            </p>
            <Button onClick={handleCreateContest}>
              Create your first contest
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="h-4 w-48 bg-muted animate-pulse rounded mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### File Structure

```
src/
├── features/
│   └── contests/
│       ├── api/
│       │   └── contestsApi.ts           # UPDATE: add getStats, listRecentContests
│       ├── hooks/
│       │   ├── useDashboardStats.ts     # NEW
│       │   ├── useRecentContests.ts     # NEW
│       │   ├── useActiveContests.ts     # NEW (optional, for future use)
│       │   └── index.ts                 # UPDATE: export new hooks
│       ├── types/
│       │   └── contest.types.ts         # UPDATE: add DashboardStats type
│       └── index.ts                     # UPDATE: export new items
├── pages/
│   └── admin/
│       └── DashboardPage.tsx            # UPDATE: replace placeholders with real data
```

### Testing Guidance

**Unit Tests:**
- useDashboardStats.test.ts: Returns stats, handles errors
- useRecentContests.test.ts: Returns contests, respects limit
- DashboardPage.test.tsx:
  - Shows stats when loaded
  - Shows recent contests
  - Empty state when no contests
  - Click navigates to contest detail

**Manual Testing Checklist:**
1. Navigate to /admin (dashboard)
2. See stat cards with real numbers (or 0 if no data)
3. Create a contest → Dashboard stats update
4. Publish a contest → Active Contests increments
5. Recent Contests shows up to 5 most recent
6. Click on a contest → Navigates to detail page
7. Delete all contests → Empty state appears
8. Empty state CTA → Navigates to contests page

### Quality Gates

Before marking as "review":

```bash
# Git Status (REQUIRED)
□ git status          # Must show clean
□ git log --oneline -5  # Verify commits have "2-7:" prefix
□ git push -u origin story/2-7-admin-dashboard-with-stats

# Quality Gates (REQUIRED)
□ npm run build       # Must pass
□ npm run lint        # Must pass
□ npm run type-check  # Must pass
□ npm run test        # Must pass

# Import Compliance
□ All imports from feature index
□ No React namespace imports
□ Feature index.ts exports all new items
```

### Reference Documents

- [Source: epic-2-super-admin-authentication-contest-management.md#Story 2.7]
- [Source: project-context.md#Feature Architecture]
- [Source: Story 2.2 - DashboardPage with placeholders]
- [Source: architecture/core-architectural-decisions.md#Frontend State Management]

## Tasks / Subtasks

- [x] Add DashboardStats type to contest.types.ts
- [x] Add getStats() API method to contestsApi.ts
- [x] Add listRecentContests() API method to contestsApi.ts
- [x] Add listActiveContests() API method to contestsApi.ts
- [x] Create useDashboardStats hook
- [x] Create useRecentContests hook
- [x] Create useActiveContests hook
- [x] Update hooks/index.ts with new exports
- [x] Update feature index.ts with new exports
- [x] Update DashboardPage with real data and empty state
- [x] Write unit tests for useDashboardStats hook
- [x] Write unit tests for useRecentContests hook
- [x] Write tests for DashboardPage
- [x] Run all tests and quality checks

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

No debug issues encountered during implementation.

### Completion Notes

**Implementation Summary:**

1. **Types**: Added `DashboardStats` interface to `contest.types.ts` for dashboard statistics.

2. **API Methods**: Extended `contestsApi.ts` with three new methods:
   - `getStats()`: Returns dashboard statistics (total contests, active contests, total participants, total submissions)
   - `listRecentContests(limit)`: Returns recent contests ordered by creation date
   - `listActiveContests()`: Returns contests with status = 'published'

3. **TanStack Query Hooks**: Created three new hooks:
   - `useDashboardStats`: Fetches stats with 30s stale time
   - `useRecentContests`: Fetches recent contests with configurable limit
   - `useActiveContests`: Fetches active/published contests

4. **DashboardPage Updates**:
   - Replaced hardcoded "—" values with real data from hooks
   - Added loading skeletons for better UX
   - Implemented empty state (AC5) with "Create your first contest" CTA
   - Added keyboard navigation support for contest items
   - Contest click navigates to detail page (AC4)

5. **Tests Added**:
   - `useDashboardStats.test.tsx`: 7 tests covering loading, error, and success states
   - `useRecentContests.test.tsx`: 8 tests covering loading, error, limit parameter, and query keys
   - `DashboardPage.test.tsx`: 10 tests covering all 5 acceptance criteria

**Quality Gates Passed**:
- `npm run type-check`: ✅ Pass
- `npm run lint`: ✅ Pass (only shadcn/ui warnings)
- `npm run test`: ✅ 230 tests passing
- `npm run build`: ✅ Pass

## Review Follow-ups (AI)

_To be filled by Code Review agent_

## File List

**New Files:**
- src/features/contests/hooks/useActiveContests.ts
- src/features/contests/hooks/useDashboardStats.test.tsx
- src/features/contests/hooks/useDashboardStats.ts
- src/features/contests/hooks/useRecentContests.test.tsx
- src/features/contests/hooks/useRecentContests.ts
- src/pages/admin/DashboardPage.test.tsx

**Modified Files:**
- _bmad-output/implementation-artifacts/sprint-status.yaml
- src/features/contests/api/contestsApi.ts
- src/features/contests/hooks/index.ts
- src/features/contests/index.ts
- src/features/contests/types/contest.types.ts
- src/pages/admin/DashboardPage.tsx

## Change Log

| Date | Change | Files |
|------|--------|-------|
| 2026-01-13 | Implement admin dashboard with real stats, recent contests, and empty state | contestsApi.ts, useDashboardStats.ts, useRecentContests.ts, useActiveContests.ts, DashboardPage.tsx, contest.types.ts |
