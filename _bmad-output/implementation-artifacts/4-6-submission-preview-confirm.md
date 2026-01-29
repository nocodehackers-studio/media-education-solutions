# Story 4.6: Submission Preview & Confirm

Status: done

## Story

As a **Participant**,
I want **to preview my uploaded submission before final confirmation**,
So that **I can verify it's correct before committing my entry**.

## Acceptance Criteria

### AC1: Preview Page After Upload
**Given** my upload completes (video or photo)
**When** I land on the preview page
**Then** I see my uploaded media displayed (video player or image)
**And** I see "Confirm Submission" and "Replace" buttons

### AC2: Video Preview
**Given** I am previewing a video submission
**When** I view the preview
**Then** the video plays in an embedded Bunny Stream player (iframe)
**And** I can play/pause and scrub through it

### AC3: Photo Preview
**Given** I am previewing a photo submission
**When** I view the preview
**Then** the image displays at a reasonable size
**And** I can click to view full-screen (lightbox overlay with dark background, Esc or click-outside to close)

### AC4: Confirm Submission
**Given** I click "Confirm Submission"
**When** the submission is confirmed
**Then** the submission status changes from `uploaded` to `submitted`
**And** I see a success toast "Your submission has been received!"
**And** I am redirected to the categories view

### AC5: Replace Submission
**Given** I click "Replace"
**When** I choose a new file
**Then** I go through the upload flow again (navigate to `/participant/submit/:categoryId`)
**And** the preview updates with the new file after re-upload

### AC6: Navigate Away Without Confirming
**Given** I navigate away without confirming
**When** I return to this category later
**Then** I see my pending upload (status=`uploaded`) and can still confirm or replace
**And** the categories page shows "Pending" badge (not "Submitted") for unconfirmed uploads

## Tasks / Subtasks

- [ ] Task 1: Add `uploaded` status to submission lifecycle (AC4, AC6)
  - [ ] 1.1 Add `uploaded` to `SubmissionStatus` type in `submission.types.ts`
  - [ ] 1.2 Update `finalize-upload` Edge Function: change status from `submitted` to `uploaded`
  - [ ] 1.3 Update `upload-photo` Edge Function: change final status from `submitted` to `uploaded`
  - [ ] 1.4 Update `get-participant-categories` Edge Function: treat both `uploaded` and `submitted` as having a submission, but differentiate in response (add `submissionStatus` field)
  - [ ] 1.5 Update `ParticipantCategoryCard` to show "Pending" badge for `uploaded` and "Submitted" badge for `submitted`

- [ ] Task 2: Create `get-submission` Edge Function (AC1, AC2, AC3)
  - [ ] 2.1 Create `supabase/functions/get-submission/index.ts`
  - [ ] 2.2 Accepts: `submissionId`, `participantId`, `participantCode`
  - [ ] 2.3 Validates participant owns the submission
  - [ ] 2.4 Returns: submission fields including `id`, `mediaType`, `mediaUrl`, `bunnyVideoId`, `thumbnailUrl`, `status`, `submittedAt`, plus `categoryName` and `categoryType`
  - [ ] 2.5 For video: also return `libraryId` from env for constructing embed URL

- [ ] Task 3: Create `confirm-submission` Edge Function (AC4)
  - [ ] 3.1 Create `supabase/functions/confirm-submission/index.ts`
  - [ ] 3.2 Accepts: `submissionId`, `participantId`, `participantCode`
  - [ ] 3.3 Validates participant owns the submission and status is `uploaded`
  - [ ] 3.4 Updates submission status to `submitted`
  - [ ] 3.5 Returns success response

- [ ] Task 4: Create `useSubmissionPreview` hook (AC1)
  - [ ] 4.1 Create `src/features/submissions/hooks/useSubmissionPreview.ts`
  - [ ] 4.2 TanStack Query hook that calls `get-submission` Edge Function
  - [ ] 4.3 Returns typed submission data with loading/error states
  - [ ] 4.4 Export from hooks index and feature index

