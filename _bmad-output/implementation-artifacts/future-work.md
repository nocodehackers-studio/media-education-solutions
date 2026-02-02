# Future Work & Deferred Items

**Project:** media-education-solutions
**Last Updated:** 2026-02-01
**Consolidated:** Per Epic 6 retrospective action item #1 — all per-story future-work files merged into this single document.

---

## Purpose
This document tracks valuable features, improvements, and technical debt discovered during implementation that are **out of scope** for current stories/epics but should be addressed in future work. This is the **only** future-work file for the project — no per-story future-work files.

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
- **During Story Work:** Add items as discovered — always to THIS file
- **During Epic Retrospective:** Review and prioritize epic-specific items
- **During Sprint Planning:** Promote high-priority items to new stories

---

## Epic 1: Project Foundation & Core Infrastructure

*No items tracked*

---

## Epic 2: Super Admin Authentication & Contest Management

- **[Story 2-3]** Add unit tests for contestsApi collision/retry logic
  - **Why:** AC2/AC4-critical logic (auto-generate code + duplicate handling) has no direct test coverage. UI tests mock the hooks and don't exercise collision retry or error mapping.
  - **Priority:** Medium
  - **Suggested Epic:** Tech debt / Test coverage improvement
  - **Discovered:** 2026-01-12
  - **Files:** `src/features/contests/api/contestsApi.ts`
  - **Notes:** Testing requires either mocking Supabase (brittle) or integration tests against real DB. Consider extracting pure logic into testable functions.

- **[Story 2-3]** Validate contest code character set in API layer or add DB check constraint
  - **Why:** Prevents ambiguous codes containing 0/O/1/I characters.
  - **Priority:** Low
  - **Discovered:** 2026-01-12
  - **Files:** `src/features/contests/api/contestsApi.ts`

- **[Story 2-3]** Expand contest detail page to show contest name, code, and status
  - **Why:** Post-create redirect should confirm AC3 intent by showing full contest info.
  - **Priority:** Low
  - **Discovered:** 2026-01-12
  - **Files:** `src/pages/admin/ContestDetailPage.tsx`

- **[Story 2-3]** Replace React namespace type usage in tests with type-only imports
  - **Why:** Code quality cleanup.
  - **Priority:** Low
  - **Discovered:** 2026-01-12
  - **Files:** `src/features/contests/components/CreateContestForm.test.tsx`

- **[Story 2-4]** Mobile empty state CTA accessibility
  - **Why:** Validate "Create your first contest" Sheet trigger is accessible and visible on mobile.
  - **Priority:** Low
  - **Discovered:** 2026-01-13
  - **Files:** `src/pages/admin/ContestsPage.tsx:101`

- **[Story 2-4]** API unit tests for contestsApi (update, updateStatus, delete)
  - **Why:** Currently only covered by component integration tests.
  - **Priority:** Medium
  - **Discovered:** 2026-01-13
  - **Files:** `src/features/contests/api/contestsApi.ts`

- **[Story 2-4]** Cover image upload (Bunny Storage integration)
  - **Why:** Requires Bunny Storage infrastructure. Deferred from AC4 — currently uses placeholder URLs.
  - **Priority:** Medium
  - **Suggested Epic:** Bundled with Bunny Stream setup
  - **Discovered:** 2026-01-13
  - **Files:** `src/features/contests/api/contestsApi.ts`, `src/features/contests/components/EditContestForm.tsx`

- **[Story 2-5]** AC4 tooltip on disabled draft option when submissions exist
  - **Why:** Current inline helper text does not meet spec tooltip requirement.
  - **Priority:** Low
  - **Discovered:** 2026-01-14
  - **Files:** `src/features/categories/components/CategoryCard.tsx`

- **[Story 2-5]** Deadline picker date handling — timezone-safe
  - **Why:** `toISOString()` can shift the day for non-UTC users. Store date-only or normalize to end-of-day, and allow same-day selection.
  - **Priority:** Medium
  - **Discovered:** 2026-01-14
  - **Files:** `src/features/categories/components/CreateCategoryForm.tsx`, `src/features/categories/components/EditCategoryForm.tsx`

- **[Story 2-5]** Missing interaction tests for status dropdown and date picker
  - **Why:** Untested due to jsdom limitations. Need Playwright coverage.
  - **Priority:** Low
  - **Discovered:** 2026-01-14
  - **Files:** `src/features/categories/components/CategoryCard.test.tsx`, `src/features/categories/components/CreateCategoryForm.test.tsx`

- **[Story 2-8]** Session/profile failure fallback
  - **Why:** Profile fetch failure leaves session authenticated but profile null — route guards hang in loading state indefinitely. Need bounded fallback or explicit error state.
  - **Priority:** High
  - **Discovered:** 2026-01-15
  - **Files:** `src/contexts/AuthProvider.tsx`, `src/router/AdminRoute.tsx`, `src/router/JudgeRoute.tsx`

- **[Story 2-8]** AC4 manual checklist — end-to-end verification
  - **Why:** AC4 requires manual verification. Checklist deferred and incomplete.
  - **Priority:** Low
  - **Discovered:** 2026-01-15
  - **Files:** `_bmad-output/implementation-artifacts/2-8-epic-2-stabilization-optimization.md`

- **[Story 2-9]** Server-side "Last Division" guard (DB trigger)
  - **Why:** Division deletion currently relies on client-side validation only. Direct API calls could delete the last division.
  - **Priority:** Medium
  - **Discovered:** 2026-01-21
  - **Files:** `src/features/divisions/hooks/useDeleteDivision.ts`, `src/features/divisions/components/DivisionListItem.tsx`
  - **Notes:** Proposed fix — add trigger: `CREATE TRIGGER enforce_minimum_division BEFORE DELETE ON divisions FOR EACH ROW EXECUTE FUNCTION prevent_last_division_delete();`

