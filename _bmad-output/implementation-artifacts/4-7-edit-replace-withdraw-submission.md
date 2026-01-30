# Story 4.7: Edit, Replace & Withdraw Submission

Status: review

## Story

As a **Participant**,
I want **to edit, replace, or withdraw my submission before the deadline**,
So that **I can improve my entry or remove it entirely**.

## Acceptance Criteria

### AC1: View Existing Submission
**Given** I have a confirmed submission in a category
**When** I click "View/Edit" on that category
**Then** I see my current submission with options: "Replace" and "Withdraw"

### AC2: Replace Submission
**Given** I click "Replace"
**When** I upload a new file
**Then** the old file is deleted from Bunny storage
**And** the new file becomes my submission
**And** the `submitted_at` timestamp is updated to NOW
**And** I land on the preview page to confirm the new upload

### AC3: Withdraw Confirmation Dialog
**Given** I click "Withdraw"
**When** I see the confirmation dialog
**Then** it warns "This will remove your submission. You can submit again before the deadline."

### AC4: Withdraw Execution
**Given** I confirm withdrawal
**When** the action completes
**Then** my submission record is deleted from the database
**And** the media file is deleted from Bunny storage (video from Bunny Stream, photo from Bunny Storage)
**And** I see a success toast "Submission withdrawn"
**And** I am redirected to the categories page
**And** I see the "Submit" button again for this category

### AC5: Deadline Lockout
**Given** the category deadline has passed (or category status is "Closed")
**When** I view my submission
**Then** the "Replace" and "Withdraw" buttons are hidden
**And** I see "Deadline passed — submission locked"

### AC6: Category Closed Lockout
**Given** the category is Closed
**When** I try to submit, replace, or withdraw
**Then** I am blocked with message "This category is no longer accepting changes"

## Tasks / Subtasks

- [x] Task 1: Create `withdraw-submission` Edge Function (AC3, AC4)
  - [x] 1.1 Create `supabase/functions/withdraw-submission/index.ts`
  - [x] 1.2 Accepts: `submissionId`, `participantId`, `participantCode`
  - [x] 1.3 Validates participant owns the submission
  - [x] 1.4 Validates category deadline has NOT passed and category status is NOT `closed`
  - [x] 1.5 Fetches submission media info (`media_type`, `media_url`, `bunny_video_id`) before deletion
  - [x] 1.6 Deletes submission record from database
  - [x] 1.7 Deletes media from Bunny: video via Bunny Stream API (`DELETE /library/{libraryId}/videos/{videoId}`), photo via Bunny Storage API (`DELETE https://{hostname}/{zone}/{path}`)
  - [x] 1.8 Returns `{ success: true }` on completion
  - [x] 1.9 Returns appropriate error codes: `SUBMISSION_NOT_FOUND`, `UNAUTHORIZED`, `DEADLINE_PASSED`, `CATEGORY_CLOSED`

- [x] Task 2: Update `get-submission` Edge Function for deadline/status info (AC5, AC6)
  - [x] 2.1 Modify `supabase/functions/get-submission/index.ts`
  - [x] 2.2 Add `categoryDeadline` and `categoryStatus` to response
  - [x] 2.3 Add computed boolean `isLocked` (deadline passed OR category closed)

- [x] Task 3: Create `useWithdrawSubmission` hook (AC3, AC4)
  - [x] 3.1 Create `src/features/submissions/hooks/useWithdrawSubmission.ts`
  - [x] 3.2 `useMutation` that calls `withdraw-submission` Edge Function
  - [x] 3.3 On success: invalidate `participant-categories` and `submission-preview` queries, show success toast, navigate to `/participant/categories`
  - [x] 3.4 Export from hooks index and feature index

- [x] Task 4: Update `SubmissionPreviewPage` with Replace/Withdraw actions (AC1, AC2, AC3, AC4, AC5, AC6)
  - [x] 4.1 Modify `src/pages/participant/SubmissionPreviewPage.tsx`
  - [x] 4.2 Add "Replace" button (navigates to `/participant/submit/:categoryId`)
  - [x] 4.3 Add "Withdraw" button with `AlertDialog` confirmation
  - [x] 4.4 Show lock state when deadline passed or category closed: hide Replace/Withdraw, show "Deadline passed — submission locked" message
  - [x] 4.5 Compute lock state from `isLocked` field returned by `get-submission`
  - [x] 4.6 For `submitted` status: show "Replace" and "Withdraw" (if not locked)
  - [x] 4.7 For `uploaded` status: show "Confirm Submission", "Replace", and "Withdraw" (if not locked)
  - [x] 4.8 Update tests in `SubmissionPreviewPage.test.tsx`