- [ ] Task 5: Create `useConfirmSubmission` hook (AC4)
  - [ ] 5.1 Create `src/features/submissions/hooks/useConfirmSubmission.ts`
  - [ ] 5.2 Uses `useMutation` to call `confirm-submission` Edge Function
  - [ ] 5.3 On success: invalidates relevant queries, shows success toast, navigates to categories
  - [ ] 5.4 Export from hooks index and feature index

- [ ] Task 6: Create `SubmissionPreview` component (AC1, AC2, AC3)
  - [ ] 6.1 Create `src/features/submissions/components/SubmissionPreview.tsx`
  - [ ] 6.2 Renders Bunny Stream iframe for video submissions
  - [ ] 6.3 Renders image with click-to-expand fullscreen for photo submissions
  - [ ] 6.4 Export from components index and feature index
  - [ ] 6.5 Create `SubmissionPreview.test.tsx`

- [ ] Task 7: Create `PhotoLightbox` component (AC3)
  - [ ] 7.1 Create `src/features/submissions/components/PhotoLightbox.tsx`
  - [ ] 7.2 Full-screen overlay with dark background, centered image
  - [ ] 7.3 Close on Esc key, click outside image, or close button
  - [ ] 7.4 Export from components index and feature index

- [ ] Task 8: Create `SubmissionPreviewPage` (AC1-AC6)
  - [ ] 8.1 Create `src/pages/participant/SubmissionPreviewPage.tsx`
  - [ ] 8.2 Uses `useSubmissionPreview` to fetch submission data
  - [ ] 8.3 Renders `SubmissionPreview` component with media
  - [ ] 8.4 "Confirm Submission" button calls `useConfirmSubmission`
  - [ ] 8.5 "Replace" button navigates to `/participant/submit/:categoryId`
  - [ ] 8.6 Loading skeleton while fetching
  - [ ] 8.7 Error state if submission not found
  - [ ] 8.8 Create `SubmissionPreviewPage.test.tsx`

- [ ] Task 9: Update router (AC1)
  - [ ] 9.1 Replace placeholder at `/participant/preview/:submissionId` with `SubmissionPreviewPage`
  - [ ] 9.2 Keep `ParticipantRoute` guard and `LazyRoute` wrapper

- [ ] Task 10: Update feature exports
  - [ ] 10.1 Export `SubmissionPreview`, `PhotoLightbox` from submissions components index
  - [ ] 10.2 Export `useSubmissionPreview`, `useConfirmSubmission` from submissions hooks index
  - [ ] 10.3 Update `src/features/submissions/index.ts` with all new exports

- [ ] Task 11: Handle "return later" flow (AC6)
  - [ ] 11.1 Update `ParticipantCategoriesPage` to navigate to preview page if submission status is `uploaded`
  - [ ] 11.2 "View/Edit" on `uploaded` submissions → `/participant/preview/:submissionId`
  - [ ] 11.3 "View/Edit" on `submitted` submissions → `/participant/preview/:submissionId` (read-only confirm state)

- [ ] Task 12: Run quality gates
  - [ ] 12.1 `npm run build` passes
  - [ ] 12.2 `npm run lint` passes
  - [ ] 12.3 `npm run type-check` passes
  - [ ] 12.4 `npm run test` passes
  - [ ] 12.5 Deploy new Edge Functions
  - [ ] 12.6 Manual smoke test: upload video → preview → confirm → categories shows "Submitted"
  - [ ] 12.7 Manual smoke test: upload photo → preview → fullscreen → confirm

