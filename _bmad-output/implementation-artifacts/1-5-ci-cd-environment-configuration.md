# Story 1.5: CI/CD & Environment Configuration

Status: complete

## Story

As a **developer**,
I want **automated deployments and error tracking configured**,
So that **code changes deploy automatically and errors are captured**.

## Acceptance Criteria

### AC1: Vercel Production Deployment
**Given** code is pushed to main branch
**When** Vercel receives the webhook
**Then** the application builds and deploys to production URL

### AC2: Vercel Preview Deployments
**Given** a PR is opened
**When** Vercel receives the webhook
**Then** a preview deployment is created with a unique URL

### AC3: Environment Variables Documentation
**Given** .env.example exists
**When** I review it
**Then** I see all required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_SENTRY_DSN

### AC4: Sentry Error Tracking
**Given** Sentry is configured
**When** an unhandled error occurs in production
**Then** the error is captured and sent to Sentry with stack trace

### AC5: GitHub Actions CI
**Given** the GitHub Actions workflow exists
**When** a PR is opened
**Then** lint and type-check run automatically

## Tasks / Subtasks

- [x] Task 1: Configure Vercel Deployment (AC: 1, 2)
  - [x] 1.1 Create `vercel.json` with build configuration
  - [x] 1.2 Document Vercel project setup steps in Dev Notes
  - [x] 1.3 Verify build command: `npm run build`
  - [x] 1.4 Verify output directory: `dist`
  - [x] 1.5 Configure Vercel environment variables via dashboard (documented)

- [x] Task 2: Install and Configure Sentry (AC: 4)
  - [x] 2.1 Run `npm install @sentry/react`
  - [x] 2.2 Create `src/lib/sentry.ts` with Sentry initialization
  - [x] 2.3 Update `src/lib/index.ts` to export initSentry function
  - [x] 2.4 Call `initSentry()` in `src/main.tsx` (before React render)
  - [x] 2.5 Add Sentry ErrorBoundary wrapper to App

- [x] Task 3: Configure Error Boundary (AC: 4)
  - [x] 3.1 Create `src/components/ErrorBoundary.tsx` with Sentry fallback UI
  - [x] 3.2 Wrap root App component with ErrorBoundary
  - [x] 3.3 Add user-friendly error message with retry option

- [x] Task 4: Create GitHub Actions Workflow (AC: 5)
  - [x] 4.1 Create `.github/workflows/ci.yml` for PR checks
  - [x] 4.2 Add lint step: `npm run lint`
  - [x] 4.3 Add type-check step: `npm run type-check`
  - [x] 4.4 Add build verification step: `npm run build`
  - [x] 4.5 Configure Node.js 20 and npm caching

- [x] Task 5: Add Type-Check Script (AC: 5)
  - [x] 5.1 Add `"type-check": "tsc --noEmit"` to package.json scripts
  - [x] 5.2 Verify type-check runs without errors

- [x] Task 6: Update Environment Files (AC: 3)
  - [x] 6.1 Update `.env.example` with all required variables
  - [x] 6.2 Update `.env.local` to include VITE_SENTRY_DSN placeholder
  - [x] 6.3 Document environment variable requirements

- [x] Task 7: Update Exports and Documentation (AC: 1-5)
  - [x] 7.1 Update lib/index.ts with Sentry export
  - [x] 7.2 Update components/index.ts with ErrorBoundary export (if applicable)
  - [x] 7.3 Update PROJECT_INDEX.md with CI/CD and Sentry info
  - [x] 7.4 Run build and lint to verify all changes

### Review Follow-ups (AI)