---

## Epic 3: Judge Onboarding & Assignment

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

- **[Story 3-2]** Notification types exported but unused (duplicate definitions)
  - **Why:** `JudgeInvitationPayload` and `JudgeInvitationResponse` exported from `notification.types.ts` but actual payload is defined inline in categoriesApi.
  - **Priority:** Low
  - **Discovered:** 2026-01-26
  - **Files:** `src/features/notifications/types/notification.types.ts`, `src/features/categories/api/categoriesApi.ts`

- **[Story 3-2]** Edge Function sender email fallback is placeholder
  - **Why:** `send-judge-invitation/index.ts:98` fallback `'noreply@yourdomain.com'` should be a required env var, not optional fallback.
  - **Priority:** Low
  - **Discovered:** 2026-01-26
  - **Files:** `supabase/functions/send-judge-invitation/index.ts`

- **[Story 3-2]** NotificationType includes future placeholder values
  - **Why:** `notification.types.ts:9-10` defines `'judge_complete'` and `'contest_status'` for Epic 7 — dead code paths until implemented.
  - **Priority:** Low
  - **Suggested Epic:** Epic 7 (Email Notification System)
  - **Discovered:** 2026-01-26
  - **Files:** `src/features/notifications/types/notification.types.ts`

- **[Story 3-2]** Invite flow on live domain — deployment checklist
  - **Why:** When Story 3-2 gets revisited, point the Edge Function + Brevo secrets at the live domain, deploy the function, verify the sender, and re-run the email delivery checklist.
  - **Priority:** High
  - **Suggested Epic:** Pre-production / Deployment
  - **Discovered:** 2026-01-26
  - **Files:** `_bmad-output/implementation-artifacts/3-2-judge-invitation-email.md`

- **[Story 3-3]** Add test case for fetchProfile error during redirect logic
  - **Why:** SetPasswordPage now has try/catch around fetchProfile, but no test coverage for the error path.
  - **Priority:** Low
  - **Discovered:** 2026-01-26
  - **Files:** `src/pages/auth/SetPasswordPage.test.tsx`

- **[Story 3-3]** Extract hardcoded `/set-password` redirect path to constant
  - **Why:** Path is hardcoded in Edge Function. Should be a shared constant.
  - **Priority:** Low
  - **Discovered:** 2026-01-26
  - **Files:** `supabase/functions/send-judge-invitation/index.ts`

- **[Story 3-3]** Improve loading state text in SetPasswordPage
  - **Why:** "Verifying..." could be more descriptive: "Verifying your invitation link..."
  - **Priority:** Low
  - **Discovered:** 2026-01-26
  - **Files:** `src/pages/auth/SetPasswordPage.tsx:100`

- **[Story 3-3]** Specify invite link expiration duration in email copy
  - **Why:** Email says "valid for a limited time" but doesn't specify how long. Supabase default is 24h.
  - **Priority:** Low
  - **Discovered:** 2026-01-26
  - **Files:** `supabase/functions/send-judge-invitation/index.ts`

- **[Story 3-3]** Document why 'magiclink' type is accepted in SetPasswordPage
  - **Why:** Code accepts 'magiclink' type for flexibility but lacks inline comment explaining why.
  - **Priority:** Low
  - **Discovered:** 2026-01-26
  - **Files:** `src/pages/auth/SetPasswordPage.tsx:59`

- **[Story 3-4]** API unit tests for `listByJudge()`
  - **Why:** Method is tested indirectly through component tests only. Direct API tests would improve coverage.
  - **Priority:** Medium
  - **Discovered:** 2026-01-26
  - **Files:** `src/features/categories/api/categoriesApi.ts`

- **[Story 3-4]** Accessibility improvements for judge dashboard
  - **Why:** Dashboard needs `aria-label` on icon buttons, `aria-busy` on loading states, `aria-live` regions for dynamic content, semantic HTML.
  - **Priority:** Medium
  - **Discovered:** 2026-01-26
  - **Files:** Judge dashboard pages and components

- **[Story 3-4]** N+1 submission count queries — aggregate in single query
  - **Why:** Current implementation uses Promise.all with individual count queries per category. Aggregated RPC would be more efficient.
  - **Priority:** Medium
  - **Discovered:** 2026-01-26
  - **Files:** `src/features/categories/api/categoriesApi.ts:480`

- **[Story 3-4]** Test date formatting brittleness
  - **Why:** Tests use exact match on date-fns output. Different locales or updates could cause failures. Use flexible matchers.
  - **Priority:** Low
  - **Discovered:** 2026-01-26
  - **Files:** `src/pages/judge/DashboardPage.test.tsx:345`

- **[Story 3-4]** QueryKey with undefined value
  - **Why:** When `judgeId` is undefined, queryKey includes `undefined`. Cleaner to use sentinel value.
  - **Priority:** Low
  - **Discovered:** 2026-01-26
  - **Files:** `src/features/categories/hooks/useCategoriesByJudge.ts:15`

- **[Story 3-4]** Numeric test assertions too broad
  - **Why:** Tests use `screen.getByText('2')` which could match any "2" on page. Add data-testid or scoped queries.
  - **Priority:** Low
  - **Discovered:** 2026-01-26
  - **Files:** `src/pages/judge/DashboardPage.test.tsx:200`

