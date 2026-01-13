---
project_name: 'media-education-solutions'
user_name: 'NocodeHackers'
date: '2026-01-12'
sections_completed: ['technology_stack', 'supabase_setup', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'critical_rules']
status: 'complete'
rule_count: 35
optimized_for_llm: true
last_updated: '2026-01-13 - Added Performance Optimization Patterns'
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

## 🚨 CRITICAL: Supabase Setup (MUST READ)

**This project uses ONLINE Supabase (Hosted Cloud) - NOT local Docker.**

### Database Environment

| Environment | Method | Status |
|-------------|--------|--------|
| Development | Online Supabase (cyslxhojwlhbeabgvngv.supabase.co) | ✅ Active |
| Local Docker | NOT USED | ❌ Do NOT use |

### Migration Commands

**✅ CORRECT Commands (Online Supabase):**
```bash
npx supabase migration new <description>  # Create new migration
npx supabase db push                      # Apply migrations to online DB
npx supabase migration list               # Check migration status
npx supabase migration repair             # Fix migration history if needed
```

**❌ WRONG Commands (Local Docker - DO NOT USE):**
```bash
npx supabase start      # ❌ Starts local Docker (NOT USED)
npx supabase db reset   # ❌ Resets local Docker only (NOT USED)
npx supabase stop       # ❌ Stops local Docker (NOT USED)
```

### Why Online Supabase?

1. **No Docker overhead** - Simpler setup for developers
2. **Shared database** - All team members work on same instance
3. **Automatic backups** - Managed by Supabase
4. **Consistent environment** - No local/remote sync issues

### Applying Migrations

When you create a migration file in `supabase/migrations/`:

1. Write your SQL in the timestamped file
2. Run `npx supabase db push` to apply to online database
3. If conflicts occur, may need `npx supabase db push --include-all`
4. Verify with `npx supabase migration list`

**NEVER:**
- ❌ Run local Supabase commands (`start`, `stop`, `reset`)
- ❌ Use Docker Desktop for Supabase
- ❌ Apply migrations manually via Supabase dashboard (use CLI)

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

**Exception for shadcn/ui Components:**
```typescript
// ✅ ACCEPTABLE - shadcn/ui components in src/components/ui/ use their canonical style
// These are auto-generated by shadcn CLI and use React namespace imports
// Example: src/components/ui/avatar.tsx, button.tsx, etc.
import * as React from "react"
const Component = React.forwardRef<React.ElementRef<...>, React.ComponentPropsWithoutRef<...>>()

// Project rule applies to: features/, pages/, contexts/, router/, lib/ (NOT src/components/ui/)
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

### Git Workflow Rules (MANDATORY - ENFORCED BY WORKFLOWS)

**🔥 CRITICAL: Branch discipline is now ENFORCED by dev-story and code-review workflows 🔥**

**Branch-Per-Story (Parallel Development):**

Each story MUST have its own dedicated branch. Multiple stories can be in progress simultaneously on separate branches.

**Branch Naming Convention (EXACT MATCH REQUIRED):**
```bash
story/{story-key}

# The branch name MUST exactly match the story filename (without .md extension)
# Examples:
story/1-4-core-ui-components  # for file: 1-4-core-ui-components.md
story/1-5-ci-cd-config        # for file: 1-5-ci-cd-config.md
story/2-1-super-admin-login   # for file: 2-1-super-admin-login.md
```

**Automatic Enforcement:**

**When dev-story workflow runs:**
1. **Checks if branch `story/{story-key}` exists**
2. **If exists:** Checks out the branch and continues
3. **If not exists:** Creates branch from main, checks out, and continues
4. **Validates:** Confirms you're on correct branch before any code changes
5. **Before marking "review":** Ensures all changes committed and branch pushed to remote

**When code-review workflow runs:**
1. **REQUIRES branch `story/{story-key}` to exist** - HALTS if missing
2. **Checks out the story branch** to review actual changes
3. **After approval (status=done):** Offers to merge branch automatically or create PR
4. **Commits any review fixes** made during review to the story branch

**Starting a New Story:**
```bash
# Dev workflow handles this automatically - no manual branch creation needed!
# Just run: /dev-story

# Workflow will:
# - Detect no branch exists for story
# - Create story/{story-key} from main
# - Checkout the branch
# - Begin implementation
```

**Switching Between Stories:**
```bash
# Commit current work before switching
git add -A && git commit -m "{story-id}: WIP - {brief description}"
git checkout story/{other-story-id}

