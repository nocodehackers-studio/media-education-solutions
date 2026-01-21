---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
status: 'complete'
completedAt: '2026-01-10'
lastStep: 8
inputDocuments:
  - _bmad-output/planning-artifacts/prd/index.md
  - _bmad-output/planning-artifacts/prd/executive-summary.md
  - _bmad-output/planning-artifacts/prd/functional-requirements.md
  - _bmad-output/planning-artifacts/prd/non-functional-requirements.md
  - _bmad-output/planning-artifacts/prd/web-application-requirements.md
  - _bmad-output/planning-artifacts/prd/user-journeys.md
  - _bmad-output/planning-artifacts/prd/scoping-development-strategy.md
  - _bmad-output/planning-artifacts/product-brief/index.md
  - _bmad-output/planning-artifacts/product-brief/core-vision.md
  - _bmad-output/planning-artifacts/product-brief/mvp-scope.md
  - _bmad-output/planning-artifacts/ux-design/index.md
  - _bmad-output/planning-artifacts/ux-design/design-system-foundation.md
  - _bmad-output/planning-artifacts/ux-design/component-strategy.md
  - _bmad-output/planning-artifacts/ux-design/visual-design-foundation.md
  - _bmad-output/planning-artifacts/ux-design/user-journey-flows.md
  - _bmad-output/planning-artifacts/ux-design/responsive-design-accessibility.md
workflowType: 'architecture'
project_name: 'media-education-solutions'
user_name: 'NocodeHackers'
date: '2026-01-09'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

64 functional requirements across 9 domains:

| Domain | FRs | Architectural Impact |
|--------|-----|---------------------|
| Authentication & Access | FR1-FR5 | Three auth flows: Admin/Judge (email+password), Participant (codes only) |
| Contest Management | FR6-FR14 | State machine with 5 states, category independence |
| Participant Codes | FR15-FR19 | Auto-generation, batch operations, scoped uniqueness |
| Judge Management | FR20-FR24 | Assignment system, progress tracking, email triggers |
| Participant Submissions | FR25-FR37 | Heavy file handling, timestamp logic, edit/withdraw flows |
| Judging & Evaluation | FR38-FR48 | Anonymous interface, rating system, drag-drop ranking |
| Admin Review & Override | FR49-FR53 | Full data visibility, override capabilities |
| Results & Winners | FR54-FR60 | Password-protected public page, feedback access |
| Notifications | FR61-FR64 | Email integration via Brevo |

**Non-Functional Requirements:**

| Category | Requirement | Architectural Decision Driver |
|----------|-------------|------------------------------|
| Performance | 100+ simultaneous uploads | Direct browser-to-Bunny uploads, no server bottleneck |
| Performance | <3s initial load | Code splitting, lazy loading, CDN hosting |
| Performance | <2s video playback | Bunny Stream transcoding + edge delivery |
| Security | Anonymous judging | Separate data models for judge view vs admin view |
| Security | Password-protected winners | Client-side gate, data fetched only after auth |
| Scalability | 5+ concurrent contests | Multi-tenant data model, efficient queries |
| Scalability | 200-500 participants/contest | Bunny handles storage scale, Supabase handles metadata |
| Reliability | 99.5% upload success | Resumable uploads, retry logic, clear error states |

**Scale & Complexity:**

- Primary domain: Full-stack web application (React SPA + Supabase BaaS)
- Complexity level: Medium-High
- Estimated architectural components: ~15-20 (auth, contests, categories, codes, submissions, reviews, rankings, notifications, file handling, etc.)

### Technical Constraints & Dependencies

**Fixed Technology Choices (from PRD):**
- Frontend: React + Vite (SPA, no SSR needed)
- Backend: Supabase (Auth, PostgreSQL, Edge Functions if needed)
- Video: Bunny Stream (storage, transcoding, streaming)
- Photos/Assets: Bunny Storage (all files per architectural decision)
- Email: Brevo (transactional templates)
- Hosting: Vercel (frontend deployment)

**Design System (from UX Spec):**
- Component library: shadcn/ui + Tailwind CSS
- Typography: Inter
- Custom components: 7 identified (UploadProgress, RatingScale, MediaViewer, SubmissionCard, ContestCard, RankingDropzone, CodeListTable)

### Cross-Cutting Concerns Identified

1. **File Upload Pipeline**
   - Direct browser → Bunny uploads (bypass server)
   - Chunked/resumable for large videos
   - Progress tracking with real-time UI feedback
   - Timestamp locks on upload start (deadline fairness)

2. **Role-Based Access Control**
   - Admin: Full access to all data
   - Judge: Anonymous view only (codes, no PII)
   - Participant: Own submissions and feedback only
   - Enforced at database level (RLS policies)

3. **Contest State Machine**
   - States: Draft → Published → Closed → Reviewed → Finished
   - Categories have independent status within contests
   - State transitions trigger notifications

