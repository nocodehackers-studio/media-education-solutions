# Media Education Solutions

Contest management platform for media contests with admin, judge, and participant workflows.

---

## 🚨 CRITICAL: Database Setup

**This project uses ONLINE Supabase (Hosted Cloud) - NOT local Docker.**

### Why Online Supabase?

- ✅ No Docker Desktop required
- ✅ Simpler setup for development
- ✅ Shared database across team members
- ✅ Automatic backups and scaling
- ❌ Do NOT use `npx supabase start` (local Docker)
- ❌ Do NOT use `npx supabase db reset` (local only)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd media-education-solutions
   npm install
   ```

2. **Get Supabase credentials** from the project owner or Supabase dashboard:
   - Project URL: `https://cyslxhojwlhbeabgvngv.supabase.co`
   - Anon Key: (see `.env` file or ask team)

3. **Create `.env` file** (if not already present):
   ```env
   VITE_SUPABASE_URL=https://cyslxhojwlhbeabgvngv.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

---

## 📊 Database Migrations

### Applying Migrations to Online Supabase

**When you create a new migration:**

```bash
# 1. Create timestamped migration file
npx supabase migration new <description>

# 2. Write your SQL in the generated file
# supabase/migrations/YYYYMMDDHHMMSS_<description>.sql

# 3. Push to online database
npx supabase db push

# If there are conflicts, you may need:
npx supabase db push --include-all
```

### Migration History Sync

If you see "Remote migration versions not found" error:

```bash
# List migrations to see status
npx supabase migration list

# Repair history if needed (replace timestamp with actual)
npx supabase migration repair --status applied <timestamp>
```

### 🚫 What NOT to Do

- ❌ Don't run `npx supabase start` - This starts local Docker (not used)
- ❌ Don't run `npx supabase db reset` - This affects local Docker only
- ❌ Don't use local Docker for this project
- ✅ Always use `npx supabase db push` to apply migrations

---

## 🛠️ Development Scripts

```bash
npm run dev          # Start dev server (Vite)
npm run build        # Production build
npm run lint         # ESLint check
npm run type-check   # TypeScript validation
npm run test         # Run Vitest tests
```

---

## 📁 Project Structure

```
src/
├── features/          # Feature modules (contests, auth, etc.)
│   └── <feature>/
│       ├── api/       # Supabase API calls
│       ├── components/ # Feature-specific components
│       ├── hooks/     # TanStack Query hooks
│       ├── types/     # TypeScript types & Zod schemas
│       ├── utils/     # Utilities
│       └── index.ts   # Public exports (REQUIRED)
├── components/        # Shared components
│   └── ui/           # shadcn/ui components
├── contexts/         # React contexts (Auth, etc.)
├── pages/            # Route pages
├── router/           # React Router config
├── lib/              # Shared utilities, clients
└── types/            # Global types (supabase.ts)

supabase/
├── migrations/       # Database migrations (timestamped .sql files)
└── config.toml       # Supabase CLI config (for online project)
```

---

## 🧭 Key Patterns

### Import Rules (MANDATORY)

```typescript
// ✅ CORRECT - Always import from feature index
import { Component, useHook } from '@/features/feature-name';

// ❌ WRONG - Never import from deep paths
import { Component } from '@/features/feature-name/components/Component';
```

### State Management

| State Type | Solution | Location |
|------------|----------|----------|
| Server data | TanStack Query | Feature hooks (`useContests()`) |
| Form data | React Hook Form + Zod | Component-local |
| Auth state | React Context | `useAuth()` from `AuthContext` |
| Local UI | `useState` | Component-local |

### Database Access

- Use typed Supabase client: `import { supabase } from '@/lib/supabase'`
- Transform snake_case (DB) → camelCase (app) in API layer
- Row Level Security (RLS) enabled on all tables
- Admin-only policies for sensitive operations

---

## 🧪 Testing

- **Unit tests**: Co-located with source files (`*.test.ts`, `*.test.tsx`)
- **Test runner**: Vitest
- **Coverage**: Run `npm run test` before committing

---

## 📚 Documentation

- **PROJECT_INDEX.md** - High-level project overview
- **_bmad-output/project-context.md** - Critical implementation rules
- **_bmad-output/implementation-artifacts/** - User stories, epics, architecture docs

---

## 🤝 Contributing

1. **Branch naming**: `story/<story-id>-<description>` (e.g., `story/2-3-create-contest`)
2. **Commit format**: `<story-id>: <action> <what changed>` (e.g., `2-3: Add contest creation form`)
3. **Pre-commit checks**: Ensure `npm run build`, `npm run lint`, `npm run type-check` all pass
4. **Story workflow**: Create branch → Implement → Tests pass → Push → Code review

---

## 🔗 Tech Stack

- **Framework**: React 19 + Vite 6
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Backend**: Supabase (Auth + PostgreSQL + Edge Functions)
- **Server State**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Routing**: React Router v6
- **Testing**: Vitest + React Testing Library
- **Error Tracking**: Sentry

---

## ⚠️ Important Notes

1. **Supabase is ONLINE ONLY** - No local Docker setup
2. **Always import from feature index** - Never use deep paths
3. **Never use default exports** - Named exports only
4. **Explicit React imports** - `import { useState } from 'react'`, not `React.useState`
5. **RLS is enforced** - All database tables have Row Level Security

---

## 📞 Support

For questions or issues:
- Check `_bmad-output/project-context.md` for implementation rules
- Review story files in `_bmad-output/implementation-artifacts/`
- Contact project maintainers

---

**Last Updated**: 2026-01-12
