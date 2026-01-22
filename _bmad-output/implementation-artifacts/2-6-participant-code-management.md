# Story 2.6: Participant Code Management

Status: review

## Story

As a **Super Admin**,
I want **to view, generate, and export participant codes**,
So that **I can distribute access codes to participants**.

## Acceptance Criteria

### AC1: Code List Display
**Given** I am on the contest Codes tab
**When** the page loads
**Then** I see a CodeListTable showing all codes with columns: Code, Status (Used/Unused), Participant Name (if used)

### AC2: Used vs Unused Display
**Given** I view the codes list
**When** some codes are used
**Then** used codes show the participant's name
**And** unused codes show "-" in the participant column

### AC3: Status Filter
**Given** I want to filter codes
**When** I click the status filter
**Then** I can filter by: All, Used, Unused

### AC4: Generate Codes
**Given** I need more codes
**When** I click "Generate 50 More"
**Then** 50 new 8-digit codes are created
**And** I see a success toast "50 codes generated"
**And** the list updates to show new codes

### AC5: Export Codes
**Given** I want to export codes
**When** I click "Export"
**Then** a CSV file downloads with columns: Code, Status
**And** filename is "{contest_code}_participant_codes.csv"

### AC6: Code Format Validation
**Given** participant codes are generated
**When** I inspect any code
**Then** it is exactly 8 digits, numeric only
**And** it is unique within the contest

## Developer Context

### Architecture Requirements

**Database Schema (already exists from Story 2.3):**

```sql
-- Participants table (already created)
participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  code TEXT NOT NULL CHECK (LENGTH(code) = 8),
  status TEXT DEFAULT 'unused' CHECK (status IN ('unused', 'used')),
  name TEXT,
  organization_name TEXT,
  tlc_name TEXT,
  tlc_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contest_id, code)
)
```

**Note:** No new migration needed. The `participants` table was created in Story 2.3.

**Participant Code Format:**
- 8 digits, numeric only (0-9)
- Unique within contest (enforced by UNIQUE constraint)
- Status: 'unused' (default) or 'used' (when participant registers)

### Previous Story Learnings (Story 2.5)

**What Story 2.5 Built:**
- ✅ CategoriesTab component integrated into ContestDetailPage
- ✅ Pattern: Tab content as separate feature components
- ✅ shadcn/ui Calendar and Popover installed (for date picker)
- ✅ Sheet pattern for create/edit forms
- ✅ Status filter pattern with Select component
- ✅ Intl.DateTimeFormat for date formatting (no date-fns)
- ✅ Test setup with Radix UI mocks (pointer capture, scrollIntoView)

**Reusable Patterns from Story 2.5:**
```typescript
// Filter pattern from CategoryCard
<Select value={filter} onValueChange={setFilter}>
  <SelectTrigger className="w-[140px]">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All</SelectItem>
    <SelectItem value="unused">Unused</SelectItem>
    <SelectItem value="used">Used</SelectItem>
  </SelectContent>
</Select>
```

**Git Intelligence (Recent Commits):**
- `bd0ccc7` - chore: Update story status and documentation
- `59c222c` - fix: AC3 read-only form + submissions schema alignment
- `769a492` - fix: Address second code review - AC4 race condition and UX
- `ef985dc` - fix: Address code review findings for story 2-5
- `f163c4a` - 2-5: Mark story ready for review

### Technical Requirements

**Extend Existing Feature:**

This story extends the `src/features/contests/` feature (NOT a new feature). Add participants-related code within the contests feature since participant codes are tightly coupled to contests.

