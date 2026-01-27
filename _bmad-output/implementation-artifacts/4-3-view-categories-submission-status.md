# Story 4.3: View Categories & Submission Status

Status: done

## Story

As a **Participant**,
I want **to see all available categories and my submission status**,
So that **I know where I can submit and what I've already submitted**.

## Acceptance Criteria

### AC1: Category List Display
**Given** I am on the participant categories page (/participant/categories)
**When** the page loads
**Then** I see a list of all categories for this contest
**And** each category shows: name, type (Video/Photo), deadline, my submission status

### AC2: Published Category Display
**Given** a category is "Published"
**When** I view it
**Then** I see a "Submit" button
**And** I see the deadline with countdown timer

### AC3: Draft Category Hidden
**Given** a category is "Draft"
**When** I view the contest
**Then** that category is NOT visible to me

### AC4: Closed Category Display
**Given** a category is "Closed"
**When** I view it
**Then** I see "Submissions closed" instead of submit button
**And** the card is visually muted

### AC5: Submitted Category Display
**Given** I have already submitted to a category
**When** I view that category
**Then** I see "Submitted" badge with checkmark
**And** I see "View/Edit" button instead of "Submit"

### AC6: Deadline Warning (2 hours)
**Given** the deadline is within 2 hours
**When** I view the category
**Then** the countdown timer is highlighted in amber/warning color

### AC7: Deadline Urgent (10 minutes)
**Given** the deadline is within 10 minutes
**When** I view the category
**Then** the countdown timer is highlighted in red/urgent color

## Developer Context

### Architecture Requirements

**Data Flow:**
1. Participant authenticated via ParticipantSessionContext
2. Fetch categories for contest (filter: status IN ['published', 'closed'])
3. For each category, check if participant has submitted
4. Display category cards with appropriate state

**Submissions Table:**
Story 4-4 creates the submissions table. For now, assume no submissions exist (all categories show "Submit" button). The submission status check can be added once 4-4 is complete.

### Technical Requirements

**Feature Location:** Extend `src/features/participants/` for participant-specific category views

**New/Modified Files:**
```
src/features/participants/
├── api/
│   └── participantsApi.ts              # MODIFY: Add getContestCategories
├── components/
│   ├── ParticipantCategoryCard.tsx     # NEW: Category card for participants
│   ├── ParticipantCategoryCard.test.tsx
│   ├── DeadlineCountdown.tsx           # NEW: Countdown timer component
│   └── index.ts                        # MODIFY: Export new components
├── hooks/
│   ├── useParticipantCategories.ts     # NEW: Query hook
│   └── index.ts                        # MODIFY: Export hook
└── index.ts                            # MODIFY: Export all

src/pages/participant/
└── ParticipantCategoriesPage.tsx       # MODIFY: Full implementation

supabase/functions/
└── get-participant-categories/         # NEW: Edge Function
    └── index.ts
```

### Edge Function Implementation