- **[Story 3-4]** Loading state during logout
  - **Why:** Adding a loading spinner during logout is a nice-to-have for MVP.
  - **Priority:** Low
  - **Discovered:** 2026-01-26
  - **Files:** Judge dashboard logout button

- **[Story 3-4]** Hardcoded test dates in 2026
  - **Why:** Tests use dates in 2026. May need updates when dates are reached.
  - **Priority:** Low
  - **Discovered:** 2026-01-26
  - **Files:** `src/pages/judge/DashboardPage.test.tsx`

---

## Epic 4: Participant Submission Experience

- **[Story 4-1]** Rate limiting on validate-participant Edge Function
  - **Why:** No rate limiting to prevent brute-force attacks on participant codes. Requires Supabase platform-level configuration or API gateway.
  - **Priority:** Critical
  - **Suggested Epic:** Security hardening / Pre-production
  - **Discovered:** 2026-01-26
  - **Files:** `supabase/functions/validate-participant/index.ts`

- **[Story 4-1]** CORS restriction — replace wildcard with specific origins
  - **Why:** Wildcard CORS (`Access-Control-Allow-Origin: *`) should be replaced with specific allowed origins for production.
  - **Priority:** Critical
  - **Suggested Epic:** Security hardening / Pre-production
  - **Discovered:** 2026-01-26
  - **Files:** `supabase/functions/validate-participant/index.ts`
  - **Notes:** Cross-cutting concern — applies to ALL Edge Functions.

- **[Story 4-1]** Edge Function unit tests for validate-participant
  - **Why:** No tests covering invalid JSON, malformed codes, error responses. Requires Deno test setup.
  - **Priority:** High
  - **Discovered:** 2026-01-26
  - **Files:** `supabase/functions/validate-participant/index.ts`

- **[Story 4-1]** ParticipantSessionProvider unit tests
  - **Why:** No tests covering session persistence, timeout edge cases, race conditions.
  - **Priority:** High
  - **Discovered:** 2026-01-26
  - **Files:** `src/contexts/ParticipantSessionProvider.tsx`

- **[Story 4-1]** XSS sanitization for user-rendered fields
  - **Why:** Sanitize contestName, name, organizationName before rendering. Low risk for MVP (data comes from trusted admins).
  - **Priority:** High
  - **Suggested Epic:** Security hardening
  - **Discovered:** 2026-01-26
  - **Files:** `src/contexts/ParticipantSessionProvider.tsx`, `src/pages/participant/ParticipantInfoPage.tsx`

- **[Story 4-1]** Inactivity tracking — explicit user interaction hooks
  - **Why:** Implement explicit inactivity tracking by calling `updateActivity()` on user interactions and route changes. Current implementation relies on page-level activity only.
  - **Priority:** High
  - **Discovered:** 2026-01-26
  - **Files:** `src/contexts/ParticipantSessionProvider.tsx`

- **[Story 4-1]** Session integrity HMAC for localStorage
  - **Why:** Add integrity check to localStorage session to prevent client-side tampering. Backend validates anyway — defense-in-depth.
  - **Priority:** Medium
  - **Discovered:** 2026-01-26
  - **Files:** `src/contexts/ParticipantSessionProvider.tsx`

- **[Story 4-1]** Root route session handling for participants
  - **Why:** Root route (`/`) should detect participant session and redirect to `/participant/info` instead of always showing landing.
  - **Priority:** Medium
  - **Discovered:** 2026-01-26
  - **Files:** `src/router/index.tsx`

- **[Story 4-1]** ParticipantRoute tests — redirect and loading states
  - **Why:** No tests verifying redirect behavior and loading states.
  - **Priority:** Medium
  - **Discovered:** 2026-01-26
  - **Files:** `src/router/ParticipantRoute.tsx`

- **[Story 4-1]** CodeEntryPage integration tests
  - **Why:** Missing tests for entry and session flows covering success path, error scenarios, and redirects.
  - **Priority:** Medium
  - **Discovered:** 2026-01-26
  - **Files:** `src/pages/participant/CodeEntryPage.test.tsx`

- **[Story 4-1]** Configurable session timeout
  - **Why:** Move SESSION_TIMEOUT_MS and WARNING_BEFORE_MS to environment variables or config.
  - **Priority:** Low
  - **Discovered:** 2026-01-26
  - **Files:** `src/contexts/ParticipantSessionProvider.tsx`

- **[Story 4-1]** Error boundary for participant routes
  - **Why:** Add error boundary wrapping participant routes for graceful error handling.
  - **Priority:** Low
  - **Discovered:** 2026-01-26
  - **Files:** `src/router/index.tsx`

- **[Story 4-1]** Error message punctuation alignment
  - **Why:** Error message punctuation doesn't match AC text (periods vs no periods).
  - **Priority:** Low
  - **Discovered:** 2026-01-26
  - **Files:** `src/lib/errorCodes.ts`

- **[Story 4-2]** Optimize validate-participant to return full participant info
  - **Why:** Currently `enterContest()` only sets `name` and `organizationName` from validation response. The `tlcName` and `tlcEmail` fields require a separate `get-participant` call. Extra round-trip for returning users.
  - **Priority:** Low
  - **Suggested Epic:** Performance optimization
  - **Discovered:** 2026-01-26
  - **Files:** `supabase/functions/validate-participant/index.ts`, `src/contexts/ParticipantSessionProvider.tsx`

- **[Story 4-3]** Extract hardcoded participant routes to constants
  - **Why:** Routes like `/participant/submit/{id}` and `/participant/submission/{id}` are hardcoded. Should use route constants.
  - **Priority:** Low
  - **Discovered:** 2026-01-27
  - **Files:** `src/features/participants/components/ParticipantCategoryCard.tsx`, `src/router/index.tsx`