```
src/features/contests/
├── api/
│   └── contestsApi.ts           # EXISTS - extend with participant methods
├── components/
│   ├── CodesTab.tsx             # NEW: Main tab content
│   ├── CodesTab.test.tsx        # NEW
│   ├── CodeListTable.tsx        # NEW: Data table for codes
│   ├── CodeListTable.test.tsx   # NEW
│   ├── GenerateCodesButton.tsx  # NEW: Generate 50 more
│   ├── GenerateCodesButton.test.tsx # NEW
│   ├── ExportCodesButton.tsx    # NEW: CSV export
│   ├── ExportCodesButton.test.tsx # NEW
│   └── index.ts                 # UPDATE: export new components
├── hooks/
│   ├── useParticipantCodes.ts   # NEW: Query participant codes
│   ├── useGenerateCodes.ts      # NEW: Mutation to generate codes
│   └── index.ts                 # UPDATE: export new hooks
├── utils/
│   ├── generateContestCode.ts   # EXISTS (6-char alphanumeric)
│   ├── generateParticipantCode.ts # NEW: 8-digit numeric
│   ├── generateParticipantCode.test.ts # NEW
│   ├── exportCodesToCSV.ts      # NEW: CSV export utility
│   ├── exportCodesToCSV.test.ts # NEW
│   └── index.ts                 # UPDATE: export new utils
├── types/
│   ├── participant.types.ts     # NEW: Participant types
│   ├── participant.schemas.ts   # NEW: Zod schemas
│   └── index.ts                 # UPDATE: export new types
└── index.ts                     # UPDATE: export all new items
```

**Types Definition:**

```typescript
// features/contests/types/participant.types.ts

export type ParticipantStatus = 'unused' | 'used';

// Database row (snake_case)
export interface ParticipantRow {
  id: string;
  contest_id: string;
  code: string;
  status: ParticipantStatus;
  name: string | null;
  organization_name: string | null;
  tlc_name: string | null;
  tlc_email: string | null;
  created_at: string;
}

// Application type (camelCase)
export interface Participant {
  id: string;
  contestId: string;
  code: string;
  status: ParticipantStatus;
  name: string | null;
  organizationName: string | null;
  tlcName: string | null;
  tlcEmail: string | null;
  createdAt: string;
}

// Transform function
export function transformParticipant(row: ParticipantRow): Participant {
  return {
    id: row.id,
    contestId: row.contest_id,
    code: row.code,
    status: row.status,
    name: row.name,
    organizationName: row.organization_name,
    tlcName: row.tlc_name,
    tlcEmail: row.tlc_email,
    createdAt: row.created_at,
  };
}
```

**Generate Participant Code Utility:**

```typescript
// features/contests/utils/generateParticipantCode.ts

/**
 * Generates a unique 8-digit numeric participant code
 * @returns 8-digit numeric string (e.g., "12345678")
 */
export function generateParticipantCode(): string {
  // Generate 8 random digits
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

/**
 * Generates multiple unique participant codes
 * @param count Number of codes to generate
 * @param existingCodes Set of existing codes to avoid duplicates
 * @returns Array of unique 8-digit codes
 */
export function generateParticipantCodes(
  count: number,
  existingCodes: Set<string> = new Set()
): string[] {
  const codes: string[] = [];
  const allCodes = new Set(existingCodes);

  while (codes.length < count) {
    const code = generateParticipantCode();
    if (!allCodes.has(code)) {
      allCodes.add(code);
      codes.push(code);
    }
  }

  return codes;
}
```

**API Extensions:**

```typescript
// features/contests/api/contestsApi.ts - ADD THESE METHODS

// Add to existing contestsApi object:

async listParticipantCodes(contestId: string, filter?: 'all' | 'used' | 'unused') {
  let query = supabase
    .from('participants')
    .select('*')
    .eq('contest_id', contestId)
    .order('created_at', { ascending: false });

  if (filter === 'used') {
    query = query.eq('status', 'used');
  } else if (filter === 'unused') {
    query = query.eq('status', 'unused');
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as ParticipantRow[]).map(transformParticipant);
},

async generateParticipantCodes(contestId: string, count: number = 50) {
  // Get existing codes to avoid duplicates
  const { data: existing } = await supabase
    .from('participants')
    .select('code')
    .eq('contest_id', contestId);

  const existingCodes = new Set((existing || []).map(p => p.code));
  const newCodes = generateParticipantCodes(count, existingCodes);

  // Insert new codes
  const { data, error } = await supabase
    .from('participants')
    .insert(
      newCodes.map(code => ({
        contest_id: contestId,
        code,
        status: 'unused',
      }))
    )
    .select();

  if (error) throw error;
  return (data as ParticipantRow[]).map(transformParticipant);
},
```

