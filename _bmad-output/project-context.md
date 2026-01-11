---
project_name: 'media-education-solutions'
user_name: 'NocodeHackers'
date: '2026-01-10'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'critical_rules']
status: 'complete'
rule_count: 25
optimized_for_llm: true
---

# Project Context for AI Agents

_Critical rules and patterns for implementing code in this project. Read this FIRST before any implementation work._

---

## Technology Stack & Versions

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React | 19 |
| Build | Vite | 6+ |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS | v4 |
| Components | shadcn/ui | Latest |
| Backend | Supabase | Auth + PostgreSQL + Edge Functions |
| Server State | TanStack Query | Latest |
| Forms | React Hook Form + Zod | Latest |
| Routing | React Router DOM | v6+ |
| Monitoring | Sentry | Latest |

**External Services:**
- Bunny Stream (video storage/streaming)
- Bunny Storage (photos/assets)
- Brevo (transactional email)

---

## Critical Implementation Rules

### Feature Architecture (MOST IMPORTANT)

**Mandatory Index Files:**
```typescript
// Every feature folder MUST have index.ts exporting ALL contents
// features/submissions/index.ts

// === Components ===
export { UploadProgress } from './components/UploadProgress';
export { SubmissionCard } from './components/SubmissionCard';

// === Hooks ===
export { useSubmissions } from './hooks/useSubmissions';

// === API ===
export { submissionsApi } from './api/submissionsApi';

// === Types ===
export type { Submission, SubmissionStatus } from './types/submission.types';
```

**Import Rules:**
```typescript
// ✅ CORRECT - Always import from feature index
import { UploadProgress, useSubmissions } from '@/features/submissions';

// ❌ WRONG - Never import from deep paths
import { UploadProgress } from '@/features/submissions/components/UploadProgress';
```

**After Creating Any New File:**
1. Add export to the feature's `index.ts` immediately
2. Update `PROJECT_INDEX.md` if adding new features or major components

### Naming Conventions

| Context | Convention | Example |
|---------|------------|---------|
| Database tables | snake_case, plural | `participants`, `contest_codes` |
| Database columns | snake_case | `created_at`, `contest_id` |
| TypeScript files | PascalCase (components), camelCase (utils) | `RatingScale.tsx`, `submissionsApi.ts` |
| Functions/variables | camelCase | `getContests`, `isLoading` |
| Constants | SCREAMING_SNAKE | `MAX_FILE_SIZE` |
| Types/Interfaces | PascalCase | `Contest`, `SubmissionStatus` |
| Hooks | use + PascalCase | `useContests`, `useFileUpload` |

**Data Transformation:**
- Database returns `snake_case` → Transform to `camelCase` in API layer
- Never mix conventions within same layer

### State Management Rules

| State Type | Solution | Location |
|------------|----------|----------|
| Server data | TanStack Query | Feature hooks |
| Form data | React Hook Form | Component-local |
| Auth state | React Context | `AuthContext` |
| Participant session | React Context | `ParticipantSessionContext` |
| Local UI | useState | Component-local |

**Never:**
- Use useState for server data (use TanStack Query)
- Create global state for form data
- Mix state management solutions for same concern

### Authentication Rules

**Three Separate Auth Flows:**

| Role | Method | Implementation |
|------|--------|----------------|
| Admin | Email + Password | Supabase Auth |
| Judge | Email + Password | Supabase Auth (invite flow) |
| Participant | Contest Code + Participant Code | localStorage (NO Supabase account) |

**Participant Session:**
- Store codes in localStorage with `last_activity` timestamp
- Expire after **120 minutes** of inactivity
- Active upload keeps session alive
- Clear on logout (shared device reminder)

### Bunny Upload Security (CRITICAL)

**Never expose Bunny credentials to client.**

**Upload Flow:**
1. Client requests signed URL from Edge Function
2. Edge Function validates: participant codes, category open, within limits
3. Edge Function returns short-lived signed URL
4. Client uploads directly to Bunny using signed URL

**Storage Path Pattern:**
```
/{contest_id}/{category_id}/{participant_code}/{filename}
```

### Anonymous Judging Rules

**Judge queries must NEVER access participant PII.**

```typescript
// ✅ CORRECT - Judge view query
const submissions = await supabase
  .from('submissions')
  .select('id, media_url, participant_id')  // participant_id is UUID, not PII

// ❌ WRONG - Joins to participant data
const submissions = await supabase
  .from('submissions')
  .select('*, participants(name, organization)')  // EXPOSES PII
```

### Error Handling

**Use Standardized Error Codes:**
```typescript
import { ERROR_CODES } from '@/lib/errorCodes';

// Always use predefined codes
throw new AppError(ERROR_CODES.CATEGORY_CLOSED, 'Category deadline has passed');
```

**Error Codes Available:**
- `INVALID_CODES`, `SESSION_EXPIRED`, `CONTEST_NOT_FOUND`
- `CATEGORY_CLOSED`, `SUBMISSION_LIMIT_EXCEEDED`
- `FILE_TOO_LARGE`, `INVALID_FILE_TYPE`
- `VALIDATION_ERROR`, `SERVER_ERROR`

### Component Structure

```typescript
// 1. Imports (React first, then external, then internal)
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui';
import { useContests } from '@/features/contests';

// 2. Types (interface for props)
interface ContestCardProps {
  contest: Contest;
  onSelect: (id: string) => void;
}

// 3. Component (named export, not default)
export function ContestCard({ contest, onSelect }: ContestCardProps) {
  // hooks first
  const [isHovered, setIsHovered] = useState(false);

  // handlers
  const handleClick = () => onSelect(contest.id);

  // render
  return <div>...</div>;
}
```

### Testing Rules

**Co-locate tests with source:**
```
features/submissions/components/
├── UploadProgress.tsx
├── UploadProgress.test.tsx  ← Same folder
```

**Test Naming:**
- Unit tests: `{ComponentName}.test.tsx`
- Integration tests: `{feature}.integration.test.ts`

### Zod Schema Rules

**Single Source of Truth:**
```typescript
// Define schema in types/ folder
// features/contests/types/contest.schemas.ts
export const contestFormSchema = z.object({
  name: z.string().min(1, 'Required'),
  contestCode: z.string().length(6, 'Must be 6 digits'),
});

// Use in form AND API validation
```

---

## Anti-Patterns (NEVER DO)

1. **Never import from deep paths** — Always use feature index
2. **Never use useState for server data** — Use TanStack Query
3. **Never expose Bunny credentials to client** — Use Edge Functions
4. **Never join participant PII in judge queries** — Anonymous judging
5. **Never skip index.ts updates** — Every export must be indexed
6. **Never mix naming conventions** — snake_case DB, camelCase code
7. **Never store participant passwords** — Code-only access
8. **Never use default exports** — Named exports only

---

## Quick Reference

**Before implementing any feature:**
1. Read `PROJECT_INDEX.md` at project root
2. Read the feature's `index.ts` to understand existing exports
3. Check architecture.md for patterns

**After implementing:**
1. Update feature's `index.ts` with new exports
2. Update `PROJECT_INDEX.md` if adding major components
3. Run type-check and lint before committing

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

---

_Last Updated: 2026-01-10_