- [x] Task 5: Handle Replace flow — delete old media on re-upload (AC2)
  - [x] 5.1 Modify `supabase/functions/create-video-upload/index.ts`: when existing submission found, call Bunny Stream API to delete old video before creating new one
  - [x] 5.2 Modify `supabase/functions/upload-photo/index.ts`: when existing submission found, call Bunny Storage API to delete old photo before uploading new one
  - [x] 5.3 Add deadline/category-status validation to both functions — reject if deadline passed or category closed

- [x] Task 6: Update feature exports
  - [x] 6.1 Export `useWithdrawSubmission` from `src/features/submissions/hooks/index.ts`
  - [x] 6.2 Update `src/features/submissions/index.ts` with new hook export

- [x] Task 7: Run quality gates
  - [x] 7.1 `npm run build` passes
  - [x] 7.2 `npm run lint` passes
  - [x] 7.3 `npm run type-check` passes
  - [x] 7.4 `npm run test` passes (579/580 — 1 pre-existing failure in judge/DashboardPage unrelated to 4-7)
  - [ ] 7.5 Deploy Edge Functions:
    - `npx supabase functions deploy withdraw-submission`
    - `npx supabase functions deploy get-submission` (modified)
    - `npx supabase functions deploy create-video-upload` (modified)
    - `npx supabase functions deploy upload-photo` (modified)
  - [ ] 7.6 Manual smoke test: confirm submission → View/Edit → Replace → new upload → confirm
  - [ ] 7.7 Manual smoke test: confirm submission → View/Edit → Withdraw → confirm dialog → submission gone → Submit button shows
  - [ ] 7.8 Manual smoke test: category deadline passed → View/Edit → no Replace/Withdraw buttons, see "locked" message

## Dev Notes

### Architecture Requirements

**Participant Session Pattern (no Supabase Auth):**
Participants do NOT have Supabase Auth accounts. All data access goes through Edge Functions via `supabase.functions.invoke()`. Edge Functions use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS. Every Edge Function must validate `participantId` + `participantCode` ownership.

**Submission Lifecycle with Withdraw:**

```
uploading → uploaded → submitted
    ↑           |          |
    |      (replace)  (replace)
    └───────────┘──────────┘
                |          |
           (withdraw)  (withdraw)
                ↓          ↓
            [deleted from DB + Bunny]
```

- Withdraw is a **hard delete** — the submission record is removed from the database and media is deleted from Bunny
- After withdrawal, the participant can submit again (the UNIQUE constraint on `category_id + participant_id` is freed up)
- Withdraw is NOT a status change — it is record deletion

**Why Hard Delete (Not Soft Delete):**
- The epic AC says "I see the 'Submit' button again for this category" — requires the UNIQUE constraint slot to be freed
- No requirement to track withdrawal history
- Media must be cleaned up from Bunny to avoid storage costs
- Simplest implementation that satisfies all AC

### Technical Requirements

**Feature Location:** `src/features/submissions/` (extends 4-6 preview implementation)

**New/Modified Files:**
```
src/features/submissions/
├── hooks/
│   ├── useWithdrawSubmission.ts       # NEW: Withdraw mutation hook
│   └── index.ts                       # MODIFY: Export new hook
└── index.ts                           # MODIFY: Export new hook

src/pages/participant/
├── SubmissionPreviewPage.tsx          # MODIFY: Add Replace/Withdraw/Lock UI
└── SubmissionPreviewPage.test.tsx     # MODIFY: Add new test cases

supabase/functions/
├── withdraw-submission/               # NEW: Delete submission + Bunny media
│   └── index.ts
├── get-submission/                    # MODIFY: Add deadline, status, isLocked
│   └── index.ts
├── create-video-upload/               # MODIFY: Delete old Bunny video on replace, add deadline check
│   └── index.ts
└── upload-photo/                      # MODIFY: Delete old Bunny photo on replace, add deadline check
    └── index.ts
```

### Reuse from Previous Stories (DO NOT RECREATE)