**TanStack Query Hooks:**

```typescript
// features/contests/hooks/useParticipantCodes.ts
import { useQuery } from '@tanstack/react-query';
import { contestsApi } from '../api/contestsApi';

export function useParticipantCodes(
  contestId: string,
  filter: 'all' | 'used' | 'unused' = 'all'
) {
  return useQuery({
    queryKey: ['participant-codes', contestId, filter],
    queryFn: () => contestsApi.listParticipantCodes(contestId, filter),
    enabled: !!contestId,
  });
}

// features/contests/hooks/useGenerateCodes.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contestsApi } from '../api/contestsApi';

export function useGenerateCodes(contestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (count: number = 50) =>
      contestsApi.generateParticipantCodes(contestId, count),
    onSuccess: () => {
      // Invalidate all filter variants
      queryClient.invalidateQueries({
        queryKey: ['participant-codes', contestId]
      });
    },
  });
}
```

**Export to CSV Utility:**

```typescript
// features/contests/utils/exportCodesToCSV.ts

import type { Participant } from '../types/participant.types';

/**
 * Exports participant codes to CSV file
 * @param codes Array of participant codes
 * @param contestCode Contest code for filename
 */
export function exportCodesToCSV(
  codes: Participant[],
  contestCode: string
): void {
  // Build CSV content
  const headers = ['Code', 'Status'];
  const rows = codes.map(p => [p.code, p.status]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${contestCode}_participant_codes.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

**CodesTab Component:**

```typescript
// features/contests/components/CodesTab.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { useParticipantCodes } from '../hooks/useParticipantCodes';
import { CodeListTable } from './CodeListTable';
import { GenerateCodesButton } from './GenerateCodesButton';
import { ExportCodesButton } from './ExportCodesButton';
import type { Contest } from '../types/contest.types';

interface CodesTabProps {
  contest: Contest;
}

export function CodesTab({ contest }: CodesTabProps) {
  const [filter, setFilter] = useState<'all' | 'used' | 'unused'>('all');
  const { data: codes, isLoading } = useParticipantCodes(contest.id, filter);

  if (isLoading) {
    return <div>Loading codes...</div>;
  }

  const allCodes = codes || [];
  const usedCount = allCodes.filter(c => c.status === 'used').length;
  const unusedCount = allCodes.filter(c => c.status === 'unused').length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Participant Codes</CardTitle>
          <p className="text-sm text-muted-foreground">
            {allCodes.length} total • {usedCount} used • {unusedCount} unused
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unused">Unused</SelectItem>
              <SelectItem value="used">Used</SelectItem>
            </SelectContent>
          </Select>
          <ExportCodesButton codes={allCodes} contestCode={contest.contestCode} />
          <GenerateCodesButton contestId={contest.id} />
        </div>
      </CardHeader>
      <CardContent>
        {allCodes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No codes yet</p>
            <GenerateCodesButton contestId={contest.id} variant="default" />
          </div>
        ) : (
          <CodeListTable codes={allCodes} />
        )}
      </CardContent>
    </Card>
  );
}
```

**CodeListTable Component (UX19):**

```typescript
// features/contests/components/CodeListTable.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { Badge } from '@/components/ui';
import type { Participant } from '../types/participant.types';

interface CodeListTableProps {
  codes: Participant[];
}

