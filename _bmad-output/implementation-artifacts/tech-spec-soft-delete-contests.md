# Tech Spec: Soft Delete Contests with 90-Day Retention

**Date:** 2026-02-04
**Status:** Draft

---

## Problem

1. Deleting a contest fails due to `notification_logs` FK constraint (no ON DELETE behavior)
2. No Bunny media cleanup on contest deletion -- videos/photos are orphaned, costing money
3. Hard delete is dangerous -- an admin could accidentally destroy a contest with hundreds of submissions

## Solution

Replace hard delete with a **soft-delete + 90-day retention** pattern:

- "Delete" sets contest status to `deleted` + records `deleted_at` timestamp
- Contest becomes inaccessible to everyone except admins viewing Trash
- After 90 days, a pg_cron job triggers an edge function that cleans up Bunny media and hard-deletes all DB records
- Admins can restore a contest within the 90-day window

---

## Implementation Tasks

### Task 1: Database Migration -- Soft Delete Infrastructure

**File:** `supabase/migrations/{timestamp}_add_soft_delete_contests.sql`

```sql
-- 1. Add 'deleted' to contest status CHECK constraint
ALTER TABLE public.contests DROP CONSTRAINT IF EXISTS contests_status_check;
ALTER TABLE public.contests
  ADD CONSTRAINT contests_status_check
  CHECK (status IN ('draft', 'published', 'closed', 'reviewed', 'finished', 'deleted'));

-- 2. Add deleted_at column
ALTER TABLE public.contests ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 3. Fix notification_logs FK constraints (ON DELETE SET NULL)
ALTER TABLE notification_logs
  DROP CONSTRAINT notification_logs_related_contest_id_fkey;
ALTER TABLE notification_logs
  ADD CONSTRAINT notification_logs_related_contest_id_fkey
  FOREIGN KEY (related_contest_id) REFERENCES contests(id) ON DELETE SET NULL;

ALTER TABLE notification_logs
  DROP CONSTRAINT notification_logs_related_category_id_fkey;
ALTER TABLE notification_logs
  ADD CONSTRAINT notification_logs_related_category_id_fkey
  FOREIGN KEY (related_category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- 4. Index for efficient cleanup queries
CREATE INDEX idx_contests_deleted_at ON public.contests (deleted_at)
  WHERE deleted_at IS NOT NULL;
```

**RLS note:** Existing RLS policies on contests use `role = 'admin'` checks. No RLS changes needed -- the filtering will happen at the query level in the frontend. Participants access contests via edge functions that filter by `status = 'published'`, so deleted contests are already invisible to them.

---

### Task 2: Edge Function -- Purge Deleted Contests

**File:** `supabase/functions/purge-deleted-contests/index.ts`

This edge function:
1. Queries all contests where `deleted_at < NOW() - INTERVAL '90 days'`
2. For each contest, queries all submissions to get `bunny_video_id`, `media_url` (photos), `thumbnail_url`
3. Deletes each media asset from Bunny (best-effort, following `withdraw-submission` pattern)
4. Deletes contest cover_image_url and logo_url from Bunny Storage
5. Hard-deletes the contest row (cascades everything else)

**Auth:** Service role key (called from pg_cron via `net.http_post`, not from frontend)

**Bunny deletion pattern** (from existing `withdraw-submission`):
- Videos: `DELETE https://video.bunnycdn.com/library/{LIBRARY_ID}/videos/{VIDEO_ID}`
- Photos: `DELETE https://{STORAGE_HOSTNAME}/{STORAGE_ZONE}/{path}`
- Best-effort: log errors but don't block

**Environment variables needed** (already exist from other edge functions):
- `BUNNY_STREAM_API_KEY`, `BUNNY_STREAM_LIBRARY_ID`
- `BUNNY_STORAGE_API_KEY`, `BUNNY_STORAGE_ZONE`, `BUNNY_STORAGE_HOSTNAME`

---

### Task 3: Database Migration -- pg_cron Scheduled Cleanup

**File:** `supabase/migrations/{timestamp}_add_purge_cron_job.sql`

```sql
-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily cleanup at 3:00 AM UTC
SELECT cron.schedule(
  'purge-deleted-contests',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/purge-deleted-contests',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

**Note:** `app.settings.supabase_url` and `app.settings.service_role_key` must be set in Supabase dashboard under Database Settings > Configuration. If not already set, we'll use the direct URL/key approach.

---

### Task 4: Frontend -- Soft Delete Logic

**Files to modify:**

1. **`src/features/contests/types/contest.types.ts`**
   - Add `'deleted'` to `ContestStatus` type

2. **`src/features/contests/api/contestsApi.ts`**
   - Change `delete()` method: UPDATE status to `'deleted'` and set `deleted_at = new Date().toISOString()` instead of DELETE
   - Add `restore()` method: UPDATE status to `'draft'`, set `deleted_at = null`
   - Add `listDeleted()` method: query contests where `status = 'deleted'`, ordered by `deleted_at DESC`
   - Update `list()` method: add `.neq('status', 'deleted')` filter to exclude soft-deleted contests
   - Update `getStats()`: ensure deleted contests aren't counted

3. **`src/features/contests/hooks/useDeleteContest.ts`**
   - Invalidate both `['contests']` and `['deleted-contests']` query keys on success

4. **New hook: `src/features/contests/hooks/useDeletedContests.ts`**
   - TanStack Query hook calling `contestsApi.listDeleted()`

5. **New hook: `src/features/contests/hooks/useRestoreContest.ts`**
   - Mutation calling `contestsApi.restore(id)`
   - Invalidates `['contests']` and `['deleted-contests']`

6. **`src/features/contests/components/DeleteContestButton.tsx`**
   - Update dialog text: "This contest will be moved to Trash and permanently deleted after 90 days. You can restore it from the Trash section."

7. **`src/features/contests/index.ts`**
   - Export new hooks and any new components

---

### Task 5: Frontend -- Trash Section on Contests Page

**Modify: `src/pages/admin/ContestsPage.tsx`**

Add a "Recently Deleted" section at the bottom of the existing contests page (below the active contests grid):

- Only visible when there are soft-deleted contests (hide section if empty)
- Active contests section must have `min-height: 100vh` so deleted section feels clearly separated
- Minimum `160px` top margin between the active contests grid and the deleted section
- Collapsible section with header: "Recently Deleted ({count})" + trash icon
- Each item shows: contest name, deleted date, days remaining until permanent deletion (e.g., "Permanently deleted in 73 days")
- "Restore" button per contest -- restores to `draft` status and the contest instantly appears in the active list above
- Simpler layout than the main contest cards (compact list/table row style)

**New component: `src/features/contests/components/DeletedContestsList.tsx`**

- Receives deleted contests data
- Renders compact list with restore action per item
- Shows countdown to permanent deletion

No new pages or routes needed.

---

## Execution Order

1. Task 1 -- DB migration (soft delete infra + FK fix)
2. Task 4 -- Frontend soft delete logic
3. Task 5 -- Admin Trash UI
4. Task 2 -- Edge function (purge)
5. Task 3 -- DB migration (pg_cron)

Tasks 1-3 can be tested immediately. Tasks 2-3 need the edge function deployed to Supabase.

---

## Out of Scope

- Bunny-level URL access revocation (agreed: app-level hiding only)
- Bulk delete/restore
- Admin "permanently delete now" button (can add later)