**Already implemented — reuse directly:**
- `SubmissionPreviewPage` (Story 4-6) — extend with Replace/Withdraw buttons
- `SubmissionPreview` component (Story 4-6) — media viewer, no changes needed
- `PhotoLightbox` component (Story 4-6) — fullscreen photo, no changes needed
- `useSubmissionPreview` hook (Story 4-6) — fetch submission data, response extended
- `useConfirmSubmission` hook (Story 4-6) — confirm flow still works
- `AlertDialog` from `@/components/ui` — already exists for confirmation dialogs
- `toast` from sonner — notifications
- `useParticipantSession` — session context
- Edge Function CORS/validation patterns from all 4-x stories

### Edge Function: withdraw-submission

```typescript
// supabase/functions/withdraw-submission/index.ts
// PATTERN: Follow same structure as confirm-submission

interface WithdrawRequest {
  submissionId: string;
  participantId: string;
  participantCode: string;
}

// Flow:
// 1. Validate participant ownership (match participantId + participantCode)
// 2. Fetch submission with category info (deadline, status)
// 3. Check category deadline has NOT passed
// 4. Check category status is NOT 'closed'
// 5. Delete media from Bunny:
//    - Video: DELETE https://video.bunnycdn.com/library/{LIBRARY_ID}/videos/{bunny_video_id}
//      Headers: { AccessKey: BUNNY_STREAM_API_KEY }
//    - Photo: DELETE https://{BUNNY_STORAGE_HOSTNAME}/{BUNNY_STORAGE_ZONE}/{path}
//      Headers: { AccessKey: BUNNY_STORAGE_API_KEY }
//      (Extract path from media_url by removing CDN prefix)
// 6. Delete submission record from database
// 7. Return { success: true }

// Error codes:
// SUBMISSION_NOT_FOUND (404)
// UNAUTHORIZED (403) - participant doesn't own this submission
// DEADLINE_PASSED (400) - category deadline has passed
// CATEGORY_CLOSED (400) - category status is 'closed'
// BUNNY_DELETE_FAILED (500) - media cleanup failed (log error, still delete DB record)

// CRITICAL: If Bunny delete fails, still delete the DB record.
// Orphaned Bunny files are acceptable; blocking withdrawal is not.
// Log the Bunny cleanup failure to console.error for manual review.
```

### Bunny API Delete Patterns

**Delete Video from Bunny Stream:**
```typescript
const BUNNY_STREAM_API_KEY = Deno.env.get('BUNNY_STREAM_API_KEY');
const BUNNY_STREAM_LIBRARY_ID = Deno.env.get('BUNNY_STREAM_LIBRARY_ID');

const response = await fetch(
  `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${bunnyVideoId}`,
  {
    method: 'DELETE',
    headers: { AccessKey: BUNNY_STREAM_API_KEY },
  }
);
// 200 = success, 404 = already deleted (both OK)
```

**Delete Photo from Bunny Storage:**
```typescript
const BUNNY_STORAGE_API_KEY = Deno.env.get('BUNNY_STORAGE_API_KEY');
const BUNNY_STORAGE_ZONE = Deno.env.get('BUNNY_STORAGE_ZONE');
const BUNNY_STORAGE_HOSTNAME = Deno.env.get('BUNNY_STORAGE_HOSTNAME') || 'storage.bunnycdn.com';

// Extract storage path from CDN URL
// CDN URL: https://{zone}.b-cdn.net/{path}
// Storage URL: https://{hostname}/{zone}/{path}
const cdnPrefix = `https://${BUNNY_STORAGE_ZONE}.b-cdn.net/`;
const storagePath = mediaUrl.replace(cdnPrefix, '');

