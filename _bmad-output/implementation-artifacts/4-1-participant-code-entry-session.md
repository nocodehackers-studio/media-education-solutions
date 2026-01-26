# Story 4.1: Participant Code Entry & Session

Status: ready-for-dev

## Story

As a **Participant**,
I want **to access a contest using my contest code and participant code**,
So that **I can submit my work without creating an account**.

## Acceptance Criteria

### AC1: Entry Form Display
**Given** I am on the participant entry page (/enter)
**When** I see the form
**Then** I see two input fields: Contest Code (6 characters) and Participant Code (8 characters)
**And** a "Enter Contest" button

### AC2: Successful Code Entry
**Given** I enter a valid contest code and valid participant code
**When** I click "Enter Contest"
**Then** a participant session is created
**And** my session is stored (localStorage + context)
**And** I am redirected to the participant info page

### AC3: Invalid Contest Code
**Given** I enter an invalid contest code
**When** I click "Enter Contest"
**Then** I see an error "Contest not found"

### AC4: Invalid Participant Code
**Given** I enter an invalid participant code
**When** I click "Enter Contest"
**Then** I see an error "Invalid participant code"

### AC5: Contest Not Accepting Submissions
**Given** the contest is not Published (Draft, Closed, Reviewed, or Finished)
**When** I try to enter
**Then** I see an error "This contest is not accepting submissions"

### AC6: Session Timeout Warning
**Given** I have an active session
**When** I am inactive for 115 minutes (5 min before expiry)
**Then** I see a session timeout warning modal
**And** I can click "Stay Signed In" to extend the session

### AC7: Session Expiry
**Given** I have an active session
**When** I am inactive for 120 minutes
**Then** I am redirected to the entry page
**And** I see a message "Session expired"

### AC8: Existing Session Restore
**Given** I have a valid session in localStorage
**When** I return to the app
**Then** my session is restored automatically
**And** I am redirected to the participant dashboard

### AC9: Participant Code Already Used
**Given** I enter a code that has status='used'
**When** I click "Enter Contest"
**Then** I am still allowed to enter (code can be reused by same participant)
**And** session is created with existing participant data

## Developer Context

### Architecture Requirements

**Authentication Flow (Participant - NO Supabase Auth):**

Per project-context.md, participants do NOT use Supabase Auth. They use a code-based session:

1. Participant enters contest code + participant code on `/enter` page
2. Edge Function `validate-participant` validates codes and returns participant data
3. Session stored in localStorage with timestamp
4. ParticipantSessionContext provides session state to React app
5. Session expires after 120 minutes of inactivity

**ParticipantSessionContext Architecture:**

```typescript
interface ParticipantSession {
  participantId: string;
  code: string;
  contestId: string;
  contestCode: string;
  contestName: string;
  lastActivity: number;  // timestamp for inactivity tracking
  // From participant table (if used before):
  name?: string;
  organizationName?: string;
}

interface ParticipantSessionContextType {
  session: ParticipantSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  enterContest: (contestCode: string, participantCode: string) => Promise<void>;
  endSession: () => void;
  updateActivity: () => void;  // Called on user interaction
}
```

### Technical Requirements

**Feature Location:** Extend `src/features/participants/` and create new context

**New/Modified Files:**
```
src/contexts/
├── ParticipantSessionContext.tsx   # NEW: Context definition
├── ParticipantSessionProvider.tsx  # NEW: Provider with localStorage
└── index.ts                        # MODIFY: Export new context

src/features/participants/
├── api/
│   └── participantsApi.ts          # NEW: API for code validation
├── components/
│   ├── CodeEntryForm.tsx           # NEW: Form component
│   ├── CodeEntryForm.test.tsx      # NEW: Tests
│   └── SessionTimeoutWarning.tsx   # NEW: Timeout modal
├── hooks/
│   ├── useSessionTimeout.ts        # NEW: Timeout logic
│   └── index.ts                    # MODIFY: Export hooks
├── types/
│   ├── participant.types.ts        # MODIFY: Add session types
│   └── participant.schemas.ts      # NEW: Zod schemas
└── index.ts                        # MODIFY: Export all

src/pages/participant/
└── CodeEntryPage.tsx               # NEW: Entry page

src/router/
├── ParticipantRoute.tsx            # NEW: Route guard
└── index.tsx                       # MODIFY: Add participant routes

src/lib/
└── errorCodes.ts                   # MODIFY: Add participant error codes

supabase/functions/
└── validate-participant/           # NEW: Edge Function
    └── index.ts
```

