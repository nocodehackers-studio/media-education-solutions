# Supabase Database - Online Setup

**🚨 CRITICAL: This project uses ONLINE Supabase (Hosted Cloud) - NOT local Docker.**

---

## Database Configuration

**Project Details:**
- **URL**: https://cyslxhojwlhbeabgvngv.supabase.co
- **Environment**: Online (Hosted by Supabase)
- **Project ID**: cyslxhojwlhbeabgvngv

**Environment Variables:**
```env
VITE_SUPABASE_URL=https://cyslxhojwlhbeabgvngv.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

---

## Migration Workflow

### Creating a New Migration

```bash
# 1. Generate timestamped migration file
npx supabase migration new <description>

# Example:
npx supabase migration new add_categories_table
# Creates: migrations/20260112123456_add_categories_table.sql
```

### Writing Migration SQL

```sql
-- migrations/20260112123456_add_categories_table.sql

-- Create table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_categories_name ON public.categories(name);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Admins can manage categories"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

### Applying Migrations

```bash
# 2. Push migration to online database
npx supabase db push

# If you see conflicts or need to include older migrations:
npx supabase db push --include-all

# 3. Verify migration was applied
npx supabase migration list
```

**Expected Output:**
```
Local          | Remote         | Time (UTC)
---------------|----------------|--------------------
00001          | 00001          | 00001
00002          | 00002          | 00002
00003          | 00003          | 00003
20260112123456 | 20260112123456 | 2026-01-12 12:34:56
```

---

## Troubleshooting

### "Remote migration versions not found"

This happens when local and remote migration history is out of sync.

**Solution:**

```bash
# 1. Check current status
npx supabase migration list

# 2. If you see a remote migration not in local, create placeholder
touch supabase/migrations/<timestamp>_placeholder.sql
echo "-- Placeholder for remote migration" > supabase/migrations/<timestamp>_placeholder.sql

# 3. Repair migration history
npx supabase migration repair --status applied <timestamp>

# 4. Try push again
npx supabase db push
```

### "relation already exists"

This happens when trying to apply a migration that already ran partially.

**Solution:**

Either:
1. Edit the migration to use `IF NOT EXISTS` clauses
2. Or manually verify what's already applied and remove those parts

**Example:**
```sql
-- ✅ Safe - won't fail if already exists
CREATE TABLE IF NOT EXISTS public.table_name (...);
CREATE INDEX IF NOT EXISTS idx_name ON public.table_name(column);

-- ❌ Will fail if exists
CREATE TABLE public.table_name (...);
CREATE INDEX idx_name ON public.table_name(column);
```

### Verifying Tables Exist

**Via CLI:**
```bash
# Use psql to connect (requires database password)
npx supabase db inspect
```

**Via JavaScript:**
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://cyslxhojwlhbeabgvngv.supabase.co',
  '<anon-key>'
)

// Try to query the table
const { data, error } = await supabase
  .from('table_name')
  .select('count')
  .limit(1)

if (error) {
  console.log('❌ Table not found:', error.message)
} else {
  console.log('✅ Table exists')
}
```

---

## Migration Best Practices

### 1. Use IF NOT EXISTS

Always use `IF NOT EXISTS` to make migrations idempotent:

```sql
CREATE TABLE IF NOT EXISTS public.table_name (...);
CREATE INDEX IF NOT EXISTS idx_name ON public.table_name(column);
```

### 2. Include Descriptive Comments

```sql
-- Migration: Add categories table
-- Story: 2-4-category-management
-- Date: 2026-01-12
```

### 3. Enable RLS Immediately

```sql
-- Create table first
CREATE TABLE IF NOT EXISTS public.table_name (...);

-- Then immediately enable RLS
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- Then add policies
CREATE POLICY "policy_name" ON public.table_name ...;
```

### 4. Test Migrations

After applying, test that:
- Tables exist
- RLS policies work correctly
- Indexes are created
- Data can be inserted/queried as expected

### 5. Commit Migrations with Code

Always commit migration files together with the code that uses them:

```bash
git add supabase/migrations/20260112123456_*.sql
git add src/features/categories/  # Code that uses the new table
git commit -m "2-4: Add categories table and management UI"
```

---

## 🚫 What NOT to Do

| ❌ Don't Do This | ✅ Do This Instead |
|------------------|-------------------|
| `npx supabase start` | `npx supabase db push` |
| `npx supabase db reset` | Apply migrations via `db push` |
| `npx supabase stop` | No stop needed (online) |
| Use Docker Desktop | Use online Supabase directly |
| Manual SQL in dashboard | Create migration file + `db push` |
| Skip migration files | Always create timestamped migrations |

---

## Current Migration Status

```bash
# Check current status anytime
npx supabase migration list
```

**Applied Migrations:**
- `00001_create_profiles.sql` - Profiles table with RLS and auth trigger
- `00002_fix_rls_infinite_recursion.sql` - Fixed RLS policy recursion bug
- `00003_create_contests_tables.sql` - Contests and participants tables
- `20260111221752` - Remote migration (placeholder synced)

---

## Database Schema Reference

See `src/types/supabase.ts` for TypeScript types that match the database schema.

**Update types after migrations:**
```typescript
// Add new tables to Database type in src/types/supabase.ts
export type Database = {
  public: {
    Tables: {
      profiles: { ... },
      contests: { ... },
      participants: { ... },
      // Add new tables here
    }
  }
}
```

---

## Support

- **Supabase Dashboard**: https://supabase.com/dashboard/project/cyslxhojwlhbeabgvngv
- **Documentation**: https://supabase.com/docs
- **Migration Docs**: https://supabase.com/docs/guides/cli/managing-environments

---

**Last Updated**: 2026-01-12
