# Project Index - media-education-solutions

**AI AGENTS: Read this file first when working on this project.**

## Features (src/features/)

| Feature | Purpose | Status |
|---------|---------|--------|
| auth | Admin/Judge login, session management | Placeholder |
| contests | Contest CRUD, status management | Placeholder |
| categories | Category management within contests | Placeholder |
| participants | Participant codes, session, info | Placeholder |
| submissions | File uploads, submission management | Placeholder |
| reviews | Rating, feedback for submissions | Placeholder |
| rankings | Drag-drop ranking, tier ordering | Placeholder |
| notifications | Email triggers via Brevo | Placeholder |

## Shared Code (src/lib/)

| File | Purpose |
|------|---------|
| utils.ts | cn() helper, shared utilities |

## Contexts (src/contexts/)

| Context | Purpose | Status |
|---------|---------|--------|
| AuthContext | Admin/Judge authentication state | Planned (Epic 2) |
| ParticipantSessionContext | Participant codes + 120min timeout | Planned (Epic 4) |

## UI Components (src/components/ui/)

shadcn/ui primitives: Button, Card, Input (more added as needed)

## Pages (src/pages/)

| Route Group | Pages |
|-------------|-------|
| public/ | NotFoundPage |

## Edge Functions (supabase/functions/)

To be added in Story 1.2+

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