# Or let dev-story handle it - it will checkout correct branch automatically
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
- ❌ Story changes are not on a dedicated story branch → **NOW ENFORCED:** code-review HALTS if branch doesn't exist
- ❌ Uncommitted changes exist on the story branch → **NOW ENFORCED:** dev-story validates before marking "review"
- ❌ Branch is not pushed to remote → **NOW ENFORCED:** dev-story auto-pushes before marking "review"
- ❌ Commit messages don't follow the `{story-id}: {action} {what}` format → Reviewers will flag this

**Branch Enforcement Summary:**
- ✅ **dev-story workflow:** Automatically creates/checks out correct branch, validates before marking "review"
- ✅ **code-review workflow:** Validates branch exists before review, offers auto-merge after approval
- ✅ **Parallel development:** Multiple stories can safely run simultaneously on separate branches

---

## Performance Optimization Patterns

### TanStack Query Configuration

**Global Query Settings (CRITICAL):**
```typescript
// src/lib/queryClient.ts - DO NOT OVERRIDE these in individual hooks
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,              // 30 seconds before considered stale
      refetchOnWindowFocus: false,    // CRITICAL: Prevents input focus network spam
      refetchOnMount: false,          // Only refetch when explicitly invalidated
      retry: 3,
    },
  },
});
```

**Why These Settings:**
- `refetchOnWindowFocus: false` — Prevents network requests when clicking inputs or switching tabs
- `refetchOnMount: false` — Data persists between route changes, only refetches when stale
- `staleTime: 30_000` — Reduces unnecessary API calls while keeping data reasonably fresh

### Route-Based Code Splitting

**Lazy Load Non-Critical Routes:**
```typescript
// Critical path (login) - load immediately
import { LoginPage } from '@/pages/auth/LoginPage';

// Non-critical - lazy load
const AdminDashboardPage = lazy(() =>
  import('@/pages/admin/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);

// Wrap lazy components in Suspense
<Suspense fallback={<LoadingSpinner />}>
  <AdminDashboardPage />
</Suspense>
```

**Vendor Chunk Splitting (vite.config.ts):**
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        'supabase-vendor': ['@supabase/supabase-js'],
        'query-vendor': ['@tanstack/react-query'],
        'ui-vendor': ['react-hook-form', '@hookform/resolvers', 'zod', 'lucide-react'],
      },
    },
  },
}
```

### Auth State Management

**Handle All Edge Cases in AuthProvider:**
```typescript
// Always add .catch() to getSession()
supabase.auth.getSession()
  .then(({ data, error }) => { /* handle */ })
  .catch((error) => {
    // CRITICAL: Always set loading false, even on error
    setIsLoading(false);
  });

// Skip INITIAL_SESSION event (already handled by getSession)
if (event === 'INITIAL_SESSION') return;

// Add timeout to profile fetch (5s max)
const profile = await Promise.race([
  fetchProfile(userId),
  new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
]);
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
9. **Never trust user metadata for role assignment** — Force default role in triggers
10. **Never manually write File Lists** — Generate from git status
11. **Never use React namespace (React.ComponentProps)** — Use explicit imports
12. **Never skip pre-review checklist** — All gates must pass before review
13. **Never work on wrong branch** — Workflows enforce story/{story-key} branching (auto-created if missing)
14. **Never mark story "review" with uncommitted changes** — Workflow validates and auto-pushes
15. **Never use local Supabase/Docker commands** — Project uses online Supabase only (no `supabase start`, `db reset`, or Docker)
16. **Never override refetchOnWindowFocus in individual hooks** — Use global queryClient settings
17. **Never eagerly import admin pages** — Use React.lazy() for non-critical routes

---

## Quick Reference

**Before implementing any feature:**
1. Read `README.md` at project root (setup instructions, Supabase info)
2. Read `PROJECT_INDEX.md` (project structure overview)
3. Read this file (project-context.md) for critical patterns and rules
4. Read the feature's `index.ts` to understand existing exports
5. For database work, read `supabase/README.md` for migration workflow

**After implementing:**
1. Update feature's `index.ts` with new exports
2. Update `PROJECT_INDEX.md` if adding major components
3. Run full pre-review checklist before marking "review"
4. If you added migrations, verify with `npx supabase migration list`

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

_Last Updated: 2026-01-13 (Performance Optimization Patterns Added)_