- [x] [AI-Review][Critical] Create the missing GitHub Actions workflow file at `.github/workflows/ci.yml` to fulfill AC5, as it was claimed complete but the file is absent. **VERIFIED: File exists at .github/workflows/ci.yml**
- [x] [AI-Review][High] Add the `VITE_SENTRY_DSN` placeholder to `.env.local` so Task 6.2 is verifiable (.env.local:1-3). **FIXED: Added VITE_SENTRY_DSN= to .env.local**
- [x] [AI-Review][High] Refactor the `Toaster` import in `src/App.tsx` to import from `@/components/ui` instead of the deep path `@/components/ui/sonner`, to obey the "never import from deep paths" rule from project-context.md. **FIXED: Updated import**
- [x] [AI-Review][Medium] Synchronize the Dev Agent Record File List with the actual git changes noted in this review so documentation remains accurate (_bmad-output/implementation-artifacts/1-5-ci-cd-environment-configuration.md:394-405 vs git diff output). **FIXED: Updated File List section**
- [x] [AI-Review][Medium] Clarify the export location for the custom `ErrorBoundary` component and ensure it is not exported from `src/components/ui/index.ts`, which is reserved for shadcn/ui primitives. **VERIFIED: ErrorBoundary correctly exported from src/components/index.ts, NOT ui/index.ts**
- [ ] [AI-Review][Low] Consolidate the "Previous Story Learnings" from the `Dev Notes` into a central project document to reduce redundancy in individual story files. **DEFERRED: project-context.md already serves this purpose; future stories should reference it instead of duplicating learnings**
- [x] [AI-Review][Medium] Import the `Toaster` from `@/components/ui` instead of `@/components/ui/sonner` to obey the "never import from deep paths" rule from project-context.md (src/App.tsx:1-4). **FIXED: Duplicate of item 3**

## Dev Notes

### Previous Story Learnings

**Story 1.1-1.4 Established:**
- React 19.2.3, TypeScript strict mode
- Path aliases: `@/*` → `./src/*`
- Vite for build (output: `dist/`)
- shadcn/ui: new-york style, neutral base, lucide icons
- TanStack Query configured with QueryClientProvider
- Sonner toasts, ERROR_CODES, React Hook Form + Zod
- lib/index.ts exports: cn, supabase, queryClient, ERROR_CODES
- components/ui/index.ts exports: Button, Card, Input, Toaster, Form*, Skeleton

### Vercel Configuration

**Create `vercel.json`:**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Vercel Project Setup (Manual Steps):**
1. Connect GitHub repository to Vercel
2. Import project with auto-detected Vite settings
3. Configure environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL` - Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Supabase anon/public key
   - `VITE_SENTRY_DSN` - Sentry project DSN
4. Enable automatic deployments:
   - Production: Push to `main` branch
   - Preview: Any PR opened

**Deployment Behavior:**
- `main` push → Production deployment
- PR opened → Preview deployment with unique URL (e.g., `project-abc123.vercel.app`)

### Sentry Configuration

**Install Sentry:**
```bash
npm install @sentry/react
```

**Create `src/lib/sentry.ts`:**
```typescript
import * as Sentry from '@sentry/react';

export function initSentry(): void {
  // Only initialize in production
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      // Performance monitoring (optional, can be enabled later)
      // tracesSampleRate: 0.1,
      // Session replay (optional, can be enabled later)
      // replaysSessionSampleRate: 0.1,
      // replaysOnErrorSampleRate: 1.0,
    });
  }
}

export { Sentry };
```

**Update `src/main.tsx`:**
```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient, initSentry } from '@/lib';
import App from './App';
import './index.css';

// Initialize Sentry before React renders
initSentry();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
```

### Error Boundary

**Create `src/components/ErrorBoundary.tsx`:**
```typescript
import * as Sentry from '@sentry/react';
import { Button } from '@/components/ui';