**supabase/functions/get-participant-categories/index.ts:**

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CategoryRequest {
  contestId: string;
  participantId: string;
  participantCode: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'METHOD_NOT_ALLOWED' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { contestId, participantId, participantCode }: CategoryRequest = await req.json();

    if (!contestId || !participantId || !participantCode) {
      throw new Error('MISSING_REQUIRED_FIELDS');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify participant belongs to contest
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('participants')
      .select('id')
      .eq('id', participantId)
      .eq('code', participantCode.toUpperCase())
      .eq('contest_id', contestId)
      .single();

    if (participantError || !participant) {
      return new Response(
        JSON.stringify({ success: false, error: 'INVALID_PARTICIPANT' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch categories for contest (published and closed only, not draft)
    // Join through divisions to get contest's categories
    const { data: divisions, error: divisionsError } = await supabaseAdmin
      .from('divisions')
      .select('id')
      .eq('contest_id', contestId);

    if (divisionsError) throw divisionsError;

    const divisionIds = divisions?.map(d => d.id) || [];

    if (divisionIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, categories: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select('id, name, type, deadline, status, description, division_id')
      .in('division_id', divisionIds)
      .in('status', ['published', 'closed'])  // AC3: Hide draft
      .order('deadline', { ascending: true });

    if (categoriesError) throw categoriesError;

    // Check submissions for this participant (if table exists)
    let submissionMap: Record<string, boolean> = {};
    try {
      const categoryIds = categories?.map(c => c.id) || [];
      if (categoryIds.length > 0) {
        const { data: submissions } = await supabaseAdmin
          .from('submissions')
          .select('category_id')
          .eq('participant_id', participantId)
          .in('category_id', categoryIds);

        if (submissions) {
          submissions.forEach(s => {
            submissionMap[s.category_id] = true;
          });
        }
      }
    } catch {
      // Submissions table may not exist yet - that's OK
    }

    // Transform to response format
    const result = categories?.map(cat => ({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      deadline: cat.deadline,
      status: cat.status,
      description: cat.description,
      hasSubmitted: submissionMap[cat.id] || false,
    })) || [];

    return new Response(
      JSON.stringify({ success: true, categories: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### DeadlineCountdown Component

**src/features/participants/components/DeadlineCountdown.tsx:**

```typescript
import { useState, useEffect } from 'react';
import { formatDistanceToNow, differenceInMinutes, differenceInHours } from 'date-fns';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeadlineCountdownProps {
  deadline: string;
  className?: string;
}

export function DeadlineCountdown({ deadline, className }: DeadlineCountdownProps) {
  const [now, setNow] = useState(Date.now());

  // Update every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const deadlineDate = new Date(deadline);
  const minutesRemaining = differenceInMinutes(deadlineDate, now);
  const hoursRemaining = differenceInHours(deadlineDate, now);

  // Determine urgency level (AC6, AC7)
  let urgency: 'normal' | 'warning' | 'urgent' = 'normal';
  if (minutesRemaining <= 10) {
    urgency = 'urgent';    // AC7: Within 10 minutes → red
  } else if (hoursRemaining < 2) {
    urgency = 'warning';   // AC6: Within 2 hours → amber
  }

  const urgencyStyles = {
    normal: 'text-muted-foreground',
    warning: 'text-amber-600 font-medium',
    urgent: 'text-red-600 font-bold animate-pulse',
  };

  // Past deadline
  if (minutesRemaining < 0) {
    return (
      <div className={cn('flex items-center gap-1 text-muted-foreground', className)}>
        <Clock className="h-4 w-4" />
        <span>Deadline passed</span>
      </div>
    );
  }

  const countdownText = formatDistanceToNow(deadlineDate, { addSuffix: true });

  return (
    <div className={cn('flex items-center gap-1', urgencyStyles[urgency], className)}>
      <Clock className="h-4 w-4" />
      <span>Due {countdownText}</span>
    </div>
  );
}
```

### ParticipantCategoryCard Component

**src/features/participants/components/ParticipantCategoryCard.tsx:**

```typescript
import { useNavigate } from 'react-router-dom';
import { Video, Image, CheckCircle } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { DeadlineCountdown } from './DeadlineCountdown';
import { cn } from '@/lib/utils';

interface ParticipantCategory {
  id: string;
  name: string;
  type: 'video' | 'photo';
  deadline: string;
  status: 'published' | 'closed';
  description: string | null;
  hasSubmitted: boolean;
}

interface ParticipantCategoryCardProps {
  category: ParticipantCategory;
}

export function ParticipantCategoryCard({ category }: ParticipantCategoryCardProps) {
  const navigate = useNavigate();
  const isClosed = category.status === 'closed';
  const TypeIcon = category.type === 'video' ? Video : Image;

  const handleSubmit = () => {
    navigate(`/participant/submit/${category.id}`);
  };

  const handleViewEdit = () => {
    navigate(`/participant/submission/${category.id}`);
  };

  return (
    <Card className={cn(isClosed && 'opacity-60')}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <TypeIcon className="h-5 w-5 text-muted-foreground" />
              {category.name}
            </CardTitle>
            {category.description && (
              <CardDescription>{category.description}</CardDescription>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {/* Type badge */}
            <Badge variant="outline">
              {category.type === 'video' ? 'Video' : 'Photo'}
            </Badge>
            {/* Submitted badge (AC5) */}
            {category.hasSubmitted && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Submitted
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          {/* Deadline countdown */}
          {!isClosed ? (
            <DeadlineCountdown deadline={category.deadline} />
          ) : (
            <span className="text-muted-foreground text-sm">Submissions closed</span>
          )}

          {/* Action button */}
          {isClosed ? (
            // AC4: Closed category
            <Button variant="outline" disabled>
              Closed
            </Button>
          ) : category.hasSubmitted ? (
            // AC5: Already submitted
            <Button variant="outline" onClick={handleViewEdit}>
              View/Edit
            </Button>
          ) : (
            // AC2: Published, not submitted
            <Button onClick={handleSubmit}>
              Submit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### useParticipantCategories Hook

**src/features/participants/hooks/useParticipantCategories.ts:**

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface ParticipantCategory {
  id: string;
  name: string;
  type: 'video' | 'photo';
  deadline: string;
  status: 'published' | 'closed';
  description: string | null;
  hasSubmitted: boolean;
}

interface UseParticipantCategoriesParams {
  contestId: string;
  participantId: string;
  participantCode: string;
}

export function useParticipantCategories({
  contestId,
  participantId,
  participantCode,
}: UseParticipantCategoriesParams) {
  return useQuery({
    queryKey: ['participant-categories', contestId, participantId],
    queryFn: async (): Promise<ParticipantCategory[]> => {
      const { data, error } = await supabase.functions.invoke('get-participant-categories', {
        body: { contestId, participantId, participantCode },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Failed to fetch categories');
      }

      return data.categories;
    },
    enabled: !!contestId && !!participantId && !!participantCode,
  });
}
```

### ParticipantCategoriesPage Implementation

**src/pages/participant/ParticipantCategoriesPage.tsx:**

```typescript
import { useNavigate } from 'react-router-dom';
import { LogOut, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/components/ui';
import {
  ParticipantCategoryCard,
  SessionTimeoutWarning,
  useParticipantCategories,
} from '@/features/participants';
import { useParticipantSession } from '@/contexts';

export function ParticipantCategoriesPage() {
  const navigate = useNavigate();
  const { session, showWarning, endSession, extendSession } = useParticipantSession();

  const {
    data: categories,
    isLoading,
    error,
    refetch,
  } = useParticipantCategories({
    contestId: session?.contestId || '',
    participantId: session?.participantId || '',
    participantCode: session?.code || '',
  });

  const handleLogout = () => {
    endSession();
    navigate('/enter', { replace: true });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive mb-4">Failed to load categories</p>
              <Button onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {session?.contestName || 'Contest'}
            </h1>
            <p className="text-muted-foreground">
              Welcome, {session?.name || 'Participant'}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Exit
          </Button>
        </div>

        {/* Categories List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Available Categories</h2>

          {categories?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No categories are currently accepting submissions.
                </p>
              </CardContent>
            </Card>
          ) : (
            categories?.map((category) => (
              <ParticipantCategoryCard key={category.id} category={category} />
            ))
          )}
        </div>
      </div>

      {/* Session timeout warning */}
      <SessionTimeoutWarning
        open={showWarning}
        onExtend={extendSession}
        onLogout={handleLogout}
      />
    </div>
  );
}
```

### Previous Story Intelligence

**From Story 4-1 (Code Entry & Session):**
- ParticipantSessionContext provides: participantId, code, contestId, contestName, name
- Session timeout warning via `showWarning` and `extendSession`
- Edge Function pattern with service role for participant operations

**From Story 4-2 (Info Form):**
- updateParticipantInfo updates session with name, organizationName
- Edge Functions verify participantCode + contestId before operations

**From Admin Categories (existing):**
- CategoryStatus: 'draft' | 'published' | 'closed'
- CategoryType: 'video' | 'photo'
- date-fns used for deadline formatting

### Testing Guidance

**Unit Tests (ParticipantCategoryCard.test.tsx):**

1. **Published category:** Shows "Submit" button, countdown timer
2. **Closed category:** Shows "Closed" button (disabled), muted styling (AC4)
3. **Submitted category:** Shows "Submitted" badge, "View/Edit" button (AC5)
4. **Video type:** Shows Video icon and "Video" badge
5. **Photo type:** Shows Image icon and "Photo" badge

**DeadlineCountdown.test.tsx:**

1. **Normal deadline:** Shows "Due in X days" with normal styling
2. **Warning (< 2 hours):** Shows amber styling (AC6)
3. **Urgent (< 10 minutes):** Shows red styling with animation (AC7)
4. **Past deadline:** Shows "Deadline passed"

**Integration Tests (ParticipantCategoriesPage.test.tsx):**

1. **Loading state:** Shows skeletons
2. **Empty state:** Shows "No categories" message
3. **Success state:** Shows category cards
4. **Error state:** Shows error with retry button
5. **Logout:** Calls endSession, navigates to /enter

### Quality Gates

Before marking as "review":

```bash
# Git Status (REQUIRED)
git status          # Must show clean
git log --oneline -5  # Verify commits have "4-3:" prefix
git push -u origin story/4-3-view-categories-submission-status

# Quality Gates (REQUIRED)
npm run build       # Must pass
npm run lint        # Must pass
npm run type-check  # Must pass
npm run test        # Must pass

# Edge Function Deployment (REQUIRED)
npx supabase functions deploy get-participant-categories

# Manual Test (REQUIRED)
# 1. Log in as participant → navigate to /participant/categories
# 2. Verify only published/closed categories shown (no draft)
# 3. Published category: Shows countdown + Submit button
# 4. Closed category: Shows "Closed" disabled, card muted
# 5. Set deadline to < 2 hours → Amber countdown
# 6. Set deadline to < 10 minutes → Red countdown with pulse
# 7. Click "Submit" → Navigates to /participant/submit/{id}
```

### Reference Documents

- [Source: epic-4-participant-submission-experience.md#Story 4.3]
- [Source: project-context.md#Authentication Rules]
- [Source: 4-1-participant-code-entry-session.md] (session pattern)
- [Source: 4-2-participant-info-form.md] (Edge Function pattern)
- [Source: src/features/categories/components/CategoryCard.tsx] (deadline formatting)
- [Source: src/pages/judge/DashboardPage.tsx] (countdown pattern)

## Tasks / Subtasks

- [x] Create get-participant-categories Edge Function
  - [x] Create supabase/functions/get-participant-categories/index.ts
  - [x] Verify participant belongs to contest
  - [x] Fetch categories with status IN ['published', 'closed']
  - [x] Check submissions for hasSubmitted flag
  - [x] Deploy: `npx supabase functions deploy get-participant-categories`

- [x] Create DeadlineCountdown component
  - [x] Create src/features/participants/components/DeadlineCountdown.tsx
  - [x] Implement countdown with date-fns
  - [x] Add urgency styling (normal/warning/urgent)
  - [x] Update every minute

- [x] Create ParticipantCategoryCard component
  - [x] Create src/features/participants/components/ParticipantCategoryCard.tsx
  - [x] Show type icon and badge
  - [x] Show deadline countdown
  - [x] Show submission status badge
  - [x] Handle closed/submitted/open states

- [x] Create useParticipantCategories hook
  - [x] Create src/features/participants/hooks/useParticipantCategories.ts
  - [x] Call Edge Function with session data
  - [x] Return typed category array

- [x] Implement ParticipantCategoriesPage
  - [x] Update src/pages/participant/ParticipantCategoriesPage.tsx
  - [x] Fetch categories on mount
  - [x] Display loading/error/empty states
  - [x] Render category cards

- [x] Update feature exports
  - [x] Export new components from index.ts
  - [x] Export hook from hooks/index.ts

- [x] Write unit tests
  - [x] DeadlineCountdown.test.tsx
  - [x] ParticipantCategoryCard.test.tsx
  - [x] ParticipantCategoriesPage.test.tsx

- [x] Run quality gates and verify

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None required - all tests pass.

### Completion Notes

- All ACs verified through unit tests
- Edge function deployed to Supabase
- Fixed pre-existing unused variable in ParticipantInfoPage.test.tsx

### Review Notes

- Adversarial review completed
- Findings: 12 total, 10 fixed, 2 deferred (noise)
- Resolution approach: auto-fix real findings
- Deferred items added to future-work.md

### File List

**New Files:**
- supabase/functions/get-participant-categories/index.ts
- src/features/participants/components/DeadlineCountdown.tsx
- src/features/participants/components/DeadlineCountdown.test.tsx
- src/features/participants/components/ParticipantCategoryCard.tsx
- src/features/participants/components/ParticipantCategoryCard.test.tsx
- src/features/participants/hooks/useParticipantCategories.ts
- src/pages/participant/ParticipantCategoriesPage.test.tsx

**Modified Files:**
- src/features/participants/api/participantsApi.ts
- src/features/participants/hooks/index.ts
- src/features/participants/index.ts
- src/pages/participant/ParticipantCategoriesPage.tsx
- src/pages/participant/ParticipantInfoPage.test.tsx (pre-existing fix)