### Database Schema

**Existing participants table (from Story 2.3):**
```sql
CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  code TEXT NOT NULL CHECK (LENGTH(code) = 8),
  status TEXT DEFAULT 'unused' CHECK (status IN ('unused', 'used')),
  name TEXT,
  organization_name TEXT,
  tlc_name TEXT,
  tlc_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contest_id, code)
);
```

**No new migrations needed** - table already exists with required columns.

### Edge Function Implementation

**supabase/functions/validate-participant/index.ts:**

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  contestCode: string;
  participantCode: string;
}

interface ValidationResponse {
  success: boolean;
  participantId?: string;
  contestId?: string;
  contestName?: string;
  participantData?: {
    name: string | null;
    organizationName: string | null;
    status: string;
  };
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { contestCode, participantCode }: ValidationRequest = await req.json();

    if (!contestCode || !participantCode) {
      throw new Error('MISSING_CODES');
    }

    // Normalize codes (uppercase, trim)
    const normalizedContestCode = contestCode.trim().toUpperCase();
    const normalizedParticipantCode = participantCode.trim().toUpperCase();

    // Use service role to bypass RLS (participants are public codes)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Find contest by code
    const { data: contest, error: contestError } = await supabaseAdmin
      .from('contests')
      .select('id, name, status, contest_code')
      .eq('contest_code', normalizedContestCode)
      .single();

