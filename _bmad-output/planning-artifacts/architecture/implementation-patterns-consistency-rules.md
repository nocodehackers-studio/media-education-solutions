# Implementation Patterns & Consistency Rules

## Naming Patterns

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

## Format Patterns

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

## Error Handling Patterns

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

## Loading State Patterns

| State | Meaning | UI Pattern |
|-------|---------|------------|
| `isLoading` | Initial fetch | Skeleton |
| `isFetching` | Refetch | Subtle indicator |
| `isSubmitting` | Form submit | Button spinner |
| `isUploading` | File upload | Progress bar |

## State Management Patterns

| State Type | Solution |
|------------|----------|
| Server data | TanStack Query |
| Form data | React Hook Form |
| Local UI | useState |
| Shared UI | React Context (one per concern) |

## Validation Patterns

- Zod schemas as single source of truth in `types/` folder
- Validate on blur (field) + submit (form) + server (Edge Function)

## File Patterns

- Tests co-located: `RatingScale.test.tsx` next to `RatingScale.tsx`
- Components: Named exports, props interface above component, hooks first

## Component File Structure

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

## Enforcement: All AI Agents MUST

1. Follow naming conventions exactly (snake_case DB, camelCase code, PascalCase components)
2. Import from feature index, not deep paths
3. Use standardized error codes from `lib/errorCodes.ts`
4. Use TanStack Query for all server state
5. Define Zod schemas for all forms
6. Co-locate tests with source files
7. Use named exports for components
8. Update `index.ts` when adding new exports to a feature