export function CodeListTable({ codes }: CodeListTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Participant Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {codes.map((code) => (
          <TableRow key={code.id}>
            <TableCell className="font-mono">{code.code}</TableCell>
            <TableCell>
              <Badge
                variant={code.status === 'used' ? 'default' : 'secondary'}
              >
                {code.status === 'used' ? 'Used' : 'Unused'}
              </Badge>
            </TableCell>
            <TableCell>
              {code.status === 'used' ? code.name || 'Unknown' : '-'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

**GenerateCodesButton Component:**

```typescript
// features/contests/components/GenerateCodesButton.tsx
import { Button } from '@/components/ui';
import { useGenerateCodes } from '../hooks/useGenerateCodes';
import { toast } from 'sonner';

interface GenerateCodesButtonProps {
  contestId: string;
  variant?: 'default' | 'outline';
}

export function GenerateCodesButton({
  contestId,
  variant = 'outline'
}: GenerateCodesButtonProps) {
  const generateCodes = useGenerateCodes(contestId);

  const handleGenerate = async () => {
    try {
      await generateCodes.mutateAsync(50);
      toast.success('50 codes generated');
    } catch {
      toast.error('Failed to generate codes');
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleGenerate}
      disabled={generateCodes.isPending}
    >
      {generateCodes.isPending ? 'Generating...' : 'Generate 50 More'}
    </Button>
  );
}
```

**ExportCodesButton Component:**

```typescript
// features/contests/components/ExportCodesButton.tsx
import { Button } from '@/components/ui';
import { exportCodesToCSV } from '../utils/exportCodesToCSV';
import type { Participant } from '../types/participant.types';

interface ExportCodesButtonProps {
  codes: Participant[];
  contestCode: string;
}

export function ExportCodesButton({ codes, contestCode }: ExportCodesButtonProps) {
  const handleExport = () => {
    exportCodesToCSV(codes, contestCode);
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={codes.length === 0}>
      Export
    </Button>
  );
}
```

**UI Components Needed:**

```bash
# Table component for code list
npx shadcn@latest add table
```

### Integration with ContestDetailPage

**Update ContestDetailPage.tsx:**

```typescript
// Replace placeholder with CodesTab
import { CodesTab } from '@/features/contests';

// In the Tabs component:
<TabsContent value="codes">
  <CodesTab contest={contest} />
</TabsContent>
```

### Testing Guidance

**Unit Tests:**
- generateParticipantCode.test.ts: Format (8 digits), uniqueness in batch
- exportCodesToCSV.test.ts: CSV format, filename, download trigger
- CodeListTable.test.tsx: Renders codes, status badges, participant names
- GenerateCodesButton.test.tsx: Click handler, loading state, success toast
- ExportCodesButton.test.tsx: Disabled when no codes, triggers export
- CodesTab.test.tsx: Filter switching, empty state, displays counts

**Manual Testing Checklist:**
1. Navigate to contest detail page → Codes tab
2. Initially shows empty state with "Generate 50 More" button
3. Click "Generate 50 More" → 50 codes created, success toast
4. Table shows codes with Code, Status (Unused), Participant Name (-)
5. Click filter dropdown → Select "Unused" → Only unused codes shown
6. Click filter dropdown → Select "Used" → Only used codes shown (empty if none)
7. Click filter dropdown → Select "All" → All codes shown
8. Click "Export" → CSV file downloads
9. Open CSV → Contains Code, Status columns
10. Filename matches pattern: "{contest_code}_participant_codes.csv"
11. Each code is exactly 8 digits, numeric only

### Quality Gates

Before marking as "review":

```bash
# Git Status (REQUIRED)
□ git status          # Must show clean
□ git log --oneline -5  # Verify commits have "2-6:" prefix
□ git push -u origin story/2-6-participant-code-management

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

- [Source: epic-2-super-admin-authentication-contest-management.md#Story 2.6]
- [Source: architecture/core-architectural-decisions.md#Data Architecture]
- [Source: project-context.md#Feature Architecture]
- [Source: Story 2.3 - participants table schema]
- [Source: Story 2.5 - Tab content pattern, filter pattern]
- [Source: ux-design/design-system-foundation.md#UX19 CodeListTable]
- [shadcn/ui Table: https://ui.shadcn.com/docs/components/table]

## Tasks / Subtasks

- [x] **Task 1: Types and Utilities**
  - [x] Add transformParticipant function to contest.types.ts
  - [x] Update generateParticipantCodes utility to accept existing codes parameter
  - [x] Create exportCodesToCSV utility
  - [x] Update tests for generateParticipantCodes
  - [x] Create tests for exportCodesToCSV

- [x] **Task 2: API and Hooks**
  - [x] Extend contestsApi with listParticipantCodes method
  - [x] Extend contestsApi with generateParticipantCodes method
  - [x] Create useParticipantCodes hook
  - [x] Create useGenerateCodes hook
  - [x] Update hooks index exports

- [x] **Task 3: UI Components**
  - [x] Install shadcn/ui Table component
  - [x] Create CodeListTable component (AC1, AC2)
  - [x] Create CodeListTable tests
  - [x] Create GenerateCodesButton component (AC4)
  - [x] Create GenerateCodesButton tests
  - [x] Create ExportCodesButton component (AC5)
  - [x] Create ExportCodesButton tests

- [x] **Task 4: CodesTab Integration**
  - [x] Create CodesTab component with filter (AC3)
  - [x] Create CodesTab tests
  - [x] Integrate CodesTab into ContestDetailPage
  - [x] Update feature index exports
  - [x] Update components index exports

- [x] **Task 5: Quality Gates**
  - [x] Run npm run type-check - PASSED
  - [x] Run npm run lint - PASSED (only pre-existing shadcn warnings)
  - [x] Run npm run test - PASSED (204 tests)
  - [x] Run npm run build - PASSED

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - Implementation proceeded without issues.

### Completion Notes

**Implementation Summary:**
- Extended the contests feature (not a new feature) with participant code management
- Reused existing Participant types already defined in contest.types.ts
- Added transformParticipant function for DB row to app object transformation
- Updated generateParticipantCodes to accept existingCodes parameter for duplicate avoidance
- Created exportCodesToCSV utility for CSV download functionality
- Extended contestsApi with listParticipantCodes and generateParticipantCodes methods
- Created useParticipantCodes (query) and useGenerateCodes (mutation) hooks
- Installed shadcn/ui Table component
- Created CodeListTable, GenerateCodesButton, ExportCodesButton, and CodesTab components
- All components follow project patterns (feature index imports, named exports, camelCase)
- Integrated CodesTab into ContestDetailPage, replacing the placeholder

**AC Verification:**
- AC1: CodeListTable displays Code, Status, Participant Name columns (verified in tests)
- AC2: Used codes show participant name, unused show "-" (verified in CodeListTable.test.tsx)
- AC3: Status filter with All/Used/Unused options (verified in CodesTab.test.tsx)
- AC4: Generate 50 More button creates codes, shows toast (verified in GenerateCodesButton.test.tsx)
- AC5: Export button downloads CSV with correct filename (verified in ExportCodesButton.test.tsx)
- AC6: Codes are 8-digit numeric, unique within contest (verified in generateParticipantCodes.test.ts)

**Test Coverage:**
- 10 new tests in generateParticipantCodes.test.ts
- 7 new tests in exportCodesToCSV.test.ts
- 9 new tests in CodeListTable.test.tsx
- 7 new tests in GenerateCodesButton.test.tsx
- 5 new tests in ExportCodesButton.test.tsx
- 10 new tests in CodesTab.test.tsx
- Total: 204 tests pass (48 new tests added)

## Review Follow-ups (AI)

**Code Review Findings (addressed in commit a744041):**

**Medium Issues - FIXED:**
1. ~~No error handling for failed code fetch~~ - Added error state to CodesTab that displays error message instead of masking failures
2. ~~Over-fetching PII~~ - Changed `select(*)` to only select needed columns (id, contest_id, code, status, name, created_at)
3. ~~No error handling/retry for generateParticipantCodes~~ - Added fetchError handling and retry logic (MAX_RETRIES=3) for unique constraint violations

**Low Issues - FIXED:**
1. ~~CSV export tests don't validate content~~ - Added FileReader-based content validation for headers and rows
2. AC2 "Unknown" for missing names - Documented as intentional fallback (graceful handling of edge case)

**Architecture Boundary Decision (FR15–FR19):**
The architecture mapping assigns FR15–FR19 to `features/participants/`, but this story implements them in `features/contests/`. This was a **deliberate decision** documented in the story's Developer Context section:

> "This story extends the `src/features/contests/` feature (NOT a new feature). Add participants-related code within the contests feature since participant codes are tightly coupled to contests."

**Rationale:**
- Participant codes have no independent lifecycle - they only exist within a contest context
- All CRUD operations require contestId as a mandatory parameter
- The participants table has a foreign key constraint to contests with ON DELETE CASCADE
- Creating a separate feature would require cross-feature imports and break cohesion

**Recommendation:** Update architecture mapping to reflect that FR15–FR19 (participant codes for admin) belong to `features/contests/`, while a future `features/participants/` could handle participant-facing flows (Epic 4).

## File List

**New Files:**
- src/components/ui/table.tsx
- src/features/contests/components/CodeListTable.tsx
- src/features/contests/components/CodeListTable.test.tsx
- src/features/contests/components/CodesTab.tsx
- src/features/contests/components/CodesTab.test.tsx
- src/features/contests/components/ExportCodesButton.tsx
- src/features/contests/components/ExportCodesButton.test.tsx
- src/features/contests/components/GenerateCodesButton.tsx
- src/features/contests/components/GenerateCodesButton.test.tsx
- src/features/contests/hooks/useGenerateCodes.ts
- src/features/contests/hooks/useParticipantCodes.ts
- src/features/contests/utils/exportCodesToCSV.ts
- src/features/contests/utils/exportCodesToCSV.test.ts

**Modified Files:**
- src/components/ui/index.ts
- src/features/contests/api/contestsApi.ts
- src/features/contests/components/index.ts
- src/features/contests/hooks/index.ts
- src/features/contests/index.ts
- src/features/contests/types/contest.types.ts
- src/features/contests/utils/generateParticipantCodes.ts
- src/features/contests/utils/generateParticipantCodes.test.ts
- src/features/contests/utils/index.ts
- src/pages/admin/ContestDetailPage.tsx
- _bmad-output/implementation-artifacts/sprint-status.yaml (status: backlog → review)

## Change Log

| Date | Change | Files |
|------|--------|-------|
| 2026-01-13 | Implement participant code management (Story 2.6) | See File List above |
| 2026-01-13 | Fix code review findings: error handling, PII over-fetching, retry logic, test coverage | CodesTab.tsx, contestsApi.ts, CodesTab.test.tsx, exportCodesToCSV.test.ts |
| 2026-01-13 | Fix QA round 2: retry path error handling, skeleton loading state | contestsApi.ts, CodesTab.tsx, CodesTab.test.tsx |
| 2026-01-13 | Documentation: Add sprint-status to file list, document architecture boundary decision | This story file |
| 2026-01-22 | Story reopened for modifications per sprint-change-proposal-2026-01-21.md | Status: done → in-progress |

---

## Modifications (Change Proposal 2026-01-21)

**Reference:** `_bmad-output/planning-artifacts/sprint-change-proposal-2026-01-21.md`

### Approved Changes

**Proposal 1.3:** Change code generation from batch (50) to single code with organization name
**Proposal 1.4:** Update code list display to show organization name

### Modified Acceptance Criteria

**AC1 (Updated):** Code List now shows: Code, Organization Name, Status, Participant Name (if used)
**AC4 (Updated):** Instead of "Generate 50 More", admin clicks "Add Code" → dialog with Organization Name field → generates single code

### Modification Tasks

- [x] **Mod Task 1: Update CodeListTable to show Organization Name**
  - [x] Add "Organization Name" column after Code column
  - [x] Display organizationName value (shows "-" if null)
  - [x] Update CodeListTable tests

- [x] **Mod Task 2: Replace batch generation with single code dialog**
  - [x] Create AddCodeDialog component (Sheet with form)
  - [x] Form includes: Organization Name (required), generates single 8-digit code
  - [x] On submit: calls API, shows success toast with code, closes dialog
  - [x] Replace GenerateCodesButton with AddCodeDialog in CodesTab
  - [x] Create AddCodeDialog tests (10 tests)

- [x] **Mod Task 3: Update API for single code with organization name**
  - [x] Create new method `generateSingleCode(contestId, organizationName)` in contestsApi
  - [x] Create useGenerateSingleCode hook
  - [x] Keep batch generation for backward compatibility (deprecated)

- [x] **Mod Task 4: Update CodesTab integration**
  - [x] Replace GenerateCodesButton with AddCodeDialog in CodesTab
  - [x] Update empty state to show AddCodeDialog
  - [x] Update CodesTab tests

- [x] **Mod Task 5: Quality Gates**
  - [x] Run npm run type-check - PASSED
  - [x] Run npm run lint - PASSED (only pre-existing shadcn warnings)
  - [x] Run npm run test - PASSED (114 tests in contests feature)
  - [x] Run npm run build - PASSED

### Modification Completion Notes

**Implementation Summary (2026-01-22):**
- Updated CodeListTable to display Organization Name column between Code and Status
- Created AddCodeDialog component using Sheet pattern with organization name input
- Added generateSingleCode API method for single code generation with organization name
- Created useGenerateSingleCode hook for the mutation
- Replaced GenerateCodesButton with AddCodeDialog in CodesTab
- Updated API to fetch organization_name in listParticipantCodes

**Test Coverage:**
- 3 new tests in CodeListTable.test.tsx for organization name display
- 10 new tests in AddCodeDialog.test.tsx for dialog functionality
- Updated CodesTab.test.tsx for Add Code button (12 tests)
- Total: 114 tests pass in contests feature

**Modified Acceptance Criteria Verification:**
- AC1 (Updated): CodeListTable now shows Code, Organization, Status, Participant Name columns ✅
- AC4 (Updated): "Add Code" button opens dialog, generates single code with org name, shows success toast ✅

### Modification File List

**New Files:**
- src/features/contests/components/AddCodeDialog.tsx
- src/features/contests/components/AddCodeDialog.test.tsx
- src/features/contests/hooks/useGenerateSingleCode.ts

**Modified Files:**
- src/features/contests/api/contestsApi.ts (added generateSingleCode method)
- src/features/contests/components/CodeListTable.tsx (added Organization column)
- src/features/contests/components/CodeListTable.test.tsx (added org name tests)
- src/features/contests/components/CodesTab.tsx (replaced GenerateCodesButton with AddCodeDialog)
- src/features/contests/components/CodesTab.test.tsx (updated for Add Code button)
- src/features/contests/components/index.ts (added AddCodeDialog export)
- src/features/contests/hooks/index.ts (added useGenerateSingleCode export)
- src/features/contests/index.ts (added AddCodeDialog and useGenerateSingleCode exports)
- _bmad-output/implementation-artifacts/sprint-status.yaml (status: done → in-progress)
- _bmad-output/implementation-artifacts/2-6-participant-code-management.md (this file)