- **[Story 4-3]** Add runtime type validation for DB responses in Edge Function
  - **Why:** Type assertions like `cat.type as 'video' | 'photo'` assume DB CHECK constraints. Runtime validation would be safer.
  - **Priority:** Low
  - **Discovered:** 2026-01-27
  - **Files:** `supabase/functions/get-participant-categories/index.ts`

- **[Story 4-3]** Primary button hierarchy when multiple categories shown
  - **Why:** Multiple categories with "Submit" primary buttons simultaneously could create visual competition.
  - **Priority:** Low
  - **Suggested Epic:** UX polish
  - **Discovered:** 2026-01-27
  - **Files:** `src/features/participants/components/ParticipantCategoryCard.tsx`

- **[Story 4-4]** Hardcoded Bunny CDN URL patterns in finalize-upload
  - **Why:** Thumbnail URL pattern `https://vz-{LIBRARY_ID}.b-cdn.net/{video_id}/thumbnail.jpg` is hardcoded. Could break if Bunny changes URL structure.
  - **Priority:** Low
  - **Discovered:** 2026-01-27
  - **Files:** `supabase/functions/finalize-upload/index.ts:103-104`

- **[Story 4-4]** Rate limiting on video upload Edge Functions
  - **Why:** No rate limiting on `create-video-upload` or `finalize-upload`. Could exhaust Bunny API quota.
  - **Priority:** Medium
  - **Suggested Epic:** Security hardening / Pre-production
  - **Discovered:** 2026-01-27
  - **Files:** `supabase/functions/create-video-upload/index.ts`, `supabase/functions/finalize-upload/index.ts`

- **[Story 4-4]** RLS policy doesn't verify category belongs to same contest
  - **Why:** `Judge read assigned category submissions` policy doesn't verify category's division belongs to same contest. Edge case with reused judge IDs across contests.
  - **Priority:** Low
  - **Discovered:** 2026-01-27
  - **Files:** `supabase/migrations/20260127170234_create_submissions.sql`

- **[Story 4-4]** Use returned uploadUrl from Edge Function instead of hardcoded endpoint
  - **Why:** Hook hardcodes `https://video.bunnycdn.com/tusupload` instead of using returned `uploadUrl`. Functionally identical.
  - **Priority:** Low
  - **Discovered:** 2026-01-27
  - **Files:** `src/features/submissions/hooks/useVideoUpload.ts:93`

- **[Story 4-6]** Bunny library ID exposed to client in get-submission response
  - **Why:** Public embed library ID (not secret) — but could be moved to client-side env var for cleaner separation.
  - **Priority:** Low
  - **Discovered:** 2026-01-29
  - **Files:** `supabase/functions/get-submission/index.ts:132-134`

- **[Story 4-6]** Wildcard CORS on all Edge Functions
  - **Why:** All Edge Functions use `Access-Control-Allow-Origin: '*'`. Should be tightened to app's actual origin(s) before production.
  - **Priority:** Medium
  - **Suggested Epic:** Pre-production hardening
  - **Discovered:** 2026-01-29
  - **Files:** All Edge Functions
  - **Notes:** Cross-cutting concern. Same as Story 4-1 CORS item — consolidate fix.

- **[Story 4-6]** Add rollback scripts for migrations (project-wide)
  - **Why:** No down/rollback migrations exist in the project. Should be addressed before production.
  - **Priority:** Low
  - **Suggested Epic:** DevOps & Maintenance
  - **Discovered:** 2026-01-29
  - **Files:** `supabase/migrations/`

- **[Story 4-6]** Clarify `submitted_at` semantics for deadline enforcement
  - **Why:** Business must decide which timestamp governs deadline: `created_at` (upload initiated), `submitted_at` (confirmed), or `updated_at` (last modified).
  - **Priority:** Low
  - **Suggested Epic:** Business logic / Deadline enforcement
  - **Discovered:** 2026-01-29
  - **Files:** `supabase/functions/confirm-submission/index.ts:96`

- **[Story 4-6]** Add explicit UI state for `uploading` status on preview page
  - **Why:** Navigating to preview page during active upload shows no guidance. Edge case (upload flow navigates only after completion).
  - **Priority:** Low
  - **Discovered:** 2026-01-29
  - **Files:** `src/pages/participant/SubmissionPreviewPage.tsx:87-89`

- **[Story 4-6]** Use HTTP 409 Conflict for already-confirmed submissions
  - **Why:** `confirm-submission` returns HTTP 400 with `ALREADY_CONFIRMED`. 409 is more semantically correct. Would require project-wide error convention update.
  - **Priority:** Low
  - **Discovered:** 2026-01-29
  - **Files:** `supabase/functions/confirm-submission/index.ts:143-155`, `src/features/submissions/hooks/useConfirmSubmission.ts:44`

- **[Story 4-6]** Align nullable types between Edge Function response and TypeScript interface
  - **Why:** `get-submission` returns nullable `category?.name ?? null` but TypeScript type is non-nullable. Impossible at runtime due to FK constraint.
  - **Priority:** Low
  - **Discovered:** 2026-01-29
  - **Files:** `supabase/functions/get-submission/index.ts:152-153`, `src/features/submissions/hooks/useSubmissionPreview.ts:6-17`

- **[Story 4-6]** Add focus trap to PhotoLightbox for WCAG compliance
  - **Why:** Has Escape close, backdrop click, role="dialog", aria-modal="true" — but Tab key can move focus behind modal.
  - **Priority:** Low
  - **Suggested Epic:** Accessibility
  - **Discovered:** 2026-01-29
  - **Files:** `src/features/submissions/components/PhotoLightbox.tsx:44-69`