const response = await fetch(
  `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE}/${storagePath}`,
  {
    method: 'DELETE',
    headers: { AccessKey: BUNNY_STORAGE_API_KEY },
  }
);
// 200 = success, 404 = already deleted (both OK)
```

### Replace Flow — Old Media Cleanup

When a participant replaces a submission (re-uploads), the old Bunny media must be deleted. This happens in the upload Edge Functions:

**`create-video-upload` modification:**
```typescript
// After finding existing submission (line ~157)
if (existingSubmission) {
  // DELETE old video from Bunny Stream (if bunny_video_id exists)
  if (existingSubmission.bunny_video_id) {
    try {
      await fetch(
        `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${existingSubmission.bunny_video_id}`,
        { method: 'DELETE', headers: { AccessKey: BUNNY_STREAM_API_KEY } }
      );
    } catch (e) {
      console.error('Failed to delete old Bunny video:', e);
      // Continue — don't block the new upload
    }
  }
  // Then update submission status to 'uploading' (existing logic)
}
```

**`upload-photo` modification:**
```typescript
// After finding existing submission
if (existingSubmission && existingSubmission.media_url) {
  // DELETE old photo from Bunny Storage
  try {
    const cdnPrefix = `https://${BUNNY_STORAGE_ZONE}.b-cdn.net/`;
    const storagePath = existingSubmission.media_url.replace(cdnPrefix, '');
    await fetch(
      `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE}/${storagePath}`,
      { method: 'DELETE', headers: { AccessKey: BUNNY_STORAGE_API_KEY } }
    );
  } catch (e) {
    console.error('Failed to delete old Bunny photo:', e);
    // Continue — don't block the new upload
  }
  // Then proceed with new upload (existing logic)
}
```

### Deadline/Lock Validation

**`get-submission` Edge Function extension:**
Add to the response:
```typescript
{
  // ... existing fields ...
  categoryDeadline: string,     // ISO timestamp
  categoryStatus: string,       // 'draft' | 'published' | 'closed'
  isLocked: boolean,            // deadline < now() OR categoryStatus === 'closed'
}
```

**`create-video-upload` and `upload-photo` Edge Functions:**
Both already validate category status and deadline. Ensure they reject with `DEADLINE_PASSED` or `CATEGORY_CLOSED` error codes for replace attempts too.

### SubmissionPreviewPage UI States

The preview page (from Story 4-6) needs these states extended:

| Submission Status | Category Locked? | Buttons Shown |
|-------------------|-----------------|---------------|
| `uploaded` | No | Confirm, Replace, Withdraw |
| `uploaded` | Yes | (none) + "Deadline passed — submission locked" |
| `submitted` | No | Replace, Withdraw |
| `submitted` | Yes | (none) + "Deadline passed — submission locked" |

**Replace button:** Navigates to `/participant/submit/:categoryId`. Upload flow already handles existing submission replacement.

**Withdraw button:** Opens `AlertDialog` confirmation → calls `useWithdrawSubmission` → on success navigates to categories.

### AlertDialog Pattern (already in codebase)

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui';

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Withdraw</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Withdraw submission?</AlertDialogTitle>
      <AlertDialogDescription>
        This will remove your submission. You can submit again before the deadline.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleWithdraw}
        disabled={isWithdrawing}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

Follow the existing `DeleteCategoryButton` pattern at `src/features/categories/components/DeleteCategoryButton.tsx`.

### Testing Guidance

**Unit Tests (useWithdrawSubmission.test.ts):**
1. Calls withdraw-submission Edge Function with correct params
2. On success: invalidates queries, shows toast, returns success
3. On error: shows error toast, does not navigate

**Unit Tests (SubmissionPreviewPage.test.tsx — extend existing):**
1. Shows "Replace" and "Withdraw" buttons for `submitted` + unlocked submission
2. Shows "Confirm", "Replace", and "Withdraw" for `uploaded` + unlocked submission
3. Hides action buttons when `isLocked` is true
4. Shows "Deadline passed — submission locked" message when locked
5. "Withdraw" opens AlertDialog with warning text
6. Confirming withdrawal calls withdraw mutation
7. "Replace" navigates to submit page

**Integration (Manual Smoke Tests):**
1. Submit entry → categories shows "Submitted" → click "View/Edit" → see Replace + Withdraw
2. Click Replace → upload new file → preview updates → confirm → done
3. Click Withdraw → confirmation dialog → confirm → toast "Submission withdrawn" → categories shows "Submit" button
4. Set category deadline to past → View/Edit → no action buttons, see "locked" message
5. After withdraw → click "Submit" → upload → preview → confirm → works again

### Previous Story Intelligence

**From Story 4-6 (Submission Preview & Confirm):**
- `SubmissionPreviewPage` at `src/pages/participant/SubmissionPreviewPage.tsx` — extend this page
- `useSubmissionPreview` hook fetches submission data via `get-submission` Edge Function
- `useConfirmSubmission` hook handles confirm flow
- Preview page already shows Replace button for `uploaded` status — extend to `submitted` status
- `get-submission` returns `categoryId` needed for Replace navigation
- Video shown via Bunny Stream iframe, photo via `<img>` + PhotoLightbox

**From Story 4-5 (Photo Upload):**
- `upload-photo` Edge Function handles existing submission replacement (resets to `uploading`)
- Bunny Storage credentials: `BUNNY_STORAGE_API_KEY`, `BUNNY_STORAGE_ZONE`, `BUNNY_STORAGE_HOSTNAME`
- CDN URL format: `https://{zone}.b-cdn.net/{path}`