### Review Follow-ups (AI)
- [ ] [AI-Review][HIGH] Fix PhotoLightbox event typing without React namespace to avoid type-check failure (use type-only import) `src/features/submissions/components/PhotoLightbox.tsx:25`
- [ ] [AI-Review][HIGH] Do not overwrite `submitted_at` on confirm; preserve upload timestamp per deadline fairness rule `supabase/functions/confirm-submission/index.ts:90`
- [ ] [AI-Review][HIGH] Provide explicit UI state/guard for `uploading` (pending) status on preview page `src/pages/participant/SubmissionPreviewPage.tsx:87`
- [ ] [AI-Review][HIGH] Allow Replace on submitted preview per AC5 (remove restriction or add alternative action) `src/pages/participant/SubmissionPreviewPage.tsx:133`
- [ ] [AI-Review][MEDIUM] Add Dev Agent Record → File List generated from git status (story auditability) `_bmad-output/implementation-artifacts/4-6-submission-preview-confirm.md:1`
- [ ] [AI-Review][MEDIUM] Ensure submissionId/participant data is validated before invoking get-submission to avoid invalid payload race `src/features/submissions/hooks/useSubmissionPreview.ts:33`
- [ ] [AI-Review][MEDIUM] Use consistent error code/status for already-confirmed (e.g., 409) and avoid string matching `supabase/functions/confirm-submission/index.ts:143`
- [ ] [AI-Review][MEDIUM] Align get-submission response types: categoryName/categoryType should not be nullable or types should allow null `supabase/functions/get-submission/index.ts:113`
- [ ] [AI-Review][LOW] Add focus trap to PhotoLightbox for accessibility `src/features/submissions/components/PhotoLightbox.tsx:44`
- [ ] [AI-Review][LOW] Add preview UI guidance for `uploading` status (copy/state) `src/pages/participant/SubmissionPreviewPage.tsx:87`

## Dev Notes

### Architecture Requirements

**Participant Session Pattern (no Supabase Auth):**
Participants do NOT have Supabase Auth accounts. All data access goes through Edge Functions using `supabase.functions.invoke()`. The Edge Functions use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS. Every Edge Function must validate `participantId` + `participantCode` ownership.

**New Intermediate Submission Status:**
The current upload flow sets status directly to `submitted` upon upload completion. This story introduces an intermediate `uploaded` status:

```
uploading → uploaded → submitted
                ↓
           (replace) → uploading → uploaded → submitted
```

- `uploading`: File transfer in progress
- `uploaded`: File stored on Bunny, awaiting participant confirmation
- `submitted`: Participant confirmed, submission is final

This requires updating two existing Edge Functions (`finalize-upload` and `upload-photo`) to set `uploaded` instead of `submitted`.

**Video Preview - Bunny Stream Embed:**
Use Bunny Stream's iframe embed. Do NOT install a video player library.

```tsx
// Video embed URL format (from finalize-upload Edge Function)
const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${bunnyVideoId}`;

// Usage in component:
<iframe
  src={embedUrl}
  loading="lazy"
  style={{ border: 'none', width: '100%', aspectRatio: '16/9' }}
  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
  allowFullScreen
/>
```

The `libraryId` is a server-side env var (`BUNNY_STREAM_LIBRARY_ID`). The `get-submission` Edge Function must return it so the client can construct the embed URL.

**Photo Preview - Direct CDN URL:**
Photo `media_url` is a direct Bunny Storage CDN URL (e.g., `https://{zone}.b-cdn.net/{path}`). Render with `<img>` tag. Fullscreen is a custom lightbox overlay, not a third-party library.

### Technical Requirements

**Feature Location:** `src/features/submissions/` (extends 4-4 and 4-5 implementations)