- **[Story 4-7]** TOCTOU race condition in withdraw-submission Edge Function
  - **Why:** Withdraw reads submission + category, validates, then deletes separately. Another request could modify state between read and delete.
  - **Priority:** Medium
  - **Suggested Epic:** Security hardening / Pre-production
  - **Discovered:** 2026-01-30
  - **Files:** `supabase/functions/withdraw-submission/index.ts:90-207`
  - **Notes:** Needs RPC wrapping read+validate+delete in single transaction. Low practical risk (single participant, low concurrency).

- **[Story 4-7]** No path traversal validation on Bunny Storage path derivation
  - **Why:** Photo deletion constructs storage path via `media_url.replace(cdnPrefix, '')`. Manipulated `media_url` with `../` could target unintended paths.
  - **Priority:** Medium
  - **Suggested Epic:** Security hardening / Pre-production
  - **Discovered:** 2026-01-30
  - **Files:** `supabase/functions/withdraw-submission/index.ts:176`, `supabase/functions/upload-photo/index.ts:187`
  - **Notes:** Risk is low — `media_url` written by server-side code only.

- **[Story 4-7]** Withdraw does not validate submission status before deletion
  - **Why:** An `uploading` status submission (active upload in progress) can be withdrawn, potentially orphaning in-progress uploads.
  - **Priority:** Low
  - **Discovered:** 2026-01-30
  - **Files:** `supabase/functions/withdraw-submission/index.ts:90-109`

- **[Story 4-7]** Lock reason determined client-side from raw category fields
  - **Why:** `get-submission` returns raw `categoryDeadline` and `categoryStatus`; client derives `isLocked`. Could be computed server-side as enum.
  - **Priority:** Low
  - **Discovered:** 2026-01-30
  - **Files:** `supabase/functions/get-submission/index.ts:135-155`, `src/features/submissions/hooks/useSubmissionPreview.ts:57-60`

- **[Story 4-7]** No Zod/runtime validation on Edge Function response shapes
  - **Why:** Client hooks trust that Edge Function responses match TypeScript interfaces. Malformed response would cause runtime errors.
  - **Priority:** Low
  - **Suggested Epic:** Pre-production hardening
  - **Discovered:** 2026-01-30
  - **Files:** `src/features/submissions/hooks/useWithdrawSubmission.ts:25-28`, `src/features/submissions/hooks/useSubmissionPreview.ts:35-55`
  - **Notes:** Project-wide concern — consider adding Zod schemas for all Edge Function responses.

- **[Story 4-7]** Test mock shapes are incomplete (cast-based mocking)
  - **Why:** Tests use `as unknown as ReturnType<>` casts. New fields won't cause test failures if code starts using them.
  - **Priority:** Low
  - **Discovered:** 2026-01-30
  - **Files:** `src/pages/participant/SubmissionPreviewPage.test.tsx`, `src/features/submissions/hooks/useWithdrawSubmission.test.ts`

---

## Epic 5: Judging & Evaluation Workflow

- **[Story 5-1]** Add explicit role check in get_submissions_for_review RPC
  - **Why:** RPC verifies `assigned_judge_id = auth.uid()` but doesn't explicitly check `profiles.role = 'judge'`. Not a vulnerability — extra defense-in-depth.
  - **Priority:** Low
  - **Suggested Epic:** Security hardening / Pre-production
  - **Discovered:** 2026-01-31
  - **Files:** `supabase/migrations/20260131020611_create_get_submissions_for_review_rpc.sql`

- **[Story 5-1]** Add aria-label to SubmissionCard button role
  - **Why:** Has `role="button"` and keyboard handling but no explicit `aria-label` for screen readers.
  - **Priority:** Low
  - **Suggested Epic:** Accessibility
  - **Discovered:** 2026-01-31
  - **Files:** `src/features/reviews/components/SubmissionCard.tsx:30-33`

- **[Story 5-1]** Update PROJECT_INDEX.md reviews exports
  - **Why:** Reviews feature barrel exports not documented in PROJECT_INDEX.md.
  - **Priority:** Low
  - **Discovered:** 2026-01-31
  - **Files:** `PROJECT_INDEX.md`, `src/features/reviews/index.ts`

- **[Story 5-2]** Add error state for submissions fetch in SubmissionReviewPage
  - **Why:** If `useSubmissionsForReview` returns an error, page redirects as if submission not found instead of showing error with retry.
  - **Priority:** High
  - **Discovered:** 2026-01-31
  - **Files:** `src/pages/judge/SubmissionReviewPage.tsx:101-109`

- **[Story 5-2]** Add Bunny Stream embed fallback when mediaUrl is null but bunnyVideoId exists
  - **Why:** Edge case — doesn't occur in practice since finalize-upload always sets mediaUrl. Only triggers if upload finalization has a bug.
  - **Priority:** Low
  - **Discovered:** 2026-01-31
  - **Files:** `src/features/reviews/components/MediaViewer.tsx`

- **[Story 5-2]** Disable keyboard navigation while save mutation is pending
  - **Why:** ArrowLeft/ArrowRight handler doesn't check `isPending`. Rapid presses could trigger overlapping saves. No data corruption (upsert idempotent) but wasteful.
  - **Priority:** Low
  - **Discovered:** 2026-01-31
  - **Files:** `src/pages/judge/SubmissionReviewPage.tsx:82-98`

