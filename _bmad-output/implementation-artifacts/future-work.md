# Future Work & Deferred Items

**Project:** media-education-solutions
**Last Updated:** 2026-01-30

---

## Purpose
This document tracks valuable features, improvements, and technical debt discovered during implementation that are **out of scope** for current stories/epics but should be addressed in future work.

---

## How to Use This Document

### When to Add Items
- Feature is valuable but not required for current acceptance criteria
- Implementation would significantly delay story completion
- Nice-to-have vs must-have features
- Technical debt or optimization opportunities discovered
- Security/performance improvements that aren't blocking

### When NOT to Add Items
- Required for current acceptance criteria
- Bug that breaks existing functionality
- Needed for story to work properly
- Blocking issue (use correct-course workflow instead)

### Review Cadence
- **During Story Work:** Add items as discovered
- **During Epic Retrospective:** Review and prioritize epic-specific items
- **During Sprint Planning:** Promote high-priority items to new stories

---

## Discovered During Development

### Epic 1: Project Foundation & Core Infrastructure
*Items discovered during Epic 1 implementation*

<!-- Example:
- **[Story 1-2]** Add database migration rollback scripts
  - **Why:** Safety net for production deployments
  - **Priority:** Medium
  - **Suggested Epic:** Epic 8 (DevOps & Maintenance)
  - **Discovered:** 2026-01-11
-->

*No items currently tracked*

---

### Epic 2: Super Admin Authentication & Contest Management
*Items discovered during Epic 2 implementation*

- **[Story 2-3]** Add unit tests for contestsApi collision/retry logic
  - **Why:** AC2/AC4-critical logic (auto-generate code + duplicate handling) has no direct test coverage. UI tests mock the hooks and don't exercise collision retry or error mapping.
  - **Priority:** Medium
  - **Suggested Epic:** Tech debt / Test coverage improvement
  - **Discovered:** 2026-01-12
  - **Files:** `src/features/contests/api/contestsApi.ts`
  - **Notes:** Testing requires either mocking Supabase (brittle) or integration tests against real DB. Consider extracting pure logic into testable functions.

---

### Epic 3: Judge Onboarding & Assignment
*Items discovered during Epic 3 implementation*

- **[Story 3-2]** CategoryCard tests for invitation flow are mock-only, not behavioral
  - **Why:** Tests at `CategoryCard.test.tsx:287-337` only verify mocks are configured, not actual component behavior. Real close→invitation flow relies on `useUpdateCategoryStatus` which IS tested.
  - **Priority:** Low
  - **Suggested Epic:** Tech debt / Test coverage improvement
  - **Discovered:** 2026-01-26
  - **Files:** `src/features/categories/components/CategoryCard.test.tsx`

- **[Story 3-2]** No email format validation before sending judge invitation
  - **Why:** `sendJudgeInvitation` in categoriesApi doesn't validate email format before calling Edge Function. Could attempt sends to malformed addresses.
  - **Priority:** Medium
  - **Suggested Epic:** Epic 7 (Email Notification System)
  - **Discovered:** 2026-01-26
  - **Files:** `src/features/categories/api/categoriesApi.ts:332-430`

- **[Story 3-2]** Notification types are exported but unused (duplicate definitions)
  - **Why:** `JudgeInvitationPayload` and `JudgeInvitationResponse` exported from `notification.types.ts` but actual payload is defined inline in categoriesApi. Types are duplicated.
  - **Priority:** Low
  - **Suggested Epic:** Tech debt cleanup
  - **Discovered:** 2026-01-26
  - **Files:** `src/features/notifications/types/notification.types.ts`, `src/features/categories/api/categoriesApi.ts`

- **[Story 3-2]** Edge Function sender email fallback is placeholder
  - **Why:** `send-judge-invitation/index.ts:98` fallback `'noreply@yourdomain.com'` should be a required env var, not optional fallback.
  - **Priority:** Low
  - **Suggested Epic:** Pre-production hardening
  - **Discovered:** 2026-01-26
  - **Files:** `supabase/functions/send-judge-invitation/index.ts`

- **[Story 3-2]** NotificationType includes future placeholder values
  - **Why:** `notification.types.ts:9-10` defines `'judge_complete'` and `'contest_status'` for Epic 7 - dead code paths until implemented.
  - **Priority:** Low
  - **Suggested Epic:** Epic 7 (Email Notification System)
  - **Discovered:** 2026-01-26
  - **Files:** `src/features/notifications/types/notification.types.ts`

