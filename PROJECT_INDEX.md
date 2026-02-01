# Project Index - media-education-solutions

**AI AGENTS: Read this file first when working on this project.**

## Features (src/features/)

| Feature | Purpose | Key Exports |
|---------|---------|-------------|
| admin | Admin layout, navigation, breadcrumbs | AdminLayout, AdminSidebar, AdminHeader, AdminBreadcrumbs, useSidebar, useBreadcrumbs |
| auth | Admin/Judge login, session management | LoginForm, ForgotPasswordForm, authApi, loginSchema, auth.types |
| contests | Contest CRUD, status management | ContestCard, useContests, contestsApi (Planned) |
| categories | Category management within contests | CategoryCard, useCategories (Planned) |
| participants | Participant codes, session, info | ParticipantCodeEntry, useParticipantSession (Planned) |
| submissions | File uploads, submission management, admin view, admin overrides, disqualification | UploadProgress, useFileUpload, AdminSubmissionsTable, AdminSubmissionDetail, AdminReviewSection, AdminSubmissionFilters, useAdminSubmissions, OverrideFeedbackDialog, AdminCategoryRankings, useOverrideFeedback, useOverrideRankings, DisqualifyConfirmDialog, RestoreConfirmDialog, useDisqualifySubmission, useRestoreSubmission |
| reviews | Rating, feedback for submissions | RatingScale, useReviews, ReviewForm (Planned) |
| rankings | Drag-drop ranking, tier ordering | RankingDropzone, useRankings (Planned) |
| notifications | Email triggers via Brevo | useNotifications (Planned) |

## Shared Code (src/lib/)

| File | Purpose |
|------|---------|
| utils.ts | cn() helper, shared utilities |
| supabase.ts | Typed Supabase client for auth + database |
| queryClient.ts | TanStack Query client with default options |
| errorCodes.ts | ERROR_CODES constants, ERROR_MESSAGES, getErrorMessage() |
| sentry.ts | Sentry initialization for error tracking (prod only) |

## Contexts (src/contexts/)

| Context | Purpose | Status |
|---------|---------|--------|
| AuthContext, AuthProvider, useAuth | Admin/Judge authentication state | Implemented (Story 2.1) |
| ParticipantSessionContext | Participant codes + 120min timeout | Planned (Epic 4) |

## Components (src/components/)

| Component | Purpose |
|-----------|---------|
| ErrorBoundary | Sentry-integrated error boundary with fallback UI |

## UI Components (src/components/ui/)

| Component | Purpose |
|-----------|---------|
| Button | Styled button with variants |
| Card, CardHeader, etc. | Card container components |
| Input | Form input field |
| Toaster | Toast notification container (sonner) |
| toast | Toast trigger function (success, error) |
| Form, FormField, etc. | Form wrapper components (react-hook-form) |
| Label | Accessible form label |
| Skeleton | Loading placeholder animation |
| Sheet, SheetContent, etc. | Slide-out panel component (mobile sidebar) |
| Separator | Visual divider line |
| Avatar, AvatarFallback | User avatar with initials fallback |
| Breadcrumb, BreadcrumbList, etc. | Navigation breadcrumb trail |

## Pages (src/pages/)

| Route Group | Pages |
|-------------|-------|
| public/ | NotFoundPage |
| auth/ | LoginPage, ForgotPasswordPage, ResetPasswordPage |
| admin/ | DashboardPage, ContestsPage, ContestDetailPage, AdminSubmissionsPage, AdminCategoryRankingsPage |
| judge/ | JudgeDashboardPage (placeholder) |

## Router (src/router/)

| Component | Purpose |
|-----------|---------|
| AppRouter | Main router with all routes |
| ProtectedRoute | Requires authentication (any role) |
| AdminRoute | Requires admin role, redirects judges to /judge/dashboard |
| JudgeRoute | Requires judge or admin role |

## Database (supabase/)

**🚨 IMPORTANT: This project uses ONLINE Supabase (Hosted Cloud) - NOT local Docker.**

| File | Purpose |
|------|---------|
| README.md | **READ FIRST** - Migration workflow, troubleshooting, commands |
| config.toml | Supabase CLI config (linked to online project) |
| migrations/*.sql | Database migrations (timestamped) |
| migrations/00001_create_profiles.sql | Profiles table, RLS, auth trigger |
| migrations/00002_fix_rls_infinite_recursion.sql | Fixed RLS policy bug |
| migrations/00003_create_contests_tables.sql | Contests & participants tables |

**Key Commands:**
- `npx supabase migration new <name>` - Create migration
- `npx supabase db push` - Apply to online DB
- `npx supabase migration list` - Check status
- ❌ DON'T use: `supabase start`, `db reset` (local Docker only)

## Edge Functions (supabase/functions/)

Placeholder - to be added for Bunny upload signing (Epic 4)

## Key Patterns

### Import Rules
```typescript
// ✅ CORRECT - Always import from feature index
import { Component } from '@/features/feature-name';
import { Button } from '@/components/ui';

// ❌ WRONG - Never import from deep paths
import { Component } from '@/features/feature-name/components/Component';
```

### Named Exports Only
All components use named exports, never default exports.

### File Naming
- Components: PascalCase (`NotFoundPage.tsx`)
- Utilities: camelCase (`utils.ts`)
- Types: camelCase with `.types.ts` suffix

## Quick Reference

### Import Patterns
```typescript
// From lib (utilities, clients, error codes)
import { cn, supabase, queryClient, ERROR_CODES, getErrorMessage } from '@/lib';

// From features (components, hooks, types)
import { useAuth, LoginForm } from '@/features/auth';

// From UI components (core)
import { Button, Card, Input, Skeleton } from '@/components/ui';

// Toast usage
import { toast } from '@/components/ui';
toast.success('Saved!');  // Auto-dismiss 4s
toast.error('Failed', { duration: Infinity });  // Manual dismiss

// Form components
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui';
```

### State Management
| State Type | Solution | Location |
|------------|----------|----------|
| Server data | TanStack Query | Feature hooks |
| Form data | React Hook Form | Component-local |
| Auth state | React Context | `AuthContext` |
| Participant session | React Context | `ParticipantSessionContext` |
| Local UI | useState | Component-local |

## CI/CD & DevOps

| Resource | Purpose |
|----------|---------|
| vercel.json | Vercel deployment config (Vite framework, SPA rewrites) |
| .github/workflows/ci.yml | GitHub Actions: lint, type-check, build on PR/push |

### Scripts
```bash
npm run dev          # Start dev server
npm run build        # TypeScript + Vite production build
npm run lint         # ESLint check
npm run type-check   # TypeScript validation (no emit)
```

### Error Tracking
Sentry is initialized in production when `VITE_SENTRY_DSN` is set. Errors are captured automatically via ErrorBoundary.