- **[Story 5-2]** Add aria-pressed or radiogroup semantics to RatingDisplay tier buttons
  - **Why:** Rating tiers function as exclusive selection but rendered as plain buttons. Need `role="radiogroup"` + `role="radio"` + `aria-checked`.
  - **Priority:** Low
  - **Suggested Epic:** Accessibility
  - **Discovered:** 2026-01-31
  - **Files:** `src/features/reviews/components/RatingDisplay.tsx`

- **[Story 5-4]** Debounced auto-save fires without dirty check
  - **Why:** `handleFeedbackChange` debounce fires even if typed text reverts to original saved value — one redundant upsert. Add `isDirty` guard.
  - **Priority:** Critical (per Epic 5/6 retro assessment)
  - **Discovered:** 2026-01-31
  - **Files:** `src/pages/judge/SubmissionReviewPage.tsx:146`

- **[Story 5-4]** In-flight save de-duplication — navigation save can overlap performSave
  - **Why:** If a rating auto-save is still in-flight when user clicks "Save & Next", both writes fire concurrently. Benign with upsert but wasteful. Route nav saves through `performSave` or guard on `savingRef`.
  - **Priority:** Critical (per Epic 5/6 retro assessment)
  - **Discovered:** 2026-01-31
  - **Files:** `src/pages/judge/SubmissionReviewPage.tsx:164`

- **[Story 5-4]** Fake timers in auto-save tests
  - **Why:** Timer-based tests use real timers — slow and flaky. Switch to `vi.useFakeTimers()`.
  - **Priority:** Medium
  - **Discovered:** 2026-01-31
  - **Files:** `src/pages/judge/SubmissionReviewPage.test.tsx`

- **[Story 5-4]** Restore deleted test coverage from Story 5-2
  - **Why:** 5 Story 5.2 tests removed without full replacement — missing: "Next/Save & Next disabled on last submission", "auto-save before backward navigation when dirty", "does not auto-save during navigation when not dirty".
  - **Priority:** Medium
  - **Discovered:** 2026-01-31
  - **Files:** `src/pages/judge/SubmissionReviewPage.test.tsx`

- **[Story 5-4]** Misleading variable name `nextUnreviewed`
  - **Why:** Can return a reviewed submission as fallback. Rename to `nextNavigationTarget` or split into separate variables.
  - **Priority:** Medium
  - **Discovered:** 2026-01-31
  - **Files:** `src/pages/judge/SubmissionReviewPage.tsx:48-54`

- **[Story 5-4]** Feedback textarea maxLength
  - **Why:** No `maxLength` attribute — no guard against excessively long input. Add reasonable limit (e.g., 2000 chars).
  - **Priority:** Medium
  - **Discovered:** 2026-01-31
  - **Files:** `src/pages/judge/SubmissionReviewPage.tsx:269`

- **[Story 5-4]** Radiogroup keyboard pattern (WAI-ARIA)
  - **Why:** Tier and score radio buttons use Tab between items instead of Arrow keys per WAI-ARIA Authoring Practices.
  - **Priority:** Medium
  - **Suggested Epic:** Accessibility
  - **Discovered:** 2026-01-31
  - **Files:** `src/features/reviews/components/RatingDisplay.tsx`

- **[Story 5-4]** Brittle keyboard tab-order test
  - **Why:** RatingDisplay keyboard test hard-codes 5 tab presses — breaks if DOM structure changes.
  - **Priority:** Low
  - **Discovered:** 2026-01-31
  - **Files:** `src/features/reviews/components/RatingDisplay.test.tsx`

- **[Story 5-4]** Render-phase state sync could use useEffect
  - **Why:** Submission sync block sets state during render body. Works correctly but could be moved to `useEffect` for clarity.
  - **Priority:** Low
  - **Discovered:** 2026-01-31
  - **Files:** `src/pages/judge/SubmissionReviewPage.tsx:74`

- **[Story 5-4]** Non-null assertion on `submissions!.length`
  - **Why:** Suppresses compiler safety. Replace with `submissions?.length ?? 0`.
  - **Priority:** Low
  - **Discovered:** 2026-01-31
  - **Files:** `src/pages/judge/SubmissionReviewPage.tsx:231`

- **[Story 5-4]** Dead CSS class `transition-opacity` on "Saved" span
  - **Why:** Element is unmounted, not faded. Remove class or implement actual fade-out animation.
  - **Priority:** Low
  - **Discovered:** 2026-01-31
  - **Files:** `src/pages/judge/SubmissionReviewPage.tsx:279`

- **[Story 5-5]** Filter ranking pool to exclude unreviewed submissions
  - **Why:** Direct URL navigation bypasses entry gate and could expose unreviewed entries. Add `.filter(s => s.reviewId !== null)`.
  - **Priority:** Medium
  - **Suggested Epic:** Defensive hardening
  - **Discovered:** 2026-02-01
  - **Files:** `src/pages/judge/RankingPage.tsx:97-104`

- **[Story 5-5]** Custom KeyboardSensor coordinateGetter for slot-based DnD
  - **Why:** Default keyboard behavior moves overlay by pixel increments instead of snapping between 3 drop zones. AC7 flow works partially but isn't polished.
  - **Priority:** Medium
  - **Suggested Epic:** Accessibility
  - **Discovered:** 2026-02-01
  - **Files:** `src/pages/judge/RankingPage.tsx:83-88`

- **[Story 5-5]** Visible helper text when "Proceed to Ranking" button is disabled
  - **Why:** Helper text is `sr-only`. Sighted users see disabled button with no visible explanation.
  - **Priority:** Low
  - **Suggested Epic:** UX polish
  - **Discovered:** 2026-02-01
  - **Files:** `src/pages/judge/CategoryReviewPage.tsx:156-158`