**New/Modified Files:**
```
src/features/submissions/
├── components/
│   ├── SubmissionPreview.tsx          # NEW: Media preview (video iframe or photo)
│   ├── SubmissionPreview.test.tsx     # NEW: Tests
│   ├── PhotoLightbox.tsx             # NEW: Fullscreen photo overlay
│   ├── PhotoLightbox.test.tsx        # NEW: Tests
│   └── index.ts                      # MODIFY: Export new components
├── hooks/
│   ├── useSubmissionPreview.ts       # NEW: Fetch submission data
│   ├── useConfirmSubmission.ts       # NEW: Confirm mutation
│   └── index.ts                      # MODIFY: Export new hooks
├── types/
│   └── submission.types.ts           # MODIFY: Add 'uploaded' status
└── index.ts                          # MODIFY: Export all new items

src/pages/participant/
├── SubmissionPreviewPage.tsx         # NEW: Preview + confirm page
└── SubmissionPreviewPage.test.tsx    # NEW: Tests

src/router/
└── index.tsx                         # MODIFY: Replace preview placeholder

supabase/functions/
├── get-submission/                   # NEW: Fetch submission for preview
│   └── index.ts
├── confirm-submission/               # NEW: Confirm submission status
│   └── index.ts
├── finalize-upload/                  # MODIFY: Set status='uploaded' instead of 'submitted'
│   └── index.ts
└── upload-photo/                     # MODIFY: Set status='uploaded' instead of 'submitted'
    └── index.ts

src/features/participants/
├── components/
│   └── ParticipantCategoryCard.tsx   # MODIFY: Handle 'uploaded' badge + navigation
└── types/
    └── participant.types.ts          # MODIFY: Add submissionStatus to ParticipantCategory

supabase/functions/
└── get-participant-categories/       # MODIFY: Return submissionStatus field
    └── index.ts
```

### Reuse from Previous Stories (DO NOT RECREATE)

**Already implemented - reuse directly:**
- `UploadProgress` component (Stories 4-4, 4-5)
- `useVideoUpload` / `usePhotoUpload` hooks
- `VideoUploadForm` / `PhotoUploadForm` components
- `SubmitPage` wrapper (routes to correct upload form by category type)
- `ParticipantRoute` guard component
- `LazyRoute` wrapper component
- `useParticipantSession` context hook
- `toast` from sonner for notifications
- `Button`, `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Skeleton` from `@/components/ui`
- Navigation patterns from upload pages

### Edge Function: get-submission

```typescript
// supabase/functions/get-submission/index.ts
// Validates participant ownership, returns submission + category info
// MUST return libraryId for video embed URL construction
// Response shape:
{
  success: true,
  submission: {
    id: string,
    mediaType: 'video' | 'photo',
    mediaUrl: string,
    bunnyVideoId: string | null,
    thumbnailUrl: string | null,
    status: 'uploading' | 'uploaded' | 'submitted',
    submittedAt: string,
    categoryId: string,
    categoryName: string,
    categoryType: 'video' | 'photo',
  },
  libraryId: string | null  // Only for video, from BUNNY_STREAM_LIBRARY_ID env
}
```

### Edge Function: confirm-submission

```typescript
// supabase/functions/confirm-submission/index.ts
// Validates participant owns submission AND status is 'uploaded'
// Updates status to 'submitted'
// Response: { success: true, submissionId: string }
// Error if status is NOT 'uploaded' (already confirmed or still uploading)
```

### PhotoLightbox Implementation Notes

- Render with React Portal to `document.body` to escape any overflow/positioning ancestors
- Use `position: fixed; inset: 0` for full viewport coverage
- Dark semi-transparent backdrop (`bg-black/80`)
- Image centered with `max-w-[90vw] max-h-[90vh] object-contain`
- Close button (X) in top-right corner
- Close on Esc keypress (add `useEffect` with `keydown` listener)
- Close on backdrop click (stop propagation on image click)
- Prevent body scroll while open (`overflow: hidden` on body)
- Trap focus inside lightbox for accessibility

### Categories Page Integration

The `get-participant-categories` Edge Function currently returns `hasSubmitted: boolean`. Update to also return `submissionStatus: 'uploaded' | 'submitted' | null` and `submissionId: string | null` so the categories page can:

1. Show "Pending Confirmation" badge (amber) for `uploaded` status
2. Show "Submitted" badge (green) for `submitted` status
3. Navigate to `/participant/preview/:submissionId` for both statuses
4. For `uploaded` → preview page shows "Confirm Submission" + "Replace"
5. For `submitted` → preview page shows "Submitted!" confirmation state with "Replace" only (Story 4.7 scope, but display the confirmed state now)

