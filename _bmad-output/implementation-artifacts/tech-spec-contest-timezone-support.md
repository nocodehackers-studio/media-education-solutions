---
title: 'Contest Timezone Support'
slug: 'contest-timezone-support'
created: '2026-02-05'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
adversarial_review: 'completed-2026-02-05 (2 rounds, 14 findings addressed)'
tech_stack: ['React 19', 'TypeScript', 'Supabase', 'TanStack Query', 'React Hook Form', 'Zod', 'date-fns', 'date-fns-tz@3.x (new)', 'shadcn/ui']
files_to_modify:
  - 'supabase/migrations/*.sql (new migration)'
  - 'src/features/contests/types/contest.types.ts'
  - 'src/features/contests/types/contest.schemas.ts'
  - 'src/features/categories/types/category.schemas.ts'
  - 'src/features/contests/components/CreateContestForm.tsx'
  - 'src/features/contests/components/EditContestForm.tsx'
  - 'src/features/categories/components/CreateCategoryForm.tsx'
  - 'src/features/categories/components/EditCategoryForm.tsx'
  - 'src/features/categories/components/CategoriesTab.tsx'
  - 'src/features/participants/components/DeadlineCountdown.tsx'
  - 'src/features/submissions/types/adminSubmission.types.ts'
  - 'src/features/contests/components/ContestCard.tsx'
  - 'src/features/contests/api/contestsApi.ts'
  - 'src/features/categories/api/categoriesApi.ts'
  - 'src/contexts/ParticipantSessionContext.tsx'
  - 'src/lib/dateUtils.ts (new)'
  - 'supabase/functions/validate-participant/index.ts'
  - 'supabase/functions/send-judge-invitation/index.ts'
  - 'supabase/functions/create-video-upload/index.ts'
  - 'supabase/functions/upload-photo/index.ts'
  - 'supabase/functions/withdraw-submission/index.ts'
code_patterns:
  - 'snake_case in DB, camelCase in TS'
  - 'Zod schemas for validation'
  - 'React Hook Form + zodResolver'
  - 'TanStack Query for server state'
  - 'Feature index.ts exports'
test_patterns:
  - 'Co-located tests (*.test.tsx)'
  - 'Vitest + Testing Library'
---

# Tech-Spec: Contest Timezone Support

**Created:** 2026-02-05
**Adversarial Review:** Completed - 22 findings addressed

## Overview

### Problem Statement

Contests run in different cities worldwide (Madrid, New York, Miami, etc.). Admins need to set category deadlines in local time (e.g., "midnight Madrid" or "8 PM New York"), but currently there's no timezone awareness — deadlines are stored without timezone context, making them ambiguous for international contests.

### Solution

Add a timezone field to contests with a city-based dropdown (showing major cities with UTC offset, defaulting to Miami/America/New_York). Add a time picker to category deadlines allowing full hour:minute selection with AM/PM format. Display all dates/times in the contest's timezone for admins, judges, and participants. Store timestamps in UTC in the database while preserving the contest timezone for display purposes.

### Scope

**In Scope:**
- New `timezone` column on `contests` table (default: `America/New_York` for Miami)
- Timezone dropdown on CreateContestForm and EditContestForm (major cities + UTC offset display)
- Time picker on CreateCategoryForm and EditCategoryForm (hour:minute with AM/PM selector)
- All deadline displays converted to contest timezone (admin, judge, participant views)
- Migration to backfill existing contests with default timezone
- DeadlineCountdown component updates to use contest timezone
- Edge function updates for timezone-aware deadline comparison
- Judge invitation email timezone display

**Out of Scope:**
- Per-user timezone preferences (everyone sees contest timezone)
- Automatic timezone detection from browser

## Context for Development

### Codebase Patterns

**Database:**
- `contests` table: id, name, description, slug, contest_code, rules, status, etc. — NO timezone currently
- `categories` table: deadline stored as `TIMESTAMPTZ` — currently date-only picker stores midnight UTC
- RLS policies exist for admin access

**Forms:**
- CreateContestForm: name, description, contestCode, rules — no timezone
- EditContestForm: name, description, rules — no timezone
- CreateCategoryForm: date picker via shadcn Calendar, stores `date.toISOString()` (midnight UTC)
- EditCategoryForm: same pattern

