# Project Structure & Boundaries

## Complete Project Directory Structure

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

## LLM Discoverability System

### PROJECT_INDEX.md (Root Manifest)

**Location:** Project root
**Purpose:** Master index that LLMs read FIRST before any work

```markdown
# Project Index — media-education-solutions

**AI AGENTS: Read this file first when working on this project.**

# Features (src/features/)

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

# Shared Code (src/lib/)

| File | Purpose |
|------|---------|
| supabase.ts | Supabase client initialization |
| queryClient.ts | TanStack Query client setup |
| sentry.ts | Sentry error tracking init |
| utils.ts | cn() helper, shared utilities |
| errorCodes.ts | Standardized error codes |

# Contexts (src/contexts/)

| Context | Purpose |
|---------|---------|
| AuthContext | Admin/Judge authentication state |
| ParticipantSessionContext | Participant codes + 120min timeout |

# Edge Functions (supabase/functions/)

| Function | Purpose |
|----------|---------|
| generate-upload-url | Create signed Bunny URLs for uploads |
| validate-participant | Validate contest + participant codes |
| send-notification | Send emails via Brevo |

# UI Components (src/components/ui/)

shadcn/ui primitives: Button, Card, Input, Dialog, Toast, Skeleton, Progress, Badge, Table, Tabs, DropdownMenu, Form

# Pages (src/pages/)

| Route Group | Pages |
|-------------|-------|
| admin/ | Dashboard, ContestDetail, ContestCreate, CategoryDetail, Submissions, ParticipantCodes |
| judge/ | JudgeDashboard, Review, Ranking |
| participant/ | Entry, ContestView, Submission, Feedback |
| public/ | Winners, NotFound |
```

### Comprehensive Index File Pattern

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

### Required Index Files

| Location | Must Export |
|----------|-------------|
| `features/{feature}/index.ts` | All components, hooks, API, types, schemas |
| `components/ui/index.ts` | All UI primitives |
| `lib/index.ts` | All utilities and clients |
| `contexts/index.ts` | All context providers and hooks |
| `pages/index.ts` | All page components |
| `types/index.ts` | All shared types |

## AI Agent Discoverability Rules

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

## Requirements to Structure Mapping

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

## Architectural Boundaries

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

## External Integration Points

| Service | Integration File | Purpose |
|---------|------------------|---------|
| Supabase Auth | `lib/supabase.ts`, `features/auth/` | Admin/Judge authentication |
| Supabase DB | `lib/supabase.ts`, feature API files | All data operations |
| Bunny Stream | `supabase/functions/generate-upload-url/` | Video upload URLs |
| Bunny Storage | `supabase/functions/generate-upload-url/` | Photo upload URLs |
| Brevo | `supabase/functions/send-notification/` | Email notifications |
| Sentry | `lib/sentry.ts` | Error tracking |