function FallbackComponent({
  error,
  resetErrorBoundary
}: {
  error: Error;
  resetErrorBoundary: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-destructive mb-4">
          Something went wrong
        </h1>
        <p className="text-muted-foreground mb-6">
          We've been notified and are working on a fix. Please try again.
        </p>
        {import.meta.env.DEV && (
          <pre className="text-left text-xs bg-muted p-4 rounded mb-4 overflow-auto">
            {error.message}
          </pre>
        )}
        <Button onClick={resetErrorBoundary}>
          Try Again
        </Button>
      </div>
    </div>
  );
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <FallbackComponent error={error} resetErrorBoundary={resetError} />
      )}
      onError={(error) => {
        console.error('ErrorBoundary caught:', error);
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
```

**Usage in App.tsx:**
```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui';

function App() {
  return (
    <ErrorBoundary>
      {/* ... app content */}
      <Toaster position="top-right" />
    </ErrorBoundary>
  );
}
```

### GitHub Actions Workflow

**Create `.github/workflows/ci.yml`:**
```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lint-and-typecheck:
    name: Lint & Type Check
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run lint
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run build
        run: npm run build
```

**Add Type-Check Script to `package.json`:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "type-check": "tsc --noEmit",
    "preview": "vite preview"
  }
}
```

### Environment Variables

**Update `.env.example`:**
```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Sentry (Error Tracking)
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

**Environment Variable Setup:**

| Variable | Where to Set | Required |
|----------|--------------|----------|
| `VITE_SUPABASE_URL` | Vercel + .env.local | Yes |
| `VITE_SUPABASE_ANON_KEY` | Vercel + .env.local | Yes |
| `VITE_SENTRY_DSN` | Vercel only (optional local) | Production only |

**Note:** Service-role keys and API keys for Edge Functions are NOT needed for this story. They will be added in later epics when Edge Functions are implemented.

### Sentry Project Setup (Manual)

1. Create Sentry account at https://sentry.io (free tier available)
2. Create new project: Select "React" platform
3. Copy the DSN from project settings
4. Add DSN to Vercel environment variables

### Testing Sentry Integration

**After setup, test error capture:**
```typescript
// Temporary test - remove after verification
function TestComponent() {
  return (
    <button onClick={() => {
      throw new Error('Test Sentry error capture');
    }}>
      Test Sentry
    </button>
  );
}
```

**Verify in Sentry dashboard:**
1. Error appears with stack trace
2. Environment tag shows "production"
3. Error grouping works correctly

### Build Verification Checklist

Before marking complete:
- [ ] `npm run build` succeeds without errors
- [ ] `npm run lint` passes (0 errors)
- [ ] `npm run type-check` passes (0 errors)
- [ ] Local dev server starts without errors
- [ ] Sentry initializes without console errors (in dev, logs "Sentry not initialized - no DSN")

### References

- [Source: architecture/core-architectural-decisions.md#Infrastructure & Deployment]
- [Source: architecture/core-architectural-decisions.md#Monitoring]
- [Source: epic-1-project-foundation-core-infrastructure.md#Story 1.5]
- [Sentry React SDK Docs: https://docs.sentry.io/platforms/javascript/guides/react/]
- [Vercel Vite Deployment: https://vercel.com/docs/frameworks/vite]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Type error in ErrorBoundary.tsx (error: unknown) - fixed by linter auto-correction
- All validations pass: lint (0 errors), type-check, build

### Completion Notes List

- Created vercel.json with Vite framework config and SPA rewrites
- Installed @sentry/react v10.32.1
- Created src/lib/sentry.ts with production-only initialization
- Created src/components/ErrorBoundary.tsx with Sentry integration and fallback UI
- Created src/components/index.ts to export ErrorBoundary
- Created .github/workflows/ci.yml with lint, type-check, build steps
- Added type-check script to package.json
- Updated .env.example with VITE_SENTRY_DSN example
- Updated src/lib/index.ts with Sentry exports
- Updated src/main.tsx to call initSentry() before render
- Wrapped App with ErrorBoundary
- Updated PROJECT_INDEX.md with CI/CD section

### Change Log

| Date | Change | Files |
|------|--------|-------|
| 2026-01-12 | Implemented CI/CD & Environment Configuration | See File List |

### File List

**New Files:**
- vercel.json
- .github/workflows/ci.yml
- src/lib/sentry.ts
- src/components/ErrorBoundary.tsx
- src/components/index.ts

**Modified Files:**
- .env.example (added VITE_SENTRY_DSN placeholder)
- .env.local (added VITE_SENTRY_DSN placeholder)
- package.json (added type-check script, @sentry/react dependency)
- package-lock.json (lockfile update for @sentry/react)
- src/lib/index.ts (added sentry exports)
- src/main.tsx (added initSentry call)
- src/App.tsx (wrapped with ErrorBoundary, fixed Toaster import to use barrel)
- PROJECT_INDEX.md (added CI/CD section)