- **[Story 3-3]** Add test case for fetchProfile error during redirect logic
  - **Why:** SetPasswordPage now has try/catch around fetchProfile, but no test coverage for the error path.
  - **Priority:** Low
  - **Suggested Epic:** Tech debt / Test coverage improvement
  - **Discovered:** 2026-01-26
  - **Files:** `src/pages/auth/SetPasswordPage.test.tsx`

- **[Story 3-3]** Extract hardcoded `/set-password` redirect path to constant
  - **Why:** Path is hardcoded in Edge Function. Should be a shared constant for maintainability.
  - **Priority:** Low
  - **Suggested Epic:** Tech debt cleanup
  - **Discovered:** 2026-01-26
  - **Files:** `supabase/functions/send-judge-invitation/index.ts`

- **[Story 3-3]** Improve loading state text in SetPasswordPage
  - **Why:** "Verifying..." could be more descriptive: "Verifying your invitation link..."
  - **Priority:** Low
  - **Suggested Epic:** UX polish
  - **Discovered:** 2026-01-26
  - **Files:** `src/pages/auth/SetPasswordPage.tsx:100`

- **[Story 3-3]** Specify invite link expiration duration in email copy
  - **Why:** Email says "valid for a limited time" but doesn't specify how long. Supabase default is 24h.
  - **Priority:** Low
  - **Suggested Epic:** UX polish
  - **Discovered:** 2026-01-26
  - **Files:** `supabase/functions/send-judge-invitation/index.ts`

- **[Story 3-3]** Document why 'magiclink' type is accepted in SetPasswordPage
  - **Why:** Code accepts 'magiclink' type for flexibility (matches ResetPasswordPage pattern) but lacks inline comment explaining why.
  - **Priority:** Low
  - **Suggested Epic:** Documentation / Code clarity
  - **Discovered:** 2026-01-26
  - **Files:** `src/pages/auth/SetPasswordPage.tsx:59`

---

### Epic 4: Participant Submission Experience
*Items discovered during Epic 4 implementation*

- **[Story 4-3]** Extract hardcoded participant routes to constants
  - **Why:** Routes like `/participant/submit/{id}` and `/participant/submission/{id}` are hardcoded in ParticipantCategoryCard. Should use route constants for maintainability.
  - **Priority:** Low
  - **Suggested Epic:** Tech debt cleanup
  - **Discovered:** 2026-01-27
  - **Files:** `src/features/participants/components/ParticipantCategoryCard.tsx`, `src/router/index.tsx`

- **[Story 4-3]** Add test for DeadlineCountdown interval cleanup on unmount
  - **Why:** DeadlineCountdown uses setInterval but no explicit test for cleanup on unmount. Covered by React's useEffect cleanup semantics but could add explicit verification.
  - **Priority:** Low
  - **Suggested Epic:** Tech debt / Test coverage improvement
  - **Discovered:** 2026-01-27
  - **Files:** `src/features/participants/components/DeadlineCountdown.test.tsx`

- **[Story 4-3]** Add runtime type validation for DB responses in Edge Function
  - **Why:** Type assertions like `cat.type as 'video' | 'photo'` assume DB CHECK constraints are correct. Low risk since DB has constraints, but runtime validation would be safer.
  - **Priority:** Low
  - **Suggested Epic:** Pre-production hardening
  - **Discovered:** 2026-01-27
  - **Files:** `supabase/functions/get-participant-categories/index.ts`

- **[Story 4-2]** Optimize validate-participant to return full participant info including tlcName/tlcEmail
  - **Why:** Currently `enterContest()` only sets `name` and `organizationName` from validation response. The `tlcName` and `tlcEmail` fields require a separate `get-participant` call on the info page. This adds an extra network round-trip for returning users.
  - **Priority:** Low
  - **Suggested Epic:** Performance optimization
  - **Discovered:** 2026-01-26
  - **Files:** `supabase/functions/validate-participant/index.ts`, `src/contexts/ParticipantSessionProvider.tsx`
  - **Notes:** The current implementation is correct and meets all ACs. This is an optimization to reduce network calls for returning participants. Would require updating the Edge Function to return additional fields and updating `enterContest()` to store them in session.

