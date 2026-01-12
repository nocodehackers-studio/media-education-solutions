---
project_name: 'media-education-solutions'
user_name: 'NocodeHackers'
date: '2026-01-10'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'critical_rules']
status: 'complete'
rule_count: 32
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

### Supabase Security Rules (MANDATORY)

**Signup Triggers:**
- ALWAYS force default role ('judge') in signup triggers
- NEVER trust user metadata for role assignment (prevents privilege escalation)
- ALWAYS use `SET search_path = public` in SECURITY DEFINER functions

```sql
-- CORRECT: Force role, ignore metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SET search_path = public  -- Prevents search_path hijacking
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'judge');  -- Always 'judge', never from metadata
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**RLS Policies:**
- ALWAYS enable RLS on tables with user data
- NEVER allow users to modify their own role or email via RLS UPDATE policies
- Use trigger-based column protection for sensitive fields

**Column Protection Pattern:**
```sql
-- Trigger to prevent role/email modification
CREATE OR REPLACE FUNCTION protect_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Cannot modify role column';
  END IF;
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    RAISE EXCEPTION 'Cannot modify email column';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_profile_columns
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_sensitive_columns();
```

**TypeScript Types Must Match:**
```typescript
// Exclude protected columns from Update type
Update: {
  first_name?: string | null;
  last_name?: string | null;
  // NO role, NO email, NO id
};
```

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

### React Import Standards

**Always use explicit imports, never React namespace:**

```typescript
// ✅ CORRECT - Explicit type imports
import { useState, useEffect } from 'react';
import { type ComponentProps, type HTMLAttributes } from 'react';

// ❌ WRONG - Don't use React namespace
import React from 'react';
const props: React.ComponentProps<typeof Button>;  // Don't do this
```

**Type-only imports for types:**
```typescript
// ✅ CORRECT - Use 'type' keyword for type-only imports
import { type ReactNode, type FC } from 'react';

// Also acceptable
import type { ReactNode, FC } from 'react';
```

### Component Structure

```typescript
// 1. Imports (React first, then external, then internal)
import { useState } from 'react';
import { type ComponentProps } from 'react';
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

### Git Workflow Rules (MANDATORY)

**Branch-Per-Story (Parallel Development):**

Each story MUST have its own dedicated branch. Multiple stories can be in progress simultaneously on separate branches.

```bash
# Branch naming convention
story/{story-id}-{short-description}

# Examples:
story/1-4-core-ui-components
story/1-5-ci-cd-config
story/2-1-super-admin-login
```

**Starting a New Story:**
```bash
git checkout main
git pull origin main
git checkout -b story/{story-id}-{short-description}
```

**Switching Between Stories:**
```bash
# Commit current work before switching
git add -A && git commit -m "{story-id}: WIP - {brief description}"
git checkout story/{other-story-id}-{description}
```

**Commit Message Format (Auto-Generated by Dev):**

The Dev agent MUST auto-generate descriptive commit messages following this format:

```
{story-id}: {action} {what changed}

Actions: Add, Update, Fix, Refactor, Remove, Configure, Implement
```

**Examples:**
- `1-4: Add Button and Card components`
- `1-4: Update index.ts with new exports`
- `1-4: Fix TypeScript errors in form validation`
- `1-5: Configure Vite environment variables`
- `2-1: Implement login form with Supabase auth`

**Before Marking Story as "review" Status:**

1. Switch to the story's branch
2. ALL changes for that story must be committed
3. Branch must be pushed to remote
4. Working tree must be clean (`git status` shows nothing to commit)

**Pre-Review Checklist (MANDATORY):**

Before marking any story as "review" status, verify ALL items:

```bash
# Git Status (REQUIRED)
□ git status          # Must show: "nothing to commit, working tree clean"
□ git log --oneline -5  # Verify commits have story ID prefix
□ git push -u origin story/{story-id}-{description}  # Push to remote

# Quality Gates (REQUIRED)
□ npm run build       # Must pass with no errors
□ npm run lint        # Must pass with no errors
□ npm run type-check  # Must pass with no errors
□ npm run test        # Must pass (if tests exist for story)

# Import Compliance (REQUIRED)
□ grep -r "from '@/" src/ | grep -v "/index'" | grep -v "from '@/lib'" | grep -v "from '@/components/ui'"
  # Should return empty - no deep imports allowed

# Documentation (REQUIRED)
□ All Acceptance Criteria verified with evidence (test output, screenshots, logs)
□ File List in story generated from git (see File List Generation below)
□ Dev Notes updated with any new patterns discovered
```

**File List Generation (MANDATORY):**

NEVER manually write the File List. Always generate from git:

```bash
# Run these commands and copy output to story File List section:

echo "**New Files:**"
git status --porcelain | grep "^??" | cut -c4- | sed 's/^/- /'

echo "**Modified Files:**"
git status --porcelain | grep "^ M\|^M " | cut -c4- | sed 's/^/- /'

echo "**Deleted Files:**"
git status --porcelain | grep "^ D\|^D " | cut -c4- | sed 's/^/- /'
```

**Code Review Will Be REJECTED If:**
- Story changes are not on a dedicated story branch
- Uncommitted changes exist on the story branch
- Branch is not pushed to remote
- Commit messages don't follow the `{story-id}: {action} {what}` format

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
9. **Never trust user metadata for role assignment** — Force default role in triggers
10. **Never manually write File Lists** — Generate from git status
11. **Never use React namespace (React.ComponentProps)** — Use explicit imports
12. **Never skip pre-review checklist** — All gates must pass before review

---

## Quick Reference

**Before implementing any feature:**
1. Read `PROJECT_INDEX.md` at project root
2. Read the feature's `index.ts` to understand existing exports
3. Check this file (project-context.md) for patterns and rules

**After implementing:**
1. Update feature's `index.ts` with new exports
2. Update `PROJECT_INDEX.md` if adding major components
3. Run full pre-review checklist before marking "review"

**Story File Pattern:**
- Do NOT duplicate "Previous Story Learnings" in story files
- Reference: `See project-context.md for established patterns`
- This file is the single source of truth for patterns and rules

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

_Last Updated: 2026-01-12_