4. **Anonymous Data Isolation**
   - Judge queries must never join to participant PII
   - Separate API endpoints or views for judge vs admin
   - Audit trail for any PII access

5. **Notification System**
   - Trigger points: Judge assignment, category close, review complete, contest finish
   - Brevo templates for each notification type
   - Async processing (don't block user actions)

6. **Bunny Upload Security (CRITICAL)**
   - **No direct public Bunny endpoints** — All uploads authenticated and authorized
   - **Signed upload URLs** — Short-lived, single-use URLs generated server-side after validating:
     - Valid participant code for the contest
     - Category is still open (not past deadline)
     - User hasn't exceeded submission limits
   - **Storage isolation** — Unique paths: `/{contest_id}/{category_id}/{participant_code}/{file}`
   - **No enumeration** — Participants cannot list or guess other file paths
   - **Delete protection** — Only submitting participant (pre-deadline) or admin can delete
   - **Rate limiting** — Per-participant, per-contest limits to prevent abuse
   - **File validation** — Verify file type and size before accepting

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application (React SPA + Supabase BaaS) based on project requirements analysis.

### Selected Approach: Official Manual Setup

**Rationale:**
- Always up-to-date (Tailwind v4, React 19, Vite 6+)
- No third-party template dependencies
- You control exactly what's included
- Official documentation matches your setup

**Initialization Sequence:**

```bash
# 1. Create Vite project
npm create vite@latest media-education-solutions -- --template react-ts
cd media-education-solutions

# 2. Install Tailwind
npm install tailwindcss @tailwindcss/vite

# 3. Install shadcn/ui
npx shadcn@latest init

# 4. Add Supabase
npm install @supabase/supabase-js

# 5. Add form handling (from UX spec)
npm install react-hook-form @hookform/resolvers zod

# 6. Add routing
npm install react-router-dom
```

**Reference:** [shadcn/ui Vite Installation Guide](https://ui.shadcn.com/docs/installation/vite)

**Architectural Decisions Established:**

| Category | Decision |
|----------|----------|
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Forms | React Hook Form + Zod validation |
| Routing | React Router DOM |
| Backend Client | Supabase JS SDK |

**Note:** Project initialization using this sequence should be the first implementation story.

## Core Architectural Decisions

### Data Architecture

**Database Schema:**

```sql
-- Contests & Categories
contests (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,           -- Custom URL: /contests/{slug}
  contest_code TEXT UNIQUE NOT NULL,   -- 6-digit public code
  rules TEXT,
  cover_image_url TEXT,
  status TEXT DEFAULT 'draft',         -- draft/published/closed/reviewed/finished
  winners_page_password TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
)

categories (
  id UUID PRIMARY KEY,
  contest_id UUID REFERENCES contests(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,                  -- video/photo
  rules TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'draft',         -- draft/published/closed
  judge_id UUID REFERENCES profiles(id), -- Single judge per category
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Participants (merged with codes)
participants (
  id UUID PRIMARY KEY,
  contest_id UUID REFERENCES contests(id),
  code TEXT NOT NULL,                  -- 8-digit unique per contest
  status TEXT DEFAULT 'unused',        -- unused/used
  name TEXT,
  organization_name TEXT,
  tlc_name TEXT,
  tlc_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contest_id, code)
)

-- Submissions
submissions (
  id UUID PRIMARY KEY,
  category_id UUID REFERENCES categories(id),
  participant_id UUID REFERENCES participants(id),
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL,            -- video/photo
  submitted_at TIMESTAMPTZ NOT NULL,   -- Locks on upload START
  status TEXT DEFAULT 'submitted',     -- submitted/disqualified
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category_id, participant_id)  -- One submission per participant per category
)

-- Reviews
reviews (
  id UUID PRIMARY KEY,
  submission_id UUID REFERENCES submissions(id) UNIQUE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 10),
  feedback_text TEXT,
  feedback_text_admin_override TEXT,   -- Admin's version if changed
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Rankings
rankings (
  id UUID PRIMARY KEY,
  category_id UUID REFERENCES categories(id) UNIQUE,
  ranked_submissions JSONB NOT NULL,   -- Ordered array: [{submission_id, tier}, ...]
  is_admin_override BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Users (via Supabase Auth)
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  role TEXT NOT NULL,                  -- admin/judge
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

**Ranking Array Structure:**
```json
[
  { "submission_id": "uuid", "tier": "master_creator" },
  { "submission_id": "uuid", "tier": "master_creator" },
  { "submission_id": "uuid", "tier": "advanced_producer" }
]
```
- Index = Rank (0 = 1st place, 1 = 2nd place, etc.)
- Top 3 indices = Winners displayed on winners page
- Constraint: Lower-tier submissions cannot rank above higher-tier submissions

**Rating Tiers:**

| Tier | Rating Range |
|------|--------------|
| Developing Skills | 1-2 |
| Emerging Producer | 3-4 |
| Proficient Creator | 5-6 |
| Advanced Producer | 7-8 |
| Master Creator | 9-10 |

### Authentication & Security

**Auth Flows by Role:**

| Role | Method | Implementation |
|------|--------|----------------|
| Super Admin | Email + Password | Supabase Auth standard login |
| Judge | Email + Password | Supabase invite → set password on first visit |
| Participant | Contest Code + Participant Code | Stateless, localStorage, no Supabase account |

**Participant Session Security:**
- Codes stored in localStorage with `last_activity` timestamp
- Session expires after **120 minutes** of inactivity
- Active upload keeps session alive
- Logout button with reminder for shared devices

**Bunny Upload Security (CRITICAL):**
- No direct public Bunny endpoints
- Signed upload URLs generated server-side via Edge Function
- Validation before URL generation: valid codes, category open, within limits
- Storage isolation: `/{contest_id}/{category_id}/{participant_code}/{file}`
- Rate limiting per participant per contest

### API Patterns

| Operation | Approach | Reason |
|-----------|----------|--------|
| Read/write contests, categories, submissions | Supabase Client + RLS | Simple CRUD, RLS enforces access |
| Generate Bunny signed URLs | Edge Function | Secret keys, validation logic |
| Send email notifications | Edge Function | Brevo API keys, async |
| Validate participant codes | Edge Function | Rate limiting, session token |

**Row Level Security (RLS):**
- Admin: Full access to all tables
- Judge: Read assigned categories + submissions, write reviews/rankings
- Participant (via Edge Function): Own submissions only

### Frontend Architecture

**State Management:**

| State Type | Solution |
|------------|----------|
| Server state | TanStack Query |
| UI state | React Context |
| Form state | React Hook Form + Zod |

**Folder Structure: Bulletproof React**

```
src/
├── features/
│   ├── auth/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── index.ts          # REQUIRED
│   ├── contests/
│   │   └── index.ts          # REQUIRED
│   ├── categories/
│   │   └── index.ts          # REQUIRED
│   ├── submissions/
│   │   └── index.ts          # REQUIRED
│   ├── reviews/
│   │   └── index.ts          # REQUIRED
│   ├── rankings/
│   │   └── index.ts          # REQUIRED
│   └── participants/
│       └── index.ts          # REQUIRED
├── components/ui/            # shadcn/ui primitives only
├── lib/                      # Supabase client, global utilities
├── pages/                    # Thin route wrappers
└── types/                    # Shared types only
```

**Coding Guideline: Feature Index Files**

Every feature folder MUST have an `index.ts` that exports its public API.

```typescript
// features/reviews/index.ts
export { RatingScale } from './components/RatingScale';
export { useReviews, useSubmitReview } from './hooks/useReviews';
export { reviewsApi } from './api/reviewsApi';
export type { Review, Rating, Tier } from './types/review.types';
```

**Import Rule:**
```typescript
// ✅ Good
import { RatingScale, useReviews } from '@/features/reviews';

// ❌ Bad
import { RatingScale } from '@/features/reviews/components/RatingScale';
```

**For AI Agents:** When exploring or modifying a feature:
1. FIRST read `features/{feature}/index.ts`
2. Understand available exports before diving into subfolders
3. When adding new exports, UPDATE the index.ts

### Infrastructure & Deployment

**Environments:**

| Environment | Supabase Project | Purpose |
|-------------|------------------|---------|
| development | Separate project | Local dev, safe to reset |
| preview | Production project | PR preview deployments |
| production | Production project | Live site |

**Environment Variables:**

| Service | Variables |
|---------|-----------|
| Supabase | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Bunny Storage | `BUNNY_STORAGE_API_KEY`, `BUNNY_STORAGE_ZONE` |
| Bunny Stream | `BUNNY_STREAM_API_KEY`, `BUNNY_STREAM_LIBRARY_ID` |
| Brevo | `BREVO_API_KEY` |
| Sentry | `VITE_SENTRY_DSN` |

**CI/CD Pipeline:**

| Trigger | Action |
|---------|--------|
| Push to `main` | Deploy to production (Vercel) |
| Push to PR branch | Deploy preview (Vercel) |
| PR opened | Run lint, type-check, tests (GitHub Actions) |

**Monitoring:**

| Need | Solution |
|------|----------|
| Error tracking | Sentry (free tier) |
| Analytics | Vercel Analytics |
| Logs | Vercel + Supabase dashboards |

### Updated Initialization Sequence

```bash
# 1. Create Vite project
npm create vite@latest media-education-solutions -- --template react-ts
cd media-education-solutions

# 2. Install Tailwind
npm install tailwindcss @tailwindcss/vite

# 3. Install shadcn/ui
npx shadcn@latest init

# 4. Add Supabase
npm install @supabase/supabase-js

# 5. Add form handling + data fetching
npm install react-hook-form @hookform/resolvers zod @tanstack/react-query

# 6. Add routing
npm install react-router-dom

# 7. Add error tracking
npm install @sentry/react
```

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database:**
- Tables: snake_case, plural (`contests`, `participants`)
- Columns: snake_case (`contest_id`, `created_at`)
- Foreign keys: `{table}_id`
- Indexes: `idx_{table}_{column}`

**Code:**
- Components: PascalCase (`RatingScale.tsx`)
- Functions/variables: camelCase (`getContests`, `isLoading`)
- Constants: SCREAMING_SNAKE (`MAX_FILE_SIZE`)
- Types: PascalCase (`Contest`, `SubmissionStatus`)
- Hooks: `use` + PascalCase (`useContests`)

### Format Patterns

**API Responses:**
```typescript
{ data: T | null, error: { message: string, code: string } | null }
```

**JSON Fields:**
- Database/API: snake_case
- Frontend state: camelCase (transform on fetch)

**Dates:**
- Storage: TIMESTAMPTZ
- API: ISO 8601 (`2026-01-10T14:30:00Z`)
- Display: `Intl.DateTimeFormat`

### Error Handling Patterns

**Standardized Error Codes:**
```typescript
// lib/errorCodes.ts
export const ERROR_CODES = {
  INVALID_CODES: 'INVALID_CODES',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  CONTEST_NOT_FOUND: 'CONTEST_NOT_FOUND',
  CATEGORY_CLOSED: 'CATEGORY_CLOSED',
  SUBMISSION_LIMIT_EXCEEDED: 'SUBMISSION_LIMIT_EXCEEDED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;
```

**Frontend Error Handling:**
- TanStack Query error states for server errors
- Sentry logging for all errors
- User-friendly toast messages

### Loading State Patterns

| State | Meaning | UI Pattern |
|-------|---------|------------|
| `isLoading` | Initial fetch | Skeleton |
| `isFetching` | Refetch | Subtle indicator |
| `isSubmitting` | Form submit | Button spinner |
| `isUploading` | File upload | Progress bar |

### State Management Patterns

| State Type | Solution |
|------------|----------|
| Server data | TanStack Query |
| Form data | React Hook Form |
| Local UI | useState |
| Shared UI | React Context (one per concern) |

### Validation Patterns

- Zod schemas as single source of truth in `types/` folder
- Validate on blur (field) + submit (form) + server (Edge Function)

### File Patterns

- Tests co-located: `RatingScale.test.tsx` next to `RatingScale.tsx`
- Components: Named exports, props interface above component, hooks first

### Component File Structure

```typescript
// 1. Imports
import { useState } from 'react';

// 2. Types
interface ComponentProps {
  value: string;
  onChange: (value: string) => void;
}

// 3. Component (named export)
export function Component({ value, onChange }: ComponentProps) {
  // hooks first
  const [state, setState] = useState();

  // handlers
  const handleChange = () => {};

  // render
  return <div>...</div>;
}
```

### Enforcement: All AI Agents MUST

1. Follow naming conventions exactly (snake_case DB, camelCase code, PascalCase components)
2. Import from feature index, not deep paths
3. Use standardized error codes from `lib/errorCodes.ts`
4. Use TanStack Query for all server state
5. Define Zod schemas for all forms
6. Co-locate tests with source files
7. Use named exports for components
8. Update `index.ts` when adding new exports to a feature

## Project Structure & Boundaries

### Complete Project Directory Structure

```
media-education-solutions/
├── PROJECT_INDEX.md                   # REQUIRED: Master manifest for LLM discoverability
├── README.md
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── components.json
├── .env.local
├── .env.example
├── .gitignore
├── .eslintrc.cjs
├── .prettierrc
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── public/
│   └── favicon.ico
│
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   └── 00001_initial_schema.sql
│   └── functions/
│       ├── generate-upload-url/
│       │   └── index.ts
│       ├── validate-participant/
│       │   └── index.ts
│       └── send-notification/
│           └── index.ts
│
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── vite-env.d.ts
    │
    ├── components/
    │   └── ui/
    │       ├── index.ts               # REQUIRED
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── input.tsx
    │       ├── dialog.tsx
    │       ├── toast.tsx
    │       ├── skeleton.tsx
    │       ├── progress.tsx
    │       ├── badge.tsx
    │       ├── table.tsx
    │       ├── tabs.tsx
    │       ├── dropdown-menu.tsx
    │       └── form.tsx
    │
    ├── features/
    │   ├── auth/
    │   │   ├── api/
    │   │   │   └── authApi.ts
    │   │   ├── components/
    │   │   │   ├── LoginForm.tsx
    │   │   │   ├── LoginForm.test.tsx
    │   │   │   └── SetPasswordForm.tsx
    │   │   ├── hooks/
    │   │   │   ├── useAuth.ts
    │   │   │   └── useAuth.test.ts
    │   │   ├── types/
    │   │   │   └── auth.types.ts
    │   │   └── index.ts               # REQUIRED
    │   │
    │   ├── contests/
    │   │   ├── api/
    │   │   │   └── contestsApi.ts
    │   │   ├── components/
    │   │   │   ├── ContestCard.tsx
    │   │   │   ├── ContestCard.test.tsx
    │   │   │   ├── ContestForm.tsx
    │   │   │   ├── ContestStatusBadge.tsx
    │   │   │   └── ContestList.tsx
    │   │   ├── hooks/
    │   │   │   ├── useContests.ts
    │   │   │   └── useContestMutations.ts
    │   │   ├── types/
    │   │   │   ├── contest.types.ts
    │   │   │   └── contest.schemas.ts
    │   │   └── index.ts               # REQUIRED
    │   │
    │   ├── categories/
    │   │   ├── api/
    │   │   │   └── categoriesApi.ts
    │   │   ├── components/
    │   │   │   ├── CategoryCard.tsx
    │   │   │   ├── CategoryForm.tsx
    │   │   │   └── CategoryStatusBadge.tsx
    │   │   ├── hooks/
    │   │   │   └── useCategories.ts
    │   │   ├── types/
    │   │   │   ├── category.types.ts
    │   │   │   └── category.schemas.ts
    │   │   └── index.ts               # REQUIRED
    │   │
    │   ├── participants/
    │   │   ├── api/
    │   │   │   └── participantsApi.ts
    │   │   ├── components/
    │   │   │   ├── ParticipantCodeEntry.tsx
    │   │   │   ├── ParticipantCodeEntry.test.tsx
    │   │   │   ├── ParticipantInfoForm.tsx
    │   │   │   ├── CodeListTable.tsx
    │   │   │   └── SessionExpiredDialog.tsx
    │   │   ├── hooks/
    │   │   │   ├── useParticipantSession.ts
    │   │   │   └── useParticipantCodes.ts
    │   │   ├── types/
    │   │   │   ├── participant.types.ts
    │   │   │   └── participant.schemas.ts
    │   │   └── index.ts               # REQUIRED
    │   │
    │   ├── submissions/
    │   │   ├── api/
    │   │   │   └── submissionsApi.ts
    │   │   ├── components/
    │   │   │   ├── UploadProgress.tsx
    │   │   │   ├── UploadProgress.test.tsx
    │   │   │   ├── SubmissionCard.tsx
    │   │   │   ├── SubmissionForm.tsx
    │   │   │   ├── MediaViewer.tsx
    │   │   │   └── SubmissionConfirmation.tsx
    │   │   ├── hooks/
    │   │   │   ├── useSubmissions.ts
    │   │   │   ├── useFileUpload.ts
    │   │   │   └── useFileUpload.test.ts
    │   │   ├── types/
    │   │   │   ├── submission.types.ts
    │   │   │   └── submission.schemas.ts
    │   │   └── index.ts               # REQUIRED
    │   │
    │   ├── reviews/
    │   │   ├── api/
    │   │   │   └── reviewsApi.ts
    │   │   ├── components/
    │   │   │   ├── RatingScale.tsx
    │   │   │   ├── RatingScale.test.tsx
    │   │   │   ├── ReviewForm.tsx
    │   │   │   ├── FeedbackDisplay.tsx
    │   │   │   └── ReviewProgress.tsx
    │   │   ├── hooks/
    │   │   │   ├── useReviews.ts
    │   │   │   └── useSubmitReview.ts
    │   │   ├── types/
    │   │   │   ├── review.types.ts
    │   │   │   └── review.schemas.ts
    │   │   └── index.ts               # REQUIRED
    │   │
    │   ├── rankings/
    │   │   ├── api/
    │   │   │   └── rankingsApi.ts
    │   │   ├── components/
    │   │   │   ├── RankingDropzone.tsx
    │   │   │   ├── RankingDropzone.test.tsx
    │   │   │   ├── RankedSubmissionCard.tsx
    │   │   │   └── TierGroup.tsx
    │   │   ├── hooks/
    │   │   │   ├── useRankings.ts
    │   │   │   └── useRankingMutations.ts
    │   │   ├── types/
    │   │   │   ├── ranking.types.ts
    │   │   │   └── ranking.schemas.ts
    │   │   └── index.ts               # REQUIRED
    │   │
    │   └── notifications/
    │       ├── api/
    │       │   └── notificationsApi.ts
    │       ├── hooks/
    │       │   └── useNotifications.ts
    │       ├── types/
    │       │   └── notification.types.ts
    │       └── index.ts               # REQUIRED
    │
    ├── pages/
    │   ├── index.ts                   # REQUIRED
    │   ├── admin/
    │   │   ├── DashboardPage.tsx
    │   │   ├── ContestDetailPage.tsx
    │   │   ├── ContestCreatePage.tsx
    │   │   ├── CategoryDetailPage.tsx
    │   │   ├── SubmissionsPage.tsx
    │   │   └── ParticipantCodesPage.tsx
    │   ├── judge/
    │   │   ├── JudgeDashboardPage.tsx
    │   │   ├── ReviewPage.tsx
    │   │   └── RankingPage.tsx
    │   ├── participant/
    │   │   ├── EntryPage.tsx
    │   │   ├── ContestViewPage.tsx
    │   │   ├── SubmissionPage.tsx
    │   │   └── FeedbackPage.tsx
    │   └── public/
    │       ├── WinnersPage.tsx
    │       └── NotFoundPage.tsx
    │
    ├── contexts/
    │   ├── index.ts                   # REQUIRED
    │   ├── AuthContext.tsx
    │   └── ParticipantSessionContext.tsx
    │
    ├── lib/
    │   ├── index.ts                   # REQUIRED
    │   ├── supabase.ts
    │   ├── queryClient.ts
    │   ├── sentry.ts
    │   ├── utils.ts
    │   └── errorCodes.ts
    │
    ├── types/
    │   ├── index.ts                   # REQUIRED
    │   └── global.types.ts
    │
    └── router/
        └── index.tsx
```

### LLM Discoverability System

#### PROJECT_INDEX.md (Root Manifest)

**Location:** Project root
**Purpose:** Master index that LLMs read FIRST before any work

```markdown
# Project Index — media-education-solutions

**AI AGENTS: Read this file first when working on this project.**

## Features (src/features/)

| Feature | Purpose | Key Exports |
|---------|---------|-------------|
| auth | Admin/Judge login, session management | LoginForm, useAuth, authApi |
| contests | Contest CRUD, status management | ContestCard, useContests, contestsApi |
| categories | Category management within contests | CategoryCard, useCategories |
| participants | Participant codes, session, info | ParticipantCodeEntry, useParticipantSession |
| submissions | File uploads, submission management | UploadProgress, useFileUpload, MediaViewer |
| reviews | Rating, feedback for submissions | RatingScale, useReviews, ReviewForm |
| rankings | Drag-drop ranking, tier ordering | RankingDropzone, useRankings |
| notifications | Email triggers via Brevo | useNotifications |

## Shared Code (src/lib/)

| File | Purpose |
|------|---------|
| supabase.ts | Supabase client initialization |
| queryClient.ts | TanStack Query client setup |
| sentry.ts | Sentry error tracking init |
| utils.ts | cn() helper, shared utilities |
| errorCodes.ts | Standardized error codes |

## Contexts (src/contexts/)

| Context | Purpose |
|---------|---------|
| AuthContext | Admin/Judge authentication state |
| ParticipantSessionContext | Participant codes + 120min timeout |

## Edge Functions (supabase/functions/)

| Function | Purpose |
|----------|---------|
| generate-upload-url | Create signed Bunny URLs for uploads |
| validate-participant | Validate contest + participant codes |
| send-notification | Send emails via Brevo |

## UI Components (src/components/ui/)

shadcn/ui primitives: Button, Card, Input, Dialog, Toast, Skeleton, Progress, Badge, Table, Tabs, DropdownMenu, Form

## Pages (src/pages/)

| Route Group | Pages |
|-------------|-------|
| admin/ | Dashboard, ContestDetail, ContestCreate, CategoryDetail, Submissions, ParticipantCodes |
| judge/ | JudgeDashboard, Review, Ranking |
| participant/ | Entry, ContestView, Submission, Feedback |
| public/ | Winners, NotFound |
```

#### Comprehensive Index File Pattern

Every `index.ts` must export ALL contents with categorized comments:

```typescript
// features/submissions/index.ts

// === Components ===
export { UploadProgress } from './components/UploadProgress';
export { SubmissionCard } from './components/SubmissionCard';
export { SubmissionForm } from './components/SubmissionForm';
export { MediaViewer } from './components/MediaViewer';
export { SubmissionConfirmation } from './components/SubmissionConfirmation';

// === Hooks ===
export { useSubmissions } from './hooks/useSubmissions';
export { useFileUpload } from './hooks/useFileUpload';

// === API ===
export { submissionsApi } from './api/submissionsApi';

// === Types ===
export type {
  Submission,
  SubmissionStatus,
  MediaType,
  UploadProgress as UploadProgressType
} from './types/submission.types';

// === Schemas ===
export {
  submissionFormSchema,
  fileValidationSchema
} from './types/submission.schemas';
```

#### Required Index Files

| Location | Must Export |
|----------|-------------|
| `features/{feature}/index.ts` | All components, hooks, API, types, schemas |
| `components/ui/index.ts` | All UI primitives |
| `lib/index.ts` | All utilities and clients |
| `contexts/index.ts` | All context providers and hooks |
| `pages/index.ts` | All page components |
| `types/index.ts` | All shared types |

### AI Agent Discoverability Rules

**Before ANY work on this codebase:**
1. Read `PROJECT_INDEX.md` at project root
2. Understand all features, contexts, and edge functions that exist

**Before modifying a feature:**
1. Read `features/{feature}/index.ts` completely
2. Understand all exports before making changes
3. Check for related tests (co-located with source)

**After adding new files:**
1. Add export to the relevant `index.ts` immediately
2. Update `PROJECT_INDEX.md` if adding new features, contexts, edge functions, or major components

**After removing files:**
1. Remove export from the relevant `index.ts`
2. Update `PROJECT_INDEX.md` if removing features or major components

**NEVER:**
- Create files without adding to index
- Delete files without removing from index
- Import from deep paths (always use index exports)
- Modify files without first reading the feature's index

### Requirements to Structure Mapping

| Feature Area | Primary Location | Related Files |
|--------------|------------------|---------------|
| FR1-FR5: Auth | `features/auth/` | `contexts/AuthContext.tsx` |
| FR6-FR14: Contests | `features/contests/` | `pages/admin/ContestDetailPage.tsx` |
| FR15-FR19: Participant Codes | `features/participants/` | `pages/admin/ParticipantCodesPage.tsx` |
| FR20-FR24: Judge Management | `features/auth/`, `features/categories/` | `supabase/functions/send-notification/` |
| FR25-FR37: Submissions | `features/submissions/` | `supabase/functions/generate-upload-url/` |
| FR38-FR48: Judging | `features/reviews/`, `features/rankings/` | `pages/judge/ReviewPage.tsx` |
| FR49-FR53: Admin Override | `features/reviews/`, `features/rankings/` | `pages/admin/SubmissionsPage.tsx` |
| FR54-FR60: Winners | `features/rankings/` | `pages/public/WinnersPage.tsx` |
| FR61-FR64: Notifications | `features/notifications/` | `supabase/functions/send-notification/` |

### Architectural Boundaries

**Import Rules:**

| Layer | Can Import From | Cannot Import From |
|-------|-----------------|-------------------|
| `pages/` | `features/` (via index), `components/ui/`, `contexts/`, `lib/` | Other pages directly |
| `features/*/components/` | `components/ui/`, own feature's hooks/types | Other features (use index) |
| `features/*/hooks/` | Own feature's api/types, `lib/` | Components |
| `components/ui/` | `lib/utils.ts` only | Features, pages, contexts |

**Data Flow:**

| Data Type | Managed By | Accessed Via |
|-----------|------------|--------------|
| Server data | TanStack Query | Feature hooks |
| Auth state | AuthContext | `useAuth()` |
| Participant session | ParticipantSessionContext | `useParticipantSession()` |
| Form data | React Hook Form | Component-local |

### External Integration Points

| Service | Integration File | Purpose |
|---------|------------------|---------|
| Supabase Auth | `lib/supabase.ts`, `features/auth/` | Admin/Judge authentication |
| Supabase DB | `lib/supabase.ts`, feature API files | All data operations |
| Bunny Stream | `supabase/functions/generate-upload-url/` | Video upload URLs |
| Bunny Storage | `supabase/functions/generate-upload-url/` | Photo upload URLs |
| Brevo | `supabase/functions/send-notification/` | Email notifications |
| Sentry | `lib/sentry.ts` | Error tracking |

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices work together without conflicts. React 19 + Vite 6 + TypeScript + Tailwind v4 + shadcn/ui + Supabase JS + TanStack Query form a coherent, modern stack with excellent interoperability and active maintenance.

**Pattern Consistency:**
Implementation patterns fully support architectural decisions:
- Naming conventions consistent across database (snake_case), code (camelCase), and components (PascalCase)
- Feature-based structure aligns with TanStack Query data fetching patterns
- Error handling patterns work with Sentry integration

**Structure Alignment:**
Project structure enables all architectural decisions:
- Feature folders contain all related code (components, hooks, API, types)
- Clear boundaries prevent circular dependencies
- Integration points (Edge Functions, external services) properly isolated

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**
All 64 functional requirements have architectural support:
- Authentication flows (FR1-FR5) → Supabase Auth + ParticipantSessionContext
- Contest management (FR6-FR14) → features/contests/ + status machine
- Participant codes (FR15-FR19) → merged participants table
- Judge management (FR20-FR24) → categories.judge_id + notifications
- Submissions (FR25-FR37) → features/submissions/ + Bunny integration
- Judging (FR38-FR48) → features/reviews/ + features/rankings/
- Admin overrides (FR49-FR53) → override fields in reviews/rankings
- Winners (FR54-FR60) → WinnersPage + password protection
- Notifications (FR61-FR64) → send-notification Edge Function

**Non-Functional Requirements Coverage:**
- Performance: Direct browser-to-Bunny uploads handle 100+ simultaneous uploads
- Security: RLS policies, signed URLs, anonymous judging, 120-min session timeout
- Scalability: Bunny + Supabase scale independently with usage
- Reliability: TanStack Query retry, Sentry error tracking, resumable uploads

### Implementation Readiness Validation ✅

**Decision Completeness:**
All critical architectural decisions documented with versions, rationale, and implementation guidance. No ambiguity in technology choices.

**Structure Completeness:**
Complete project structure defined with 80+ files across features, pages, components, lib, and supabase directories. All integration points specified.

**Pattern Completeness:**
Comprehensive patterns for naming, error handling, loading states, state management, and validation. Component file structure template provided.

### Gap Analysis Results

**Critical Gaps:** None

**Important Gaps (addressable in implementation):**
- Cover image upload: Extend `generate-upload-url` Edge Function
- Grace period UI logic: Implement countdown in SubmissionForm component

**Nice-to-Have (defer):**
- Keyboard shortcuts for judge review
- Bulk export format specification
- Bunny transcoding webhook handling

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped (including Bunny security)

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

**✅ LLM Discoverability**
- [x] PROJECT_INDEX.md template defined
- [x] Comprehensive index.ts file pattern established
- [x] AI Agent Discoverability Rules documented
- [x] Import rules and boundaries specified

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** HIGH — All requirements have clear architectural support, no blocking gaps identified

**Key Strengths:**
- Clean separation between admin/judge/participant experiences
- Robust file upload architecture with Bunny integration
- Strong LLM discoverability system for AI-driven development
- Comprehensive security model with RLS and signed URLs
- Feature-based structure scales well for future enhancements

**Areas for Future Enhancement:**
- Real-time collaboration features (WebSockets if needed later)
- Advanced analytics dashboard
- Bulk operations beyond code generation
- Internationalization support

### Implementation Handoff

**AI Agent Guidelines:**
1. Read `PROJECT_INDEX.md` first when starting any work
2. Follow all architectural decisions exactly as documented
3. Use implementation patterns consistently across all components
4. Import from feature index files only — never deep paths
5. Update index files immediately when adding new exports
6. Co-locate tests with source files
7. Refer to this document for all architectural questions

**First Implementation Priority:**
```bash
npm create vite@latest media-education-solutions -- --template react-ts
cd media-education-solutions
npm install tailwindcss @tailwindcss/vite
npx shadcn@latest init
npm install @supabase/supabase-js
npm install react-hook-form @hookform/resolvers zod @tanstack/react-query
npm install react-router-dom
npm install @sentry/react
```

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED
**Total Steps Completed:** 8
**Date Completed:** 2026-01-10
**Document Location:** _bmad-output/planning-artifacts/architecture.md

### Final Architecture Deliverables

**Complete Architecture Document**
- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with all files and directories
- Requirements to architecture mapping
- Validation confirming coherence and completeness

**Implementation Ready Foundation**
- 25+ architectural decisions made
- 15+ implementation patterns defined
- 8 feature modules specified
- 64 functional requirements fully supported

**AI Agent Implementation Guide**
- Technology stack with verified versions
- Consistency rules that prevent implementation conflicts
- Project structure with clear boundaries
- Integration patterns and communication standards

### Development Sequence

1. Initialize project using documented starter template
2. Set up development environment per architecture
3. Implement core architectural foundations
4. Build features following established patterns
5. Maintain consistency with documented rules

### Quality Assurance Checklist

**Architecture Coherence**
- [x] All decisions work together without conflicts
- [x] Technology choices are compatible
- [x] Patterns support the architectural decisions
- [x] Structure aligns with all choices

**Requirements Coverage**
- [x] All functional requirements are supported
- [x] All non-functional requirements are addressed
- [x] Cross-cutting concerns are handled
- [x] Integration points are defined

**Implementation Readiness**
- [x] Decisions are specific and actionable
- [x] Patterns prevent agent conflicts
- [x] Structure is complete and unambiguous
- [x] Examples are provided for clarity

### Project Success Factors

**Clear Decision Framework:**
Every technology choice was made collaboratively with clear rationale, ensuring all stakeholders understand the architectural direction.

**Consistency Guarantee:**
Implementation patterns and rules ensure that multiple AI agents will produce compatible, consistent code that works together seamlessly.

**Complete Coverage:**
All project requirements are architecturally supported, with clear mapping from business needs to technical implementation.

**Solid Foundation:**
The chosen starter template and architectural patterns provide a production-ready foundation following current best practices.

---

**Architecture Status:** READY FOR IMPLEMENTATION

**Next Phase:** Begin implementation using the architectural decisions and patterns documented herein.

**Document Maintenance:** Update this architecture when major technical decisions are made during implementation.