    if (contestError || !contest) {
      return new Response(
        JSON.stringify({ success: false, error: 'CONTEST_NOT_FOUND' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Check contest status - must be 'published' to accept submissions
    if (contest.status !== 'published') {
      return new Response(
        JSON.stringify({ success: false, error: 'CONTEST_NOT_ACCEPTING' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Find participant by code within this contest
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('participants')
      .select('id, code, status, name, organization_name')
      .eq('contest_id', contest.id)
      .eq('code', normalizedParticipantCode)
      .single();

    if (participantError || !participant) {
      return new Response(
        JSON.stringify({ success: false, error: 'INVALID_PARTICIPANT_CODE' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Success - return participant and contest data
    const response: ValidationResponse = {
      success: true,
      participantId: participant.id,
      contestId: contest.id,
      contestName: contest.name,
      participantData: {
        name: participant.name,
        organizationName: participant.organization_name,
        status: participant.status,
      },
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### ParticipantSessionProvider Implementation

**src/contexts/ParticipantSessionProvider.tsx:**

```typescript
import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { ParticipantSessionContext, type ParticipantSession } from './ParticipantSessionContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const STORAGE_KEY = 'participant_session';
const SESSION_TIMEOUT_MS = 120 * 60 * 1000; // 120 minutes
const WARNING_BEFORE_MS = 5 * 60 * 1000;    // 5 minutes before expiry

interface Props {
  children: ReactNode;
}

export function ParticipantSessionProvider({ children }: Props) {
  const [session, setSession] = useState<ParticipantSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem(STORAGE_KEY);
    if (savedSession) {
      try {
        const parsed: ParticipantSession = JSON.parse(savedSession);
        const elapsed = Date.now() - parsed.lastActivity;

        if (elapsed < SESSION_TIMEOUT_MS) {
          setSession(parsed);
        } else {
          // Session expired - clear it
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Persist session to localStorage when it changes
  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  }, [session]);

  // Session timeout check
  useEffect(() => {
    if (!session) return;

    const checkTimeout = () => {
      const elapsed = Date.now() - session.lastActivity;
      const remaining = SESSION_TIMEOUT_MS - elapsed;

      if (remaining <= 0) {
        // Session expired
        endSession();
        toast.error('Session expired. Please enter your codes again.');
        return;
      }

      if (remaining <= WARNING_BEFORE_MS && !showWarning) {
        setShowWarning(true);
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkTimeout, 30_000);
    checkTimeout(); // Initial check

    return () => clearInterval(interval);
  }, [session, showWarning]);

  const enterContest = useCallback(async (contestCode: string, participantCode: string) => {
    const { data, error } = await supabase.functions.invoke('validate-participant', {
      body: { contestCode, participantCode },
    });

    if (error || !data.success) {
      throw new Error(data?.error || error?.message || 'Validation failed');
    }

    const newSession: ParticipantSession = {
      participantId: data.participantId,
      code: participantCode.toUpperCase(),
      contestId: data.contestId,
      contestCode: contestCode.toUpperCase(),
      contestName: data.contestName,
      lastActivity: Date.now(),
      name: data.participantData?.name || undefined,
      organizationName: data.participantData?.organizationName || undefined,
    };

    setSession(newSession);
    setShowWarning(false);
  }, []);

  const endSession = useCallback(() => {
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
    setShowWarning(false);
  }, []);

  const updateActivity = useCallback(() => {
    if (session) {
      setSession({ ...session, lastActivity: Date.now() });
      setShowWarning(false);
    }
  }, [session]);

  const extendSession = useCallback(() => {
    updateActivity();
    toast.success('Session extended');
  }, [updateActivity]);

  const value = useMemo(
    () => ({
      session,
      isLoading,
      isAuthenticated: !!session,
      showWarning,
      enterContest,
      endSession,
      updateActivity,
      extendSession,
    }),
    [session, isLoading, showWarning, enterContest, endSession, updateActivity, extendSession]
  );

  return (
    <ParticipantSessionContext.Provider value={value}>
      {children}
    </ParticipantSessionContext.Provider>
  );
}
```

### CodeEntryForm Implementation

**src/features/participants/components/CodeEntryForm.tsx:**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@/components/ui';
import { codeEntrySchema, type CodeEntryFormData } from '../types/participant.schemas';

interface CodeEntryFormProps {
  onSubmit: (data: CodeEntryFormData) => Promise<void>;
  isLoading?: boolean;
}

export function CodeEntryForm({ onSubmit, isLoading = false }: CodeEntryFormProps) {
  const form = useForm<CodeEntryFormData>({
    resolver: zodResolver(codeEntrySchema),
    mode: 'onBlur',
    defaultValues: {
      contestCode: '',
      participantCode: '',
    },
  });

  const handleSubmit = async (data: CodeEntryFormData) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="contestCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contest Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="6 characters"
                  maxLength={6}
                  autoComplete="off"
                  disabled={isLoading}
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="participantCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Participant Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="8 characters"
                  maxLength={8}
                  autoComplete="off"
                  disabled={isLoading}
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enter Contest
        </Button>
      </form>
    </Form>
  );
}
```

### Zod Schema

**src/features/participants/types/participant.schemas.ts:**

```typescript
import { z } from 'zod';

export const codeEntrySchema = z.object({
  contestCode: z
    .string()
    .min(6, 'Contest code must be 6 characters')
    .max(6, 'Contest code must be 6 characters')
    .regex(/^[A-Z0-9]{6}$/i, 'Contest code must contain only letters and numbers'),
  participantCode: z
    .string()
    .min(8, 'Participant code must be 8 characters')
    .max(8, 'Participant code must be 8 characters')
    .regex(/^[A-Z0-9]{8}$/i, 'Participant code must contain only letters and numbers'),
});

export type CodeEntryFormData = z.infer<typeof codeEntrySchema>;
```

### Error Codes Update

**Add to src/lib/errorCodes.ts:**

```typescript
// Add to ERROR_CODES
CONTEST_NOT_FOUND: 'CONTEST_NOT_FOUND',
CONTEST_NOT_ACCEPTING: 'CONTEST_NOT_ACCEPTING',
INVALID_PARTICIPANT_CODE: 'INVALID_PARTICIPANT_CODE',
PARTICIPANT_SESSION_EXPIRED: 'PARTICIPANT_SESSION_EXPIRED',
MISSING_CODES: 'MISSING_CODES',

// Add to ERROR_MESSAGES
CONTEST_NOT_FOUND: 'Contest not found',
CONTEST_NOT_ACCEPTING: 'This contest is not accepting submissions',
INVALID_PARTICIPANT_CODE: 'Invalid participant code',
PARTICIPANT_SESSION_EXPIRED: 'Your session has expired. Please enter your codes again.',
MISSING_CODES: 'Please enter both codes',
```

### ParticipantRoute Guard

**src/router/ParticipantRoute.tsx:**

```typescript
import { Navigate, useLocation } from 'react-router-dom';
import { useParticipantSession } from '@/contexts';

interface ParticipantRouteProps {
  children: React.ReactNode;
}

export function ParticipantRoute({ children }: ParticipantRouteProps) {
  const { isLoading, isAuthenticated } = useParticipantSession();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/enter" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

### Router Updates

**Add to src/router/index.tsx:**

```typescript
// Add lazy imports
const CodeEntryPage = lazy(() =>
  import('@/pages/participant/CodeEntryPage').then((m) => ({ default: m.CodeEntryPage }))
);

// Add routes (before 404 catch-all)
{
  path: '/enter',
  element: (
    <LazyRoute>
      <CodeEntryPage />
    </LazyRoute>
  ),
},
{
  path: '/participant',
  element: <Navigate to="/participant/info" replace />,
},
{
  path: '/participant/info',
  element: (
    <ParticipantRoute>
      <LazyRoute>
        <ParticipantInfoPage />
      </LazyRoute>
    </ParticipantRoute>
  ),
},
```

### Session Timeout Warning Modal

**src/features/participants/components/SessionTimeoutWarning.tsx:**

```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui';

interface SessionTimeoutWarningProps {
  open: boolean;
  onExtend: () => void;
  onLogout: () => void;
}

export function SessionTimeoutWarning({ open, onExtend, onLogout }: SessionTimeoutWarningProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expiring Soon</AlertDialogTitle>
          <AlertDialogDescription>
            Your session will expire in less than 5 minutes due to inactivity.
            Would you like to stay signed in?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onLogout}>Log Out</AlertDialogCancel>
          <AlertDialogAction onClick={onExtend}>Stay Signed In</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Testing Guidance

**Unit Tests (src/features/participants/components/CodeEntryForm.test.tsx):**

1. **Form rendering:** Both input fields displayed
2. **Validation - short contest code:** Shows error "Contest code must be 6 characters"
3. **Validation - short participant code:** Shows error "Participant code must be 8 characters"
4. **Validation - invalid characters:** Shows error about letters and numbers only
5. **Auto-uppercase:** Input converts to uppercase on change
6. **Submit success:** Calls onSubmit with form data
7. **Loading state:** Button disabled and shows spinner

**Integration Tests (CodeEntryPage.test.tsx):**

1. **Successful entry:** Mock Edge Function success → redirects to /participant/info
2. **Contest not found (AC3):** Mock error → shows "Contest not found"
3. **Invalid participant code (AC4):** Mock error → shows "Invalid participant code"
4. **Contest not accepting (AC5):** Mock error → shows "This contest is not accepting submissions"

**Session Tests (ParticipantSessionProvider.test.tsx):**

1. **Session restore:** Saves to localStorage, new render restores session
2. **Session expiry:** Session older than 120 min is not restored
3. **Warning display:** After 115 min, showWarning is true
4. **Extend session:** extendSession resets lastActivity

### Quality Gates

Before marking as "review":

```bash
# Git Status (REQUIRED)
git status          # Must show clean
git log --oneline -5  # Verify commits have "4-1:" prefix
git push -u origin story/4-1-participant-code-entry-session

# Quality Gates (REQUIRED)
npm run build       # Must pass
npm run lint        # Must pass
npm run type-check  # Must pass
npm run test        # Must pass

# Edge Function Deployment (REQUIRED)
npx supabase functions deploy validate-participant

# Manual Test (REQUIRED)
# 1. Navigate to /enter
# 2. Enter invalid contest code → "Contest not found"
# 3. Enter valid contest code + invalid participant code → "Invalid participant code"
# 4. Enter valid codes for draft contest → "not accepting submissions"
# 5. Enter valid codes for published contest → Redirect to /participant/info
# 6. Refresh page → Session restored
# 7. Wait 115 min (or mock) → Warning modal appears
# 8. Click "Stay Signed In" → Warning dismissed, session extended
# 9. Wait 120 min → Redirected to /enter with expired message
```

### Reference Documents

- [Source: epic-4-participant-submission-experience.md#Story 4.1]
- [Source: project-context.md#Authentication Rules]
- [Source: project-context.md#Bunny Upload Security]
- [Source: architecture/core-architectural-decisions.md#Authentication & Security]
- [Source: src/contexts/AuthProvider.tsx] (pattern reference)
- [Source: src/features/auth/components/LoginForm.tsx] (form pattern)
- [Source: supabase/functions/create-judge/index.ts] (Edge Function pattern)

## Tasks / Subtasks

- [ ] Create validate-participant Edge Function
  - [ ] Create supabase/functions/validate-participant/index.ts
  - [ ] Implement contest lookup by contest_code
  - [ ] Implement participant lookup by code within contest
  - [ ] Validate contest status is 'published'
  - [ ] Return participant and contest data on success
  - [ ] Deploy: `npx supabase functions deploy validate-participant`

- [ ] Create ParticipantSessionContext and Provider
  - [ ] Create src/contexts/ParticipantSessionContext.tsx (types + context)
  - [ ] Create src/contexts/ParticipantSessionProvider.tsx
  - [ ] Implement localStorage persistence
  - [ ] Implement session restore on mount
  - [ ] Implement 120-minute timeout logic
  - [ ] Implement 5-minute warning
  - [ ] Export from src/contexts/index.ts

- [ ] Create Zod schemas and types
  - [ ] Create src/features/participants/types/participant.schemas.ts
  - [ ] Create CodeEntryFormData type
  - [ ] Export from feature index

- [ ] Create CodeEntryForm component
  - [ ] Create src/features/participants/components/CodeEntryForm.tsx
  - [ ] Implement form with React Hook Form + Zod
  - [ ] Auto-uppercase input values
  - [ ] Loading state handling

- [ ] Create SessionTimeoutWarning component
  - [ ] Create src/features/participants/components/SessionTimeoutWarning.tsx
  - [ ] Implement AlertDialog with extend/logout options

- [ ] Create CodeEntryPage
  - [ ] Create src/pages/participant/CodeEntryPage.tsx
  - [ ] Integrate CodeEntryForm
  - [ ] Handle Edge Function errors with appropriate messages
  - [ ] Redirect to /participant/info on success
  - [ ] Handle session restore redirect

- [ ] Create ParticipantRoute guard
  - [ ] Create src/router/ParticipantRoute.tsx
  - [ ] Check ParticipantSessionContext
  - [ ] Redirect to /enter if not authenticated

- [ ] Update router
  - [ ] Add /enter route
  - [ ] Add /participant routes (protected)
  - [ ] Add lazy loading for new pages

- [ ] Update error codes
  - [ ] Add CONTEST_NOT_FOUND, CONTEST_NOT_ACCEPTING, etc. to errorCodes.ts

- [ ] Update feature exports
  - [ ] Export from participants/index.ts
  - [ ] Export from contexts/index.ts

- [ ] Write unit tests
  - [ ] CodeEntryForm.test.tsx
  - [ ] ParticipantSessionProvider.test.tsx
- [ ] CodeEntryPage.test.tsx

- [ ] Run quality gates and verify

### Review Follow-ups (AI)

- [ ] [AI-Review][High] Allow 'unused' participant status or update status on entry; current validation rejects unused codes. [supabase/functions/validate-participant/index.ts:99]
- [ ] [AI-Review][High] Implement inactivity tracking by calling updateActivity on user interaction/route changes to satisfy AC6/AC7. [src/contexts/ParticipantSessionProvider.tsx:72]
- [ ] [AI-Review][Medium] Set `expired` state on redirect to /enter so AC7 message shows. [src/router/ParticipantRoute.tsx:27]
- [ ] [AI-Review][Medium] Root route should respect participant session (redirect to /participant/info when authenticated). [src/router/index.tsx:192]
- [ ] [AI-Review][Medium] Add missing tests for entry/session flows. [src/pages/participant/CodeEntryPage.test.tsx:1]
- [ ] [AI-Review][Medium] Add missing tests for session provider behavior. [src/contexts/ParticipantSessionProvider.test.tsx:1]
- [ ] [AI-Review][Medium] Update story status and Dev Agent Record/File List to reflect actual work. [_bmad-output/implementation-artifacts/4-1-participant-code-entry-session.md:3]
- [ ] [AI-Review][Low] Align error message punctuation with AC text. [src/lib/errorCodes.ts:33]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes

### File List