- **[Story 5-6]** Lock down `notify-admin-category-complete` Edge Function to assigned judge
  - **Why:** Only verifies caller is authenticated, NOT that `auth.uid()` matches `assigned_judge_id`. Any authenticated user could trigger spam admin emails.
  - **Priority:** High
  - **Suggested Epic:** Security hardening / Pre-production
  - **Discovered:** 2026-02-01
  - **Files:** `supabase/functions/notify-admin-category-complete/index.ts:23-43`
  - **Notes:** Fix: add check that `categories.assigned_judge_id = user.id` after fetching category.

- **[Story 5-6]** Prevent admin notification email when `judging_completed_at` is NULL
  - **Why:** Edge Function falls back to `new Date().toLocaleString()` — fabricated timestamp instead of failing fast. Should reject when category not actually completed.
  - **Priority:** Medium
  - **Discovered:** 2026-02-01
  - **Files:** `supabase/functions/notify-admin-category-complete/index.ts:128-130`

- **[Story 5-6]** RankingPage read-only mode tests
  - **Why:** Task 11.4 in story spec calls for tests covering read-only mode. Tests were never implemented.
  - **Priority:** Medium
  - **Discovered:** 2026-02-01
  - **Files:** `src/pages/judge/RankingPage.test.tsx`

- **[Story 5-6]** SubmissionReviewPage read-only mode tests
  - **Why:** `isReadOnly` state disables rating and changes navigation but has no test coverage.
  - **Priority:** Low
  - **Discovered:** 2026-02-01
  - **Files:** `src/pages/judge/SubmissionReviewPage.test.tsx`

- **[Story 5-1/5-4]** Stale story status fields
  - **Why:** Story files 5-1 and 5-4 still show "in-progress" status. Should be updated to done.
  - **Priority:** Low
  - **Discovered:** 2026-02-01
  - **Files:** `_bmad-output/implementation-artifacts/5-1-judge-review-dashboard.md`, `_bmad-output/implementation-artifacts/5-4-rating-feedback-form.md`

---

## Epic 6: Admin Oversight & Results Publication

- **[Story 6-1]** AC #2 table row shows TLC name but not TLC email
  - **Why:** AC #2 specifies both. Email is accessible in detail panel (1 click). Adding both to table is cramped on mobile.
  - **Priority:** Low
  - **Suggested Epic:** UX polish
  - **Discovered:** 2026-02-01
  - **Files:** `src/features/submissions/components/AdminSubmissionsTable.tsx:61`

- **[Story 6-1]** `src/pages/index.ts` missing export for `AdminSubmissionsPage`
  - **Why:** Pages barrel file incomplete — also missing `ContestDetailPage` and judge pages from Epics 3-5. Router uses lazy imports directly.
  - **Priority:** Low
  - **Discovered:** 2026-02-01
  - **Files:** `src/pages/index.ts`