### Testing Guidance

**Unit Tests (SubmissionPreview.test.tsx):**
1. Renders Bunny Stream iframe for video submissions with correct embed URL
2. Renders image for photo submissions
3. Photo click opens lightbox
4. Loading state renders skeleton

**Unit Tests (PhotoLightbox.test.tsx):**
1. Renders image at full viewport
2. Closes on Esc keypress
3. Closes on backdrop click
4. Does not close on image click

**Unit Tests (SubmissionPreviewPage.test.tsx):**
1. Shows loading skeleton while fetching
2. Displays video preview for video submission
3. Displays photo preview for photo submission
4. "Confirm Submission" button calls confirm mutation
5. Shows success toast and navigates on confirmation
6. "Replace" button navigates to submit page
7. Already-confirmed submission shows "Submitted!" state
8. Error state when submission not found

**Integration (Manual Smoke Tests):**
1. Upload video → lands on preview → video plays in iframe → confirm → categories shows "Submitted"
2. Upload photo → lands on preview → photo displays → click fullscreen → Esc closes → confirm → success
3. Upload photo → navigate away before confirming → return to categories → shows "Pending" → click "View/Edit" → preview page → confirm
4. Replace flow: preview → click Replace → upload new file → new preview shown

### Previous Story Intelligence

**From Story 4-5 (Photo Upload):**
- Server-side proxy pattern: Bunny credentials never exposed to client (use same pattern for any new Edge Functions)
- Photo `media_url` is direct CDN URL (no embed required, just `<img src={mediaUrl}>`)
- Security fix eliminated client-side Bunny API key usage
- Edge Function CORS headers pattern: `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type`
- Supabase admin client pattern: `createClient(URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })`

**From Story 4-4 (Video Upload):**
- Video `bunny_video_id` stored in submission record
- `finalize-upload` constructs `media_url` from library ID + video ID
- Bunny Stream library ID is env var `BUNNY_STREAM_LIBRARY_ID`
- TUS upload protocol used for resumable video uploads

**From Story 4-3 (Categories):**
- `ParticipantCategoryCard` uses `hasSubmitted` boolean from Edge Function response
- Navigate to submit page: `navigate('/participant/submit/${category.id}')`
- Category type determines upload form (via SubmitPage wrapper)

### Project Structure Notes

- All new components go in `src/features/submissions/components/`
- All new hooks go in `src/features/submissions/hooks/`
- New page goes in `src/pages/participant/`
- New Edge Functions go in `supabase/functions/`
- MUST update `src/features/submissions/index.ts` with every new export
- Import from `@/features/submissions` NOT deep paths
- Import from `@/components/ui` for shadcn components
- Import from `@/contexts` for `useParticipantSession`

### Quality Gates

```bash
# Git (REQUIRED)
git status          # Must show clean
git log --oneline -5  # Verify commits have "4-6:" prefix
git push -u origin story/4-6-submission-preview-confirm

# Build (REQUIRED)
npm run build       # Must pass
npm run lint        # Must pass
npm run type-check  # Must pass
npm run test        # Must pass

# Edge Function Deployment (REQUIRED)
npx supabase functions deploy get-submission
npx supabase functions deploy confirm-submission
npx supabase functions deploy finalize-upload     # Modified
npx supabase functions deploy upload-photo        # Modified
npx supabase functions deploy get-participant-categories  # Modified
```

### References

- [Source: epic-4-participant-submission-experience.md#Story 4.6]
- [Source: project-context.md#Bunny Upload Security]
- [Source: core-architectural-decisions.md#Data Architecture - submissions table]
- [Source: 4-5-photo-upload-with-progress.md] (server-side proxy pattern, Edge Function patterns)
- [Source: 4-4-video-upload-with-progress.md] (Bunny Stream integration, video ID, finalize-upload)
- [Source: 4-3-view-categories-submission-status.md] (categories page, ParticipantCategoryCard)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