- **[Story 4-3]** Consider primary button hierarchy when multiple categories shown
  - **Why:** Multiple categories with "Submit" primary buttons visible simultaneously could create visual competition. UX preference - not a bug.
  - **Priority:** Low
  - **Suggested Epic:** UX polish
  - **Discovered:** 2026-01-27
  - **Files:** `src/features/participants/components/ParticipantCategoryCard.tsx`
  - **Notes:** Design decision - some argue each card is its own action context. Consider if product wants to distinguish "next action" vs "other available actions".

- **[Story 4-3]** Reconcile story File List documentation with actual implementation
  - **Why:** Tech spec file list may not exactly match implemented files. Documentation sync issue only.
  - **Priority:** Low
  - **Suggested Epic:** Documentation cleanup
  - **Discovered:** 2026-01-27
  - **Files:** `_bmad-output/implementation-artifacts/4-3-view-categories-submission-status.md`

- **[Story 4-4]** Hardcoded Bunny CDN URL patterns in finalize-upload
  - **Why:** Thumbnail URL pattern `https://vz-{LIBRARY_ID}.b-cdn.net/{video_id}/thumbnail.jpg` is hardcoded. If Bunny changes their CDN URL structure, this breaks silently.
  - **Priority:** Low
  - **Suggested Epic:** Pre-production hardening
  - **Discovered:** 2026-01-27
  - **Files:** `supabase/functions/finalize-upload/index.ts:103-104`
  - **Notes:** Could extract to env var or fetch from Bunny API. Low risk since Bunny URLs are stable.

- **[Story 4-4]** Add rate limiting to video upload Edge Functions
  - **Why:** No rate limiting on `create-video-upload` or `finalize-upload`. A malicious participant could spam upload requests to exhaust Bunny API quota or fill storage.
  - **Priority:** Medium
  - **Suggested Epic:** Security hardening / Pre-production
  - **Discovered:** 2026-01-27
  - **Files:** `supabase/functions/create-video-upload/index.ts`, `supabase/functions/finalize-upload/index.ts`
  - **Notes:** Consider Redis-based rate limiting or Supabase Edge Function rate limits. Could limit to X uploads per participant per hour.

- **[Story 4-4]** RLS policy doesn't verify category belongs to same contest
  - **Why:** `Judge read assigned category submissions` policy joins categories to submissions but doesn't verify the category's division belongs to the same contest. Edge case: if a judge ID is reused across contests, could theoretically leak submissions.
  - **Priority:** Low
  - **Suggested Epic:** Security hardening
  - **Discovered:** 2026-01-27
  - **Files:** `supabase/migrations/20260127170234_create_submissions.sql`
  - **Notes:** Very low risk since judge IDs are UUIDs and reuse is unlikely. Would require adding division→contest join to RLS policy.

- **[Story 4-4]** beforeunload warning message ignored by modern browsers
  - **Why:** Modern browsers ignore custom `beforeunload` messages for security. The implementation sets `e.returnValue` but browsers show generic text. Works correctly but could mislead developers.
  - **Priority:** Low
  - **Suggested Epic:** Documentation / Code clarity
  - **Discovered:** 2026-01-27
  - **Files:** `src/features/submissions/components/VideoUploadForm.tsx:63-72`
  - **Notes:** Add code comment explaining that custom messages are ignored. Behavior is correct - browsers still prompt.

- **[Story 4-4]** Use returned uploadUrl from Edge Function instead of hardcoded endpoint
  - **Why:** QA flagged that hook hardcodes `https://video.bunnycdn.com/tusupload` instead of using the `uploadUrl` returned by edge function. Both are identical (TUS endpoint is always the same, video-specific info is in headers).
  - **Priority:** Low
  - **Suggested Epic:** Code clarity / Consistency
  - **Discovered:** 2026-01-27
  - **Files:** `src/features/submissions/hooks/useVideoUpload.ts:93`
  - **Notes:** Not a bug - using returned value would be more proper but functionally identical.

- **[Story 4-4]** Update story metadata (status/tasks) to match implementation
  - **Why:** Story file still shows status="in-progress" and unchecked task boxes. Should be updated to "completed" with tasks checked.
  - **Priority:** Low
  - **Suggested Epic:** Documentation cleanup
  - **Discovered:** 2026-01-27
  - **Files:** `_bmad-output/implementation-artifacts/4-4-video-upload-with-progress.md`

