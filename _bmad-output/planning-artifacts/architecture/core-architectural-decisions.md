# Core Architectural Decisions

## Data Architecture

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

## Authentication & Security

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

## API Patterns

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

## Frontend Architecture

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

## Infrastructure & Deployment

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

## Updated Initialization Sequence

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