**Date Formatting (CURRENT - NEEDS CENTRALIZATION):**
- `formatSubmissionDate()` in adminSubmission.types.ts — uses `toLocaleDateString()` (browser TZ)
- `formatDate()` duplicated in CreateCategoryForm and EditCategoryForm — uses `Intl.DateTimeFormat` (no TZ)
- `DeadlineCountdown` uses `date-fns` `formatDistanceToNow()` — relative time, browser TZ
- `computeDaysLeft()` in ContestCard — uses `new Date()` arithmetic, browser TZ

**Critical Transform Functions:**
- `transformContestRow()` in `contestsApi.ts` (lines 17-36) — MUST be updated to include timezone
- `transformCategory()` in `category.types.ts` — may need contest timezone from join

**Dependencies:**
- `date-fns` v4.1.0 installed
- `date-fns-tz` NOT installed — **need to add v3.x for compatibility**

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/features/contests/types/contest.types.ts` | Contest/ContestRow interfaces — add `timezone` field |
| `src/features/contests/types/contest.schemas.ts` | Zod schemas for create/update — add timezone validation |
| `src/features/categories/types/category.schemas.ts` | Zod schemas — update deadline to include time |
| `src/features/categories/types/category.types.ts` | Category interface — deadline stays string (ISO) |
| `src/features/contests/api/contestsApi.ts` | **CRITICAL:** `transformContestRow()` must include timezone |
| `src/features/contests/components/CreateContestForm.tsx` | Add timezone dropdown |
| `src/features/contests/components/EditContestForm.tsx` | Add timezone dropdown |
| `src/features/categories/components/CreateCategoryForm.tsx` | Add time picker alongside date |
| `src/features/categories/components/EditCategoryForm.tsx` | Add time picker alongside date |
| `src/features/categories/components/CategoriesTab.tsx` | **CRITICAL:** Must pass timezone to category forms |
| `src/features/participants/components/DeadlineCountdown.tsx` | Update to accept contest timezone |
| `src/features/submissions/types/adminSubmission.types.ts` | `formatSubmissionDate()` — needs timezone param |
| `src/features/contests/components/ContestCard.tsx` | `computeDaysLeft()` — needs timezone-aware comparison |
| `src/contexts/ParticipantSessionContext.tsx` | **CRITICAL:** Must include timezone in session |
| `supabase/functions/validate-participant/index.ts` | **CRITICAL:** Must return contest timezone |
| `supabase/migrations/00003_create_contests_tables.sql` | Reference for contests table structure |

### Technical Decisions

1. **Timezone Storage:** Store IANA timezone identifier (e.g., `America/New_York`) in `contests.timezone` column, NOT UTC offset. IANA handles DST automatically.

2. **Deadline Storage:** Keep storing deadlines as `TIMESTAMPTZ` (UTC) in database. The timezone column tells us how to DISPLAY it, not how to store it.

3. **New Dependency:** Add `date-fns-tz@3.x` for timezone-aware formatting. **IMPORTANT:** Use v3.x for `date-fns` v4.x compatibility — verify with `npm info date-fns-tz peerDependencies`.

4. **Centralized Utility:** Create `src/lib/dateUtils.ts` with:
   - `formatDateTimeInTimezone(date: string, timezone: string, format: 'short' | 'long'): string`
   - `formatDateInTimezone(date: string, timezone: string): string`
   - `isDeadlinePassed(deadline: string, timezone: string): boolean`
   - `TIMEZONE_OPTIONS` constant with major cities
   - **Error handling:** Wrap all functions in try/catch, fallback to UTC on invalid timezone

5. **Timezone Dropdown Options:** Curated list of major cities with live UTC offset display:
   - Miami (America/New_York) — DEFAULT
   - New York (America/New_York)
   - Los Angeles (America/Los_Angeles)
   - Chicago (America/Chicago)
   - Madrid (Europe/Madrid)
   - London (Europe/London)
   - Paris (Europe/Paris)
   - Tokyo (Asia/Tokyo)
   - Sydney (Australia/Sydney)
   - São Paulo (America/Sao_Paulo)

6. **Time Picker Defaults:**
   - Initial render (no date selected): disabled state, no value
   - After date selected: default to `23:59` (11:59 PM) — end of day
   - Editing existing deadline: extract time from ISO string using `extractTimeFromDate()`

7. **Prop Drilling vs Context:** Pass contest timezone as prop to components. Update `ParticipantSessionContext` to include `contestTimezone` for participant flows.

8. **combineDateAndTime Function Signature:**
   ```typescript
   /**
    * Combines a date and time into a UTC ISO string
    * @param dateIso - ISO date string (any time component is ignored)
    * @param timeString - 24-hour format "HH:mm" (e.g., "23:59", "08:30")
    * @param timezone - IANA timezone (e.g., "America/New_York")
    * @returns UTC ISO string representing the datetime in the given timezone
    */
   function combineDateAndTime(dateIso: string, timeString: string, timezone: string): string
   ```

9. **computeDaysLeft Business Logic:** Calculate calendar days remaining in contest timezone. "Days left" = number of midnights between now and deadline in contest timezone.

## Implementation Plan

### Tasks

#### Phase 1: Foundation (Database + Utilities)

- [ ] **Task 1: Verify date-fns-tz compatibility and install**
  - Action: Run `npm info date-fns-tz peerDependencies` to verify compatibility
  - Action: Run `npm install date-fns-tz@3` (use v3.x for date-fns v4 compat)
  - Notes: If incompatible, evaluate alternatives (Luxon, Temporal polyfill)

- [ ] **Task 2: Create database migration for timezone column**
  - File: `supabase/migrations/YYYYMMDDHHMMSS_add_timezone_to_contests.sql`
  - Action:
    ```sql
    -- Add timezone column with default
    ALTER TABLE public.contests
    ADD COLUMN timezone TEXT NOT NULL DEFAULT 'America/New_York';

    -- Add comment for documentation
    COMMENT ON COLUMN public.contests.timezone IS 'IANA timezone identifier for deadline display (e.g., America/New_York)';
    ```
  - Notes: Backfills all existing contests with Miami timezone. No existing deadline adjustment needed — they're already UTC.

- [ ] **Task 3: Create centralized date utilities with error handling**
  - File: `src/lib/dateUtils.ts` (new file)
  - Action: Create utility functions with **try/catch error handling**:
    ```typescript
    import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
    import { format, parse } from 'date-fns';

    export const DEFAULT_TIMEZONE = 'America/New_York';

    export const TIMEZONE_OPTIONS = [
      { value: 'America/New_York', label: 'Miami / New York', city: 'Miami' },
      { value: 'America/Los_Angeles', label: 'Los Angeles', city: 'Los Angeles' },
      { value: 'America/Chicago', label: 'Chicago', city: 'Chicago' },
      { value: 'Europe/Madrid', label: 'Madrid', city: 'Madrid' },
      { value: 'Europe/London', label: 'London', city: 'London' },
      { value: 'Europe/Paris', label: 'Paris', city: 'Paris' },
      { value: 'Asia/Tokyo', label: 'Tokyo', city: 'Tokyo' },
      { value: 'Australia/Sydney', label: 'Sydney', city: 'Sydney' },
      { value: 'America/Sao_Paulo', label: 'São Paulo', city: 'São Paulo' },
    ];

    export function isValidTimezone(tz: string): boolean {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    }

    export function safeTimezone(tz: string): string {
      return isValidTimezone(tz) ? tz : DEFAULT_TIMEZONE;
    }

    export function formatDateTimeInTimezone(
      isoDate: string,
      timezone: string,
      style: 'short' | 'long' = 'short'
    ): string {
      try {
        const tz = safeTimezone(timezone);
        const pattern = style === 'short'
          ? 'MMM d, yyyy h:mm a'
          : 'MMMM d, yyyy \'at\' h:mm a zzz';
        return formatInTimeZone(new Date(isoDate), tz, pattern);
      } catch {
        return 'Invalid date';
      }
    }

    export function formatDateInTimezone(isoDate: string, timezone: string): string {
      try {
        const tz = safeTimezone(timezone);
        return formatInTimeZone(new Date(isoDate), tz, 'MMMM d, yyyy');
      } catch {
        return 'Invalid date';
      }
    }

    export function formatTimeInTimezone(isoDate: string, timezone: string): string {
      try {
        const tz = safeTimezone(timezone);
        return formatInTimeZone(new Date(isoDate), tz, 'h:mm a');
      } catch {
        return 'Invalid time';
      }
    }

    export function getTimezoneOffsetLabel(timezone: string): string {
      try {
        const tz = safeTimezone(timezone);
        const now = new Date();
        const offset = formatInTimeZone(now, tz, 'xxx'); // e.g., "-05:00"
        const hours = parseInt(offset.slice(0, 3));
        return `UTC${hours >= 0 ? '+' : ''}${hours}`;
      } catch {
        return 'UTC';
      }
    }

    /**
     * Combines a date and time into a UTC ISO string.
     * IMPORTANT: Extracts only year/month/day from dateIso to avoid timezone shift issues.
     * @param dateIso - ISO date string (time component is ignored)
     * @param timeString - 24-hour format "HH:mm" (e.g., "23:59", "08:30")
     * @param timezone - IANA timezone (e.g., "America/New_York")
     * @returns UTC ISO string representing the datetime in the given timezone
     */
    export function combineDateAndTime(
      dateIso: string,
      timeString: string, // "HH:mm" 24h format
      timezone: string
    ): string {
      try {
        const tz = safeTimezone(timezone);
        const [hours, minutes] = timeString.split(':').map(Number);

        // Extract ONLY the date portion (YYYY-MM-DD) to avoid timezone shift issues
        // This handles both "2026-02-15" and "2026-02-15T00:00:00.000Z" formats
        const datePart = dateIso.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);

        // Create a date object representing the LOCAL time in the target timezone
        // We use a trick: create a date string that represents the desired local time,
        // then use fromZonedTime to convert that "local" time to UTC
        const localDatetime = new Date(year, month - 1, day, hours, minutes, 0, 0);

        // fromZonedTime interprets the input as if it were in the given timezone
        // and returns the equivalent UTC time
        const utcDate = fromZonedTime(localDatetime, tz);
        return utcDate.toISOString();
      } catch (error) {
        console.error('combineDateAndTime error:', error);
        return new Date().toISOString();
      }
    }

    export function extractTimeFromDate(isoDate: string, timezone: string): string {
      try {
        const tz = safeTimezone(timezone);
        return formatInTimeZone(new Date(isoDate), tz, 'HH:mm');
      } catch {
        return '23:59';
      }
    }

    export function isDeadlinePassed(deadline: string, timezone: string): boolean {
      try {
        const deadlineDate = new Date(deadline);
        return Date.now() > deadlineDate.getTime();
      } catch {
        return false;
      }
    }
    ```
  - Notes: All functions include error handling to prevent crashes on invalid data

- [ ] **Task 4: Create TimePicker component with accessibility**
  - File: `src/components/ui/time-picker.tsx` (new file)
  - Action: Create a time picker component with AM/PM format
    - Input for hours (1-12), minutes (00-59), AM/PM toggle
    - Styled to match shadcn Input components
    - Props: `value: string` (HH:mm 24h format), `onChange: (value: string) => void`, `disabled?: boolean`
    - **Accessibility:** aria-labels, keyboard navigation, focus management
    - **Default behavior:** If value is empty and component is enabled, show placeholder "Select time"
  - Notes: Display 12-hour format with AM/PM, store as 24-hour internally

#### Phase 2: Type & Transform Updates

- [ ] **Task 5: Update Contest types**
  - File: `src/features/contests/types/contest.types.ts`
  - Action: Add `timezone` field to both `ContestRow` and `Contest` interfaces
    ```typescript
    // In ContestRow:
    timezone: string;

    // In Contest:
    timezone: string;
    ```

- [ ] **Task 6: Update transformContestRow function (CRITICAL)**
  - File: `src/features/contests/api/contestsApi.ts`
  - Action: Add timezone to `transformContestRow()` function (around line 17-36)
    ```typescript
    // Add to the transform mapping:
    timezone: row.timezone,
    ```
  - Notes: **Without this, timezone data will be silently dropped!**

- [ ] **Task 7: Update Contest schemas**
  - File: `src/features/contests/types/contest.schemas.ts`
  - Action: Add timezone to create and update schemas
    ```typescript
    // In createContestSchema:
    timezone: z.string().default('America/New_York'),

    // In updateContestSchema:
    timezone: z.string().optional(),
    ```

- [ ] **Task 8: Update Category schemas for time**
  - File: `src/features/categories/types/category.schemas.ts`
  - Action: Deadline field already accepts ISO string — no schema change needed

#### Phase 3: Contest Forms (Timezone Selection)

- [ ] **Task 9: Update CreateContestForm with timezone dropdown**
  - File: `src/features/contests/components/CreateContestForm.tsx`
  - Action: Add timezone Select field after rules field
    - Import `TIMEZONE_OPTIONS`, `getTimezoneOffsetLabel` from `@/lib/dateUtils`
    - Use shadcn Select component
    - Display: `{city} (UTC{offset})` e.g., "Madrid (UTC+1)"
    - Default value: `America/New_York`
  - Notes: Add to form defaultValues

- [ ] **Task 10: Update EditContestForm with timezone dropdown**
  - File: `src/features/contests/components/EditContestForm.tsx`
  - Action: Add timezone Select field (same as CreateContestForm)
    - Pre-populate with `contest.timezone`

#### Phase 4: Category Forms (Date + Time Selection)

- [ ] **Task 11: Update CategoriesTab to pass timezone to forms (CRITICAL)**
  - File: `src/features/categories/components/CategoriesTab.tsx`
  - Action:
    - CategoriesTab receives `contest` prop — extract `contest.timezone`
    - Pass `contestTimezone` to DivisionSection component
    - DivisionSection must pass `contestTimezone` to CreateCategoryForm and EditCategoryForm
  - Notes: This requires updating DivisionSection props interface

- [ ] **Task 12: Update CreateCategoryForm with time picker**
  - File: `src/features/categories/components/CreateCategoryForm.tsx`
  - Action:
    - Add `contestTimezone` prop to component interface
    - Add local state for time: `const [time, setTime] = useState('23:59')`
    - Add TimePicker below date picker
    - Remove local `formatDate` function, use `formatDateInTimezone` from utils
    - On form submit, combine date + time: `combineDateAndTime(date, time, contestTimezone)`
    - Time picker disabled until date is selected
  - Notes: Time defaults to 11:59 PM (end of selected day)

- [ ] **Task 13: Update EditCategoryForm with time picker**
  - File: `src/features/categories/components/EditCategoryForm.tsx`
  - Action:
    - Add `contestTimezone` prop to component interface
    - Initialize time state from existing deadline: `extractTimeFromDate(category.deadline, contestTimezone)`
    - Add TimePicker below date picker
    - Remove local `formatDate` function
    - Display and edit in contest timezone

#### Phase 5: Participant Session Context (CRITICAL)

- [ ] **Task 14: Update validate-participant Edge Function to return timezone**
  - File: `supabase/functions/validate-participant/index.ts`
  - Action:
    1. Update the contest SELECT query (around line 97) to include timezone:
       ```typescript
       // BEFORE:
       .select('id, name, status, contest_code')

       // AFTER:
       .select('id, name, status, contest_code, timezone')
       ```
    2. Update the `ValidationResponse` interface (around lines 19-29):
       ```typescript
       interface ValidationResponse {
         participantId: string;
         code: string;
         contestId: string;
         contestCode: string;
         contestName: string;
         organizationName: string | null;
         contestTimezone: string;  // ADD THIS
       }
       ```
    3. Include timezone in the response object:
       ```typescript
       return new Response(JSON.stringify({
         participantId: participant.id,
         code: participant.code,
         contestId: contest.id,
         contestCode: contest.contest_code,
         contestName: contest.name,
         organizationName: participant.organization_name,
         contestTimezone: contest.timezone,  // ADD THIS
       }), { ... });
       ```

- [ ] **Task 15: Update ParticipantSessionContext to store timezone**
  - File: `src/contexts/ParticipantSessionContext.tsx`
  - Action:
    1. Update the `ParticipantSession` interface (around lines 7-15):
       ```typescript
       export interface ParticipantSession {
         participantId: string;
         code: string;
         contestId: string;
         contestCode: string;
         contestName: string;
         organizationName: string | null;
         lastActivity: number;
         contestTimezone: string;  // ADD THIS - required, not optional
       }
       ```
    2. Update `enterContest` function to store timezone from response:
       ```typescript
       const session: ParticipantSession = {
         participantId: data.participantId,
         code: data.code,
         contestId: data.contestId,
         contestCode: data.contestCode,
         contestName: data.contestName,
         organizationName: data.organizationName,
         lastActivity: Date.now(),
         contestTimezone: data.contestTimezone,  // ADD THIS
       };
       ```
    3. Ensure `contestTimezone` is included in the context value returned by the provider
  - Notes: This enables all participant components to access timezone via `useParticipantSession()`

#### Phase 6: Display Updates (Admin, Judge, Participant)

- [ ] **Task 16: Update DeadlineCountdown component**
  - File: `src/features/participants/components/DeadlineCountdown.tsx`
  - Action:
    - Add `timezone` prop (required)
    - Add formatted deadline display below countdown: "Due: Feb 15, 2026 at 11:59 PM"
    - Use `formatDateTimeInTimezone()` for display
    - Keep countdown logic (uses Date comparison, timezone-agnostic)

- [ ] **Task 17: Update ParticipantCategoryCard**
  - File: `src/features/participants/components/ParticipantCategoryCard.tsx`
  - Action:
    - Get `contestTimezone` from ParticipantSessionContext
    - Pass `timezone` prop to DeadlineCountdown

- [ ] **Task 18: Update formatSubmissionDate utility**
  - File: `src/features/submissions/types/adminSubmission.types.ts`
  - Action:
    - Add optional `timezone` parameter to `formatSubmissionDate()`
    - If timezone provided, use `formatDateTimeInTimezone()`
    - If not provided, fall back to browser timezone (backwards compatible)

- [ ] **Task 19: Update ContestCard days left calculation**
  - File: `src/features/contests/components/ContestCard.tsx`
  - Action:
    - Contest now has `timezone` field
    - Update `computeDaysLeft()` to use timezone (calendar days in contest TZ)

- [ ] **Task 20: Update admin submission displays**
  - Files:
    - `src/features/submissions/components/AdminSubmissionsTable.tsx`
    - `src/features/submissions/components/AdminSubmissionDetail.tsx`
    - `src/features/submissions/components/AdminReviewSection.tsx`
  - Action: Pass contest timezone to `formatSubmissionDate()` calls
  - Notes: These components receive contest info through props/context

- [ ] **Task 21: Update judge dashboard displays**
  - File: `src/pages/judge/DashboardPage.tsx`
  - Action:
    - Replace `formatDistanceToNow` with `formatDateTimeInTimezone` for deadline display
    - Categories from API should include contest timezone (via join)

- [ ] **Task 22: Update participant category detail page**
  - File: `src/pages/participant/CategoryDetailPage.tsx`
  - Action: Get timezone from context, pass to DeadlineCountdown

#### Phase 7: Edge Function Updates (CRITICAL for deadline enforcement)

- [ ] **Task 23: Update Edge Functions that check deadlines**
  - Files:
    - `supabase/functions/create-video-upload/index.ts`
    - `supabase/functions/upload-photo/index.ts`
    - `supabase/functions/withdraw-submission/index.ts`
    - `supabase/functions/update-submission-info/index.ts`
    - `supabase/functions/get-submission/index.ts`
  - Action:
    - Deadline comparison is already correct (TIMESTAMPTZ vs UTC now)
    - No changes needed — UTC comparison works correctly
  - Notes: The deadline is stored as TIMESTAMPTZ (UTC). Comparing `new Date(deadline) < new Date()` is correct because both are in UTC. The timezone is only for DISPLAY, not for comparison.

- [ ] **Task 24: Update send-judge-invitation Edge Function**
  - File: `supabase/functions/send-judge-invitation/index.ts`
  - Action:
    - Fetch contest timezone when sending invitation
    - Format deadline in contest timezone for email display
    - Use a simple timezone-aware format function (no date-fns-tz in Deno)
    ```typescript
    // Simple approach for Edge Functions:
    const deadline = new Date(categoryDeadline);
    const formatted = deadline.toLocaleString('en-US', {
      timeZone: contest.timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    ```

#### Phase 8: Category API Updates

- [ ] **Task 25: Update category queries to include contest timezone**
  - File: `src/features/categories/api/categoriesApi.ts`
  - Action:
    - Update `listByContest` to join through divisions to contests for timezone
    - OR ensure contest is always available in context when categories are displayed
  - Notes: Consider whether to add timezone to CategoryWithContext type

### Acceptance Criteria

#### Contest Timezone Selection
- [ ] **AC1:** Given an admin on CreateContestForm, when they view the form, then they see a "Timezone" dropdown with major cities and UTC offsets, defaulting to "Miami / New York (UTC-5)" (or UTC-4 during DST)
- [ ] **AC2:** Given an admin selecting a timezone, when they choose "Madrid", then the dropdown displays "Madrid (UTC+1)" (or UTC+2 during DST)
- [ ] **AC3:** Given an admin on EditContestForm, when they view the form, then the timezone dropdown shows the contest's current timezone pre-selected
- [ ] **AC4:** Given a new contest created without explicit timezone, when saved, then it defaults to `America/New_York`

#### Category Deadline Time Selection
- [ ] **AC5:** Given an admin on CreateCategoryForm, when they select a deadline date, then they also see a time picker showing hours, minutes, and AM/PM
- [ ] **AC6:** Given an admin setting deadline to "February 15, 12:00 AM", when they save, then the deadline is stored as midnight (00:00) on Feb 15 in the contest's timezone (converted to UTC)
- [ ] **AC7:** Given an admin setting deadline to "February 15, 8:00 PM", when they save, then the deadline is stored as 20:00 on Feb 15 in the contest's timezone (converted to UTC)
- [ ] **AC8:** Given an admin on EditCategoryForm, when viewing an existing category, then the time picker shows the current deadline time extracted correctly in contest timezone
- [ ] **AC8b:** Given an admin on CreateCategoryForm before selecting a date, when they view the time picker, then it is disabled with placeholder text

#### Timezone Display for Participants
- [ ] **AC9:** Given a participant viewing a category, when they see the deadline, then it displays in the contest's timezone (e.g., "Due: Feb 15, 2026 at 8:00 PM")
- [ ] **AC10:** Given a participant in a different timezone than the contest, when they view deadlines, then times still display in contest timezone, NOT their browser timezone
- [ ] **AC11:** Given a participant viewing DeadlineCountdown, when deadline approaches, then they see both "Due in X hours" AND the formatted deadline datetime

#### Timezone Display for Judges
- [ ] **AC12:** Given a judge viewing their dashboard, when they see category deadlines, then they display in the contest's timezone
- [ ] **AC13:** Given a judge receiving an invitation email, when they view the deadline, then it displays in the contest's timezone

#### Timezone Display for Admins
- [ ] **AC14:** Given an admin viewing ContestCard, when they see "Days Left", then calculation uses contest timezone for accuracy
- [ ] **AC15:** Given an admin viewing submission details, when they see timestamps, then they display in the contest's timezone

#### Migration & Backwards Compatibility
- [ ] **AC16:** Given existing contests in the database, when migration runs, then all get `timezone = 'America/New_York'` (Miami default)
- [ ] **AC17:** Given existing category deadlines stored as midnight UTC, when displayed after migration, then they show the correct time in contest timezone (may be previous day evening for US timezones — this is expected and correct)

#### Error Handling
- [ ] **AC18:** Given an invalid timezone value in the database, when date formatting is attempted, then it falls back to UTC without crashing
- [ ] **AC19:** Given an invalid date string, when formatting is attempted, then it displays "Invalid date" without crashing

## Additional Context

### Dependencies

**New NPM Package Required:**
```bash
# Verify compatibility first
npm info date-fns-tz peerDependencies

# Install v3.x for date-fns v4 compatibility
npm install date-fns-tz@3
```

**Existing Dependencies Used:**
- `date-fns` v4.1.0 (already installed)
- `react-day-picker` (shadcn Calendar)
- `zod` (schema validation)
- `react-hook-form` (form state)

**Database Migration:**
- Requires `npx supabase db push` after creating migration file

### Testing Strategy

**Unit Tests:**
- `src/lib/dateUtils.test.ts` — Test all utility functions with:
  - Various timezones (US, Europe, Asia, Australia)
  - DST edge cases: 2:30 AM spring forward (time doesn't exist), 1:30 AM fall back (time occurs twice)
  - Invalid timezone strings → should fallback to UTC
  - Invalid date strings → should return fallback values
- `src/components/ui/time-picker.test.tsx` — Test AM/PM toggle, value changes, disabled state, keyboard navigation

**Component Tests:**
- `CreateContestForm.test.tsx` — Verify timezone dropdown renders, default value, selection
- `CreateCategoryForm.test.tsx` — Verify time picker renders, date+time combination, disabled state before date selection
- `DeadlineCountdown.test.tsx` — Verify timezone prop is used, formatted date displays

**Integration Tests:**
- Create contest with timezone → Create category with deadline → Verify deadline displays correctly
- Participant session → Verify timezone is available in context

**Manual Testing Checklist:**
1. Create contest with Madrid timezone
2. Create category with deadline Feb 15, 8:00 PM
3. Verify admin sees "Feb 15, 2026 8:00 PM" (not converted to local time)
4. Log in as participant, verify same deadline displays
5. Log in as judge, verify same deadline displays
6. Test with browser in different timezone to confirm no conversion
7. Test judge invitation email shows correct timezone
8. Test invalid timezone in DB doesn't crash app

### Notes

**Important Considerations:**
- Miami timezone = America/New_York (Eastern Time, observes DST)
- AM/PM format for all user-facing time displays (American product)
- 12:00 AM = start of day (00:00), 11:59 PM = end of day (23:59)
- Full minute granularity for time selection (e.g., 11:43 AM)
- All existing contests will be backfilled with `America/New_York` timezone
- Judges see deadlines in contest timezone (not countdown only)
- Participants see both countdown AND formatted deadline in contest timezone
- **Edge function deadline comparisons are already correct** — they compare UTC timestamps

**Existing Deadline Migration Note:**
Existing deadlines were stored as midnight UTC (from date-only picker). When displayed in America/New_York timezone:
- "Feb 15, 2026 00:00:00 UTC" → "Feb 14, 2026 7:00 PM EST"

This is mathematically correct but may confuse users. Consider a one-time manual review of existing contest deadlines after migration.

**Task Dependencies:**
- Tasks 1-4 (Foundation) must complete before other phases
- Task 6 (transformContestRow) is critical — without it, nothing works
- Task 11 (CategoriesTab) is critical for category forms
- Tasks 14-15 (ParticipantSession) are critical for participant displays

**Addressed Adversarial Review Findings (Round 1):**
- F1 (Critical): Added Task 6 for transformContestRow update
- F2 (Critical): Clarified edge functions are correct (UTC comparison)
- F3 (Critical): Added migration note about existing deadlines
- F4 (Critical): Added Tasks 14-15 for ParticipantSessionContext
- F5 (High): Added Task 11 for CategoriesTab refactoring
- F6 (High): Task 21 replaces formatDistanceToNow
- F7 (High): Task 1 verifies compatibility before install
- F8 (High): Task 3 includes error handling in all functions
- F9 (High): Task 24 updates judge invitation email
- F10 (High): Task 4 & 12 clarify time picker defaults

**Addressed Adversarial Review Findings (Round 2):**
- F1 (High): Task 14 now includes explicit `ValidationResponse` interface update
- F2 (High): Task 14 now shows exact SELECT query change for timezone
- F3 (High): Task 15 now includes explicit `ParticipantSession` interface update
- F4 (High): `combineDateAndTime` rewritten to extract date parts first, avoiding timezone shift bugs

**Lower Priority Findings (for future consideration):**
- Round 1 F11-F22 and Round 2 F5-F14: Documented in review, address if time permits