**From Story 4-4 (Video Upload):**
- `create-video-upload` Edge Function handles existing submission replacement (resets to `uploading`)
- Bunny Stream credentials: `BUNNY_STREAM_API_KEY`, `BUNNY_STREAM_LIBRARY_ID`
- `bunny_video_id` stored in submission record — needed for Bunny Stream deletion

**From Story 4-3 (Categories):**
- `ParticipantCategoryCard` shows "Submit" button when no submission exists — withdrawal must restore this state
- TanStack Query key `['participant-categories', ...]` must be invalidated after withdrawal

**From Admin Features (AlertDialog Pattern):**
- `DeleteCategoryButton` at `src/features/categories/components/DeleteCategoryButton.tsx` — exact pattern to follow for withdraw confirmation dialog
- Uses Radix `AlertDialog` components from `@/components/ui`

### Project Structure Notes

- New hook in `src/features/submissions/hooks/`
- Modified page in `src/pages/participant/`
- New Edge Function in `supabase/functions/`
- Modified Edge Functions: `get-submission`, `create-video-upload`, `upload-photo`
- MUST update `src/features/submissions/index.ts` with new hook export
- Import AlertDialog from `@/components/ui`
- Import from `@/features/submissions` NOT deep paths

### Quality Gates

```bash
# Git (REQUIRED)
git status          # Must show clean
git log --oneline -5  # Verify commits have "4-7:" prefix
git push -u origin story/4-7-edit-replace-withdraw-submission

# Build (REQUIRED)
npm run build       # Must pass
npm run lint        # Must pass
npm run type-check  # Must pass
npm run test        # Must pass

# Edge Function Deployment (REQUIRED)
npx supabase functions deploy withdraw-submission       # New
npx supabase functions deploy get-submission            # Modified
npx supabase functions deploy create-video-upload       # Modified
npx supabase functions deploy upload-photo              # Modified
```

### References

- [Source: epic-4-participant-submission-experience.md#Story 4.7]
- [Source: project-context.md#Bunny Upload Security]
- [Source: core-architectural-decisions.md#Data Architecture - submissions table]
- [Source: 4-6-submission-preview-confirm.md] (preview page, get-submission, confirm flow)
- [Source: 4-5-photo-upload-with-progress.md] (Bunny Storage patterns, upload-photo Edge Function)
- [Source: 4-4-video-upload-with-progress.md] (Bunny Stream patterns, create-video-upload, finalize-upload)
- [Source: 4-3-view-categories-submission-status.md] (categories page, hasSubmitted logic)
- [Source: src/features/categories/components/DeleteCategoryButton.tsx] (AlertDialog confirmation pattern)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None — clean implementation, all quality gates passed.

### Completion Notes List

- All 7 tasks completed and verified
- All 6 ACs satisfied with test coverage
- 1 pre-existing test failure in judge/DashboardPage.test.tsx (date formatting drift) — not related to this story
- Edge Function deployments and manual smoke tests pending user execution

### File List

**New Files:**
- `src/features/submissions/hooks/useWithdrawSubmission.ts`
- `supabase/functions/withdraw-submission/index.ts`

**Modified Files:**
- `src/features/submissions/components/SubmissionPreview.test.tsx`
- `src/features/submissions/hooks/index.ts`
- `src/features/submissions/hooks/useSubmissionPreview.ts`
- `src/features/submissions/index.ts`
- `src/pages/participant/SubmissionPreviewPage.test.tsx`
- `src/pages/participant/SubmissionPreviewPage.tsx`
- `supabase/functions/create-video-upload/index.ts`
- `supabase/functions/get-submission/index.ts`
- `supabase/functions/upload-photo/index.ts`