- **[Story 4-6]** Bunny library ID exposed to client in get-submission response
  - **Why:** `get-submission` Edge Function returns `BUNNY_STREAM_LIBRARY_ID` to the client for iframe embed URL construction. This is a public embed library ID (not a secret — it's visible in any Bunny Stream embed URL), but could be moved to a client-side env var or injected config for cleaner separation.
  - **Priority:** Low
  - **Suggested Epic:** Pre-production hardening
  - **Discovered:** 2026-01-29
  - **Files:** `supabase/functions/get-submission/index.ts:132-134`

- **[Story 4-6]** Internal feature imports use relative paths instead of barrel
  - **Why:** `SubmissionPreview.tsx` imports from `../hooks/useSubmissionPreview` (relative) rather than `@/features/submissions` (barrel). This is consistent with all other feature-internal imports in the project (barrel exports are for cross-feature consumers), so this is by convention, not a defect.
  - **Priority:** Low
  - **Suggested Epic:** Code consistency review
  - **Discovered:** 2026-01-29
  - **Files:** `src/features/submissions/components/SubmissionPreview.tsx:6`

- **[Story 4-6]** Wildcard CORS on Edge Functions
  - **Why:** All Edge Functions use `Access-Control-Allow-Origin: '*'`. This is the established pattern across every Edge Function in the project. Should be tightened to the app's actual origin(s) before production deployment.
  - **Priority:** Medium
  - **Suggested Epic:** Pre-production hardening
  - **Discovered:** 2026-01-29
  - **Files:** `supabase/functions/get-submission/index.ts:8`, `supabase/functions/confirm-submission/index.ts:8`, and all other Edge Functions

- **[Story 4-6]** Add rollback script for uploaded status migration
  - **Why:** Migration `20260129194757_add_uploaded_status_to_submissions.sql` adds 'uploaded' to the status CHECK constraint but has no down/rollback migration. All migrations in this project follow the same pattern (no rollbacks). Should be addressed project-wide before production.
  - **Priority:** Low
  - **Suggested Epic:** DevOps & Maintenance
  - **Discovered:** 2026-01-29
  - **Files:** `supabase/migrations/20260129194757_add_uploaded_status_to_submissions.sql`

- **[Story 4-6]** Clarify `submitted_at` semantics for deadline enforcement
  - **Why:** Code review questioned whether `submitted_at` should reflect upload time or confirmation time for deadline fairness. Currently set to confirmation time (semantically correct — "submitted" = "confirmed"). Upload initiation time is preserved in `created_at`. When deadline enforcement is implemented, the business must decide which timestamp governs eligibility.
  - **Priority:** Low
  - **Suggested Epic:** Business logic / Deadline enforcement
  - **Discovered:** 2026-01-29
  - **Files:** `supabase/functions/confirm-submission/index.ts:96`, `supabase/migrations/20260127170234_create_submissions.sql:14`
  - **Notes:** `created_at` = upload initiated, `submitted_at` = participant confirmed, `updated_at` = last modification. All three timestamps are available for deadline logic.

- **[Story 4-6]** Add explicit UI state for `uploading` status on preview page
  - **Why:** If a user navigates to the preview page while status is `uploading` (e.g., manual URL entry during active upload), neither Confirm nor Replace buttons render — the page works but shows no guidance. Adding an "Upload in progress" message would improve UX for this edge case.
  - **Priority:** Low
  - **Suggested Epic:** UX polish
  - **Discovered:** 2026-01-29
  - **Files:** `src/pages/participant/SubmissionPreviewPage.tsx:87-89`
  - **Notes:** Very unlikely scenario — upload flow navigates to preview only after completion (status = 'uploaded'). Page still functions, just lacks explicit messaging.

- **[Story 4-6]** Populate Dev Agent Record file list in story file
  - **Why:** Story file's Dev Agent Record section (File List, Completion Notes) was not filled in after implementation. Should be generated from `git diff` for story auditability.
  - **Priority:** Low
  - **Suggested Epic:** Documentation cleanup
  - **Discovered:** 2026-01-29
  - **Files:** `_bmad-output/implementation-artifacts/4-6-submission-preview-confirm.md:399-410`

- **[Story 4-6]** Use HTTP 409 Conflict for already-confirmed submissions
  - **Why:** `confirm-submission` returns HTTP 400 with error string `ALREADY_CONFIRMED`. The client matches this string in `useConfirmSubmission.ts:44`. HTTP 409 Conflict is more semantically correct. However, string-based error code matching is the established pattern across all edge functions in this project.
  - **Priority:** Low
  - **Suggested Epic:** API consistency / Tech debt
  - **Discovered:** 2026-01-29
  - **Files:** `supabase/functions/confirm-submission/index.ts:143-155`, `src/features/submissions/hooks/useConfirmSubmission.ts:44`
  - **Notes:** Would require updating error handling convention project-wide for consistency.

- **[Story 4-6]** Align nullable types between Edge Function response and TypeScript interface
  - **Why:** `get-submission` returns `category?.name ?? null` and `category?.type ?? null`, but `SubmissionPreviewData` types `categoryName` as `string` and `categoryType` as `'video' | 'photo'` (not nullable). Technically a type mismatch, but impossible to trigger at runtime due to `category_id NOT NULL REFERENCES categories(id) ON DELETE CASCADE` — a submission always has a valid category.
  - **Priority:** Low
  - **Suggested Epic:** Type safety / Tech debt
  - **Discovered:** 2026-01-29
  - **Files:** `supabase/functions/get-submission/index.ts:152-153`, `src/features/submissions/hooks/useSubmissionPreview.ts:6-17`

- **[Story 4-6]** Add focus trap to PhotoLightbox for WCAG compliance
  - **Why:** The lightbox has Escape close, backdrop click, close button, `role="dialog"`, and `aria-modal="true"`, but Tab key can still move focus to elements behind the modal. A focus trap is needed for full WCAG 2.1 modal dialog compliance.
  - **Priority:** Low
  - **Suggested Epic:** Accessibility
  - **Discovered:** 2026-01-29
  - **Files:** `src/features/submissions/components/PhotoLightbox.tsx:44-69`
  - **Notes:** Consider using a lightweight focus-trap library or implementing manual focus management (save previous focus, restore on close, constrain Tab to modal elements).

- **[Story 4-7]** TOCTOU race condition in withdraw-submission Edge Function
  - **Why:** Withdraw reads submission + category, validates deadline/status, then separately deletes. Between read and delete, another request could modify state (e.g., deadline passes, category closes). The `confirm-submission` function uses an RPC/stored procedure for atomicity, but `withdraw-submission` does not.
  - **Priority:** Medium
  - **Suggested Epic:** Security hardening / Pre-production
  - **Discovered:** 2026-01-30
  - **Files:** `supabase/functions/withdraw-submission/index.ts:90-207`
  - **Notes:** Requires an RPC or database function wrapping the read+validate+delete in a single transaction for true atomicity. Low practical risk in current usage patterns (single participant, low concurrency).

- **[Story 4-7]** No path traversal validation on Bunny Storage path derivation
  - **Why:** Photo deletion constructs the storage path via `media_url.replace(cdnPrefix, '')`. If `media_url` were manipulated to contain `../` sequences, the DELETE could target unintended storage paths. Both `upload-photo` and `withdraw-submission` use this pattern.
  - **Priority:** Medium
  - **Suggested Epic:** Security hardening / Pre-production
  - **Discovered:** 2026-01-30
  - **Files:** `supabase/functions/withdraw-submission/index.ts:176`, `supabase/functions/upload-photo/index.ts:187`
  - **Notes:** Risk is low since `media_url` is written by server-side code only (not user-controlled). Add path validation (reject `..` sequences) as defense-in-depth.

- **[Story 4-7]** Withdraw does not validate submission status before deletion
  - **Why:** An `uploading` status submission (active upload in progress) can be withdrawn. This could orphan an in-progress TUS upload or leave a partially-uploaded file in Bunny Storage/Stream.
  - **Priority:** Low
  - **Suggested Epic:** Edge case hardening
  - **Discovered:** 2026-01-30
  - **Files:** `supabase/functions/withdraw-submission/index.ts:90-109`
  - **Notes:** Consider rejecting withdrawal for `uploading` status or adding a status guard (`uploaded` or `submitted` only).

- **[Story 4-7]** Withdrawing during active TUS upload may delete in-progress video
  - **Why:** If a participant has an active TUS upload (status `uploading`) and withdraws on another tab, the Bunny Stream DELETE fires for `bunny_video_id` while TUS is still writing to it. Bunny may reject, partially delete, or leave orphaned data.
  - **Priority:** Low
  - **Suggested Epic:** Edge case hardening
  - **Discovered:** 2026-01-30
  - **Files:** `supabase/functions/withdraw-submission/index.ts:151-167`
  - **Notes:** Linked to the status validation issue above. Multi-tab scenarios are unlikely in the target user base (educators/students).

- **[Story 4-7]** Lock reason determined client-side from raw category fields
  - **Why:** `get-submission` returns raw `categoryDeadline` and `categoryStatus` to the client, which derives `isLocked` and the lock reason message. This logic could be computed server-side and returned as an enum (e.g., `lockReason: 'deadline_passed' | 'category_closed' | null`) for single-source-of-truth enforcement.
  - **Priority:** Low
  - **Suggested Epic:** API design / Tech debt
  - **Discovered:** 2026-01-30
  - **Files:** `supabase/functions/get-submission/index.ts:135-155`, `src/features/submissions/hooks/useSubmissionPreview.ts:57-60`
  - **Notes:** Current approach works correctly. Server-side lock reason would be cleaner but adds coupling between API contract and UI messaging.

- **[Story 4-7]** No Zod/runtime validation on Edge Function response shapes
  - **Why:** Client hooks (`useWithdrawSubmission`, `useSubmissionPreview`, `useConfirmSubmission`) trust that Edge Function responses match TypeScript interfaces. A malformed response would cause runtime errors. This is the established pattern across all hooks in the project.
  - **Priority:** Low
  - **Suggested Epic:** Type safety / Pre-production hardening
  - **Discovered:** 2026-01-30
  - **Files:** `src/features/submissions/hooks/useWithdrawSubmission.ts:25-28`, `src/features/submissions/hooks/useSubmissionPreview.ts:35-55`
  - **Notes:** Project-wide concern, not specific to story 4-7. Consider adding Zod schemas for all Edge Function responses as a cross-cutting improvement.

- **[Story 4-7]** Test mock shapes are incomplete (cast-based mocking)
  - **Why:** Tests use `as unknown as ReturnType<>` casts to create partial mock objects. If new fields are added to response types, tests won't fail even if the code starts using those fields. This is the standard pattern in the project's test suite.
  - **Priority:** Low
  - **Suggested Epic:** Test infrastructure / Tech debt
  - **Discovered:** 2026-01-30
  - **Files:** `src/pages/participant/SubmissionPreviewPage.test.tsx`, `src/features/submissions/hooks/useWithdrawSubmission.test.ts`
  - **Notes:** Consider using `satisfies` or factory functions for test data to catch type drift. Project-wide concern.

---

### Epic 5: Judging & Evaluation Workflow
*Items discovered during Epic 5 implementation*

- **[Story 5-1]** Add explicit role check in get_submissions_for_review RPC as defense-in-depth
  - **Why:** The SECURITY DEFINER RPC verifies `assigned_judge_id = auth.uid()` and has REVOKE/GRANT, but doesn't explicitly check `profiles.role = 'judge'`. Not a vulnerability (only assigned judges pass the category check), but an extra role guard adds defense-in-depth.
  - **Priority:** Low
  - **Suggested Epic:** Security hardening / Pre-production
  - **Discovered:** 2026-01-31
  - **Files:** `supabase/migrations/20260131020611_create_get_submissions_for_review_rpc.sql`

- **[Story 5-1]** Add aria-label to SubmissionCard button role for screen readers
  - **Why:** SubmissionCard has `role="button"` and keyboard handling but no explicit `aria-label`. Screen readers read card text content but an explicit label like `"Review submission by {participantCode}"` is best practice for WCAG compliance.
  - **Priority:** Low
  - **Suggested Epic:** Accessibility
  - **Discovered:** 2026-01-31
  - **Files:** `src/features/reviews/components/SubmissionCard.tsx:30-33`

- **[Story 5-1]** Update PROJECT_INDEX.md reviews exports to reflect current API
  - **Why:** The reviews feature barrel exports (types, hooks, components, API) should be documented in PROJECT_INDEX.md for discoverability.
  - **Priority:** Low
  - **Suggested Epic:** Documentation cleanup
  - **Discovered:** 2026-01-31
  - **Files:** `PROJECT_INDEX.md`, `src/features/reviews/index.ts`

- **[Story 5-2]** Add error state for submissions fetch in SubmissionReviewPage
  - **Why:** If `useSubmissionsForReview` returns an error (network failure, RPC error), `submissions` is undefined and the page redirects to the category page as if the submission wasn't found. Should show an error state with retry button instead, matching the pattern in `CategoryReviewPage`.
  - **Priority:** High
  - **Suggested Epic:** Bug fix / UX robustness
  - **Discovered:** 2026-01-31
  - **Files:** `src/pages/judge/SubmissionReviewPage.tsx:101-109`

- **[Story 5-2]** Add Bunny Stream embed fallback when mediaUrl is null but bunnyVideoId exists
  - **Why:** If `mediaUrl` is null but `bunnyVideoId` is present, the MediaViewer shows a placeholder instead of attempting to construct the embed URL from a `VITE_BUNNY_STREAM_LIBRARY_ID` env var. In practice this edge case doesn't occur because `finalize-upload` always sets `mediaUrl` to the full embed URL for submitted videos. Only triggers if the upload finalization flow has a bug.
  - **Priority:** Low
  - **Suggested Epic:** Defensive hardening
  - **Discovered:** 2026-01-31
  - **Files:** `src/features/reviews/components/MediaViewer.tsx`

- **[Story 5-2]** Disable keyboard navigation while save mutation is pending
  - **Why:** The Previous/Next buttons already disable during `isSaving`, but the keyboard handler (ArrowLeft/ArrowRight) doesn't check `isPending`. Rapid arrow key presses could trigger overlapping save mutations. No data corruption risk since the upsert uses `onConflict` (idempotent), but it's wasteful and could feel sluggish.
  - **Priority:** Low
  - **Suggested Epic:** UX polish
  - **Discovered:** 2026-01-31
  - **Files:** `src/pages/judge/SubmissionReviewPage.tsx:82-98`

- **[Story 5-2]** Add aria-pressed or radiogroup semantics to RatingDisplay tier buttons
  - **Why:** Rating tiers function as exclusive selection (like radio buttons) but are rendered as plain `<button>` elements. Adding `role="radiogroup"` on the container + `role="radio"` + `aria-checked` on each tier button would improve screen reader accessibility per WCAG.
  - **Priority:** Low
  - **Suggested Epic:** Accessibility
  - **Discovered:** 2026-01-31
  - **Files:** `src/features/reviews/components/RatingDisplay.tsx`


---

### Epic 6: Admin Oversight & Results Publication
*Items discovered during Epic 6 implementation*

*No items currently tracked*

---

### Epic 7: Email Notification System
*Items discovered during Epic 7 implementation*

*No items currently tracked*

---

## Nice-to-Haves
*Features that would add value but aren't critical for MVP*

<!-- Example:
- **Dark mode support**
  - **Value:** User preference, modern UX
  - **Effort:** Medium
  - **Priority:** Low
-->

*No items currently tracked*

---

## Technical Debt
*Code improvements, refactoring, performance optimizations*

- **[Story 3-2]** Test import pattern is unusual in useUpdateCategoryStatus.test.tsx
  - **Impact:** Minor readability issue - uses `import * as categoriesApi` then accesses `categoriesApi.categoriesApi.updateStatus`
  - **Effort:** Small
  - **Priority:** Low
  - **Discovered:** 2026-01-26
  - **Files:** `src/features/categories/hooks/useUpdateCategoryStatus.test.tsx:32`

- **[Pre-existing]** Test infrastructure missing Supabase env vars
  - **Impact:** 8 test suites fail due to missing Supabase environment variables in test environment
  - **Effort:** Medium (need to configure test setup with mock env vars)
  - **Priority:** Medium
  - **Discovered:** 2026-01-26
  - **Files:** `src/lib/supabase.ts`, various test files

---

## Security & Performance
*Non-blocking security/performance improvements*

<!-- Example:
- **Add rate limiting to auth endpoints**
  - **Risk:** Low (not exposed to public yet)
  - **Effort:** Small
  - **Priority:** High (before production)
-->

*No items currently tracked*

---

## Completed Items
*Items that were promoted to stories and completed*

<!-- When an item is implemented, move it here with completion date:
- **[Story 2-1]** Password reset flow - Completed in Story 2-8 (2026-01-15)
-->

*No items currently tracked*

---

## Notes

- Keep descriptions concise and actionable
- Include enough context for future review
- Update priorities as project evolves
- Archive completed items to track evolution
- Review this document during retrospectives and sprint planning