- **[Story 6-2]** Side-by-side submission comparison view (AC #5 deferred)
  - **Why:** Requires significant new UX (multi-select, comparison layout). Table shows rating/rank columns and detail panel shows full review data — admin has visibility without side-by-side.
  - **Priority:** Medium
  - **Suggested Epic:** UX enhancement / Admin tools
  - **Discovered:** 2026-02-01
  - **Files:** `src/pages/admin/AdminSubmissionsPage.tsx`

- **[Story 6-2]** Feedback Preview column missing from AdminSubmissionsTable
  - **Why:** Review identified this as missing from the submissions table. Admin must open detail panel to see feedback.
  - **Priority:** High
  - **Discovered:** 2026-02-01
  - **Files:** `src/features/submissions/components/AdminSubmissionsTable.tsx`

- **[Story 6-2]** Hook tests mock API rather than asserting query shape
  - **Why:** Tests verify mock wiring instead of real query behavior.
  - **Priority:** Medium
  - **Discovered:** 2026-02-01
  - **Files:** Epic 6 hook test files

- **[Story 6-3]** Harden trigger bypass logic to explicitly check admin override columns
  - **Why:** Triggers use allowlist approach (check all known non-override columns unchanged). If future columns added without updating triggers, new columns could be modified on completed categories. Positive check would be more defensive.
  - **Priority:** Low
  - **Suggested Epic:** Security hardening / Pre-production
  - **Discovered:** 2026-02-01
  - **Files:** `supabase/migrations/20260201162435_add_admin_override_columns.sql:17-42, 44-68`

- **[Story 6-5]** Category approval link goes to submissions instead of rankings
  - **Why:** Category name link in approval list routes to submissions page instead of rankings page.
  - **Priority:** Critical
  - **Discovered:** 2026-02-01
  - **Files:** `src/features/contests/components/CategoryApprovalList.tsx`

- **[Story 6-5]** PROJECT_INDEX.md not updated with winners components
  - **Why:** Winners feature components, hooks, API not documented in PROJECT_INDEX.md.
  - **Priority:** Critical
  - **Discovered:** 2026-02-01
  - **Files:** `PROJECT_INDEX.md`, `src/features/winners/`

- **[Story 6-5]** Regenerate Winners Page flow with re-approval enforcement (AC9)
  - **Why:** AC9 specifies re-approval of modified categories and stable URL. Needs schema changes for modification tracking, new API logic, new UI flow. Current implementation covers generate-once happy path.
  - **Priority:** Medium
  - **Suggested Epic:** Admin tools / Winners management
  - **Discovered:** 2026-02-01
  - **Files:** `src/features/contests/components/WinnersSetupForm.tsx`, `src/features/contests/api/winnersApi.ts`

- **[Story 6-5]** Approval-category detail view embedded in Winners tab (AC2)
  - **Why:** AC2 specifies viewing submissions/ratings/rankings inline during approval. Category links to existing AdminCategoryRankingsPage — data accessible but requires navigation.
  - **Priority:** Low
  - **Discovered:** 2026-02-01
  - **Files:** `src/features/contests/components/CategoryApprovalList.tsx`

- **[Story 6-5]** Disable Generate button until password form is valid
  - **Why:** Currently enabled with empty fields — Zod validation prevents submission and shows errors. Some teams prefer disabling.
  - **Priority:** Low
  - **Discovered:** 2026-02-01
  - **Files:** `src/features/contests/components/WinnersSetupForm.tsx:313-316`

- **[Story 6-5]** Review count query scans all reviews (not contest-scoped)
  - **Why:** Query returns review counts across all reviews rather than scoping to the current contest.
  - **Priority:** Medium
  - **Discovered:** 2026-02-01
  - **Files:** `src/features/contests/api/winnersApi.ts`

- **[Story 6-5]** Approval count copy missing from pre-generate message
  - **Why:** Pre-generate confirmation message doesn't show how many categories are approved.
  - **Priority:** Low
  - **Discovered:** 2026-02-01
  - **Files:** `src/features/contests/components/WinnersSetupForm.tsx`

- **[Story 6-6]** Server-side rate limiting on password validation endpoint
  - **Why:** `validate-winners-password` has no server-side rate limiting. Client-side rate limiting is trivially bypassable. Passwords likely short — brute-force possible via direct API calls.
  - **Priority:** Critical (scope)
  - **Suggested Epic:** Security hardening / Pre-production
  - **Discovered:** 2026-02-01
  - **Files:** `supabase/functions/validate-winners-password/index.ts`
  - **Notes:** Explicitly out of scope per story spec ("client-side only for MVP"). Add KV-based or IP-based throttling.

- **[Story 6-6]** Edge Functions not deployed (validate-winners-password, get-contest-public-metadata)
  - **Why:** Code is ready but deployment is an ops step. Deploy when ready to release.
  - **Priority:** High
  - **Suggested Epic:** Deployment / Ops
  - **Discovered:** 2026-02-01
  - **Files:** `supabase/functions/validate-winners-password/`, `supabase/functions/get-contest-public-metadata/`

- **[Story 6-6]** XSS risk via iframe src from database content
  - **Why:** `VideoPlayerDialog.tsx` interpolates `mediaUrl` from DB directly into iframe `src`. Low risk — admin-only data, same pattern in `MediaViewer.tsx`.
  - **Priority:** Low
  - **Discovered:** 2026-02-01
  - **Files:** Winners `VideoPlayerDialog.tsx`
  - **Notes:** Fix: add URL origin allowlist check (`iframe.mediadelivery.net`) before rendering iframe.

- **[Story 6-6]** sessionStorage stores winners data without TTL
  - **Why:** Full winners response persists for browser tab session even if admin revokes page. `sessionStorage` clears on tab close (intended).
  - **Priority:** Low
  - **Discovered:** 2026-02-01
  - **Files:** `src/features/winners/`
  - **Notes:** Fix: compare stored timestamp against TTL (e.g., 1 hour) and re-validate if expired.

- **[Story 6-6]** Cover image has no lazy loading or error handling
  - **Why:** No `loading` attribute, no `onError` handler. Broken URLs show browser's default broken image indicator.
  - **Priority:** Low
  - **Discovered:** 2026-02-01
  - **Files:** `src/features/winners/components/PublicWinnersPage.tsx`

- **[Story 6-7]** `get-participant-categories` does not handle query-level errors for submissions lookup
  - **Why:** Submissions query doesn't check for errors — if query fails, `submissionsAvailable` remains `true` and response may contain incorrect data. Pre-existing from Story 4-3.
  - **Priority:** Low
  - **Suggested Epic:** Defensive hardening / Pre-production
  - **Discovered:** 2026-02-01
  - **Files:** `supabase/functions/get-participant-categories/index.ts`

---

## Epic 7: Email Notification System

*No items tracked*

---

## Cross-Cutting Technical Debt

- **[Story 3-2]** Test import pattern — unusual `import * as categoriesApi` then `categoriesApi.categoriesApi.updateStatus`
  - **Priority:** Low
  - **Discovered:** 2026-01-26
  - **Files:** `src/features/categories/hooks/useUpdateCategoryStatus.test.tsx:32`

- **[Pre-existing]** Test infrastructure missing Supabase env vars — 8 test suites fail
  - **Priority:** Medium
  - **Discovered:** 2026-01-26
  - **Files:** `src/lib/supabase.ts`, various test files

- **[Cross-cutting]** Wildcard CORS on all Edge Functions
  - **Priority:** Critical (pre-production)
  - **Notes:** Tracked under Story 4-1 and 4-6 above. Should be a single coordinated fix across all Edge Functions.

- **[Cross-cutting]** No Zod/runtime validation on Edge Function responses
  - **Priority:** Low
  - **Notes:** Tracked under Story 4-7 above. Project-wide pattern improvement.

- **[Cross-cutting]** All story documentation files (File Lists, Dev Agent Records) incomplete
  - **Priority:** Low
  - **Notes:** Flagged in 4 consecutive retrospectives. Process concern, not code.

---

## Notes

- Keep descriptions concise and actionable
- Include enough context for future review
- Update priorities as project evolves
- Review this document during retrospectives and sprint planning
- **All items are post-delivery concerns** — not blocking current development
- **This is the ONLY future-work file** — no per-story future-work files
