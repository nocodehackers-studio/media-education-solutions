# Future Work

- Validate contest code character set in API layer or add a DB check constraint to prevent 0/O/1/I codes. (src/features/contests/api/contestsApi.ts)
- Expand contest detail page to show contest name, code, and status so the post-create redirect confirms AC3 intent. (src/pages/admin/ContestDetailPage.tsx)
- Replace React namespace type usage in tests with type-only imports. (src/features/contests/components/CreateContestForm.test.tsx)

## Story 2-4 Review Items

- **Mobile empty state CTA accessibility**: Validate that the "Create your first contest" button Sheet trigger is accessible and visible on mobile devices. Consider adding a11y tests. (src/pages/admin/ContestsPage.tsx:101)
- **API unit tests for contestsApi**: Add direct unit tests for contestsApi.update(), updateStatus(), and delete() methods with mocked Supabase. Currently only covered by component integration tests. (src/features/contests/api/contestsApi.ts)
- **Cover image upload**: Requires Bunny Storage infrastructure integration. Deferred from AC4 - consider bundling with Bunny Stream setup in Epic 4 (Participant Submission). Currently uses placeholder URLs. (src/features/contests/api/contestsApi.ts, src/features/contests/components/EditContestForm.tsx)

## Story 2-5 Review Items

- **AC4 tooltip requirement**: Draft option should show tooltip when disabled (submissions exist). Current inline helper text does not meet the spec. (src/features/categories/components/CategoryCard.tsx)
- **Deadline picker date handling**: Selecting a date uses `toISOString()` and disables "today"; this can shift the day for non-UTC users. Store a date-only value or normalize to end-of-day, and allow same-day selection. (src/features/categories/components/CreateCategoryForm.tsx, src/features/categories/components/EditCategoryForm.tsx)
- **Missing interaction tests**: Status dropdown and date picker behaviors are untested due to jsdom limitations; add Playwright coverage for AC4 and deadline selection. (src/features/categories/components/CategoryCard.test.tsx, src/features/categories/components/CreateCategoryForm.test.tsx)

## Story 2-8 Review Items

- **AC1 session/profile failure fallback**: Profile fetch failure leaves session authenticated but profile null, which keeps route guards in a loading state indefinitely. Add a bounded fallback or explicit error state so dashboard doesn't hang. (src/contexts/AuthProvider.tsx, src/router/AdminRoute.tsx, src/router/JudgeRoute.tsx)
- **AC4 manual checklist**: AC4 requires end-to-end manual verification; checklist is deferred and remains incomplete. Run and record results or keep story in-progress until QA completes. (_bmad-output/implementation-artifacts/2-8-epic-2-stabilization-optimization.md)

## Story 3-2 Future Guidance

- **Invite flow on live domain**: When Story 3-2 gets revisited, point the Supabase Edge Function + Brevo secrets at the actual live domain (mes.clients.nocodehackers.es or its final replacement), deploy the function, verify the Brevo sender, and re-run the email delivery checklist before closing. Keep a record of each manual gate so the review can finish cleanly. (_bmad-output/implementation-artifacts/3-2-judge-invitation-email.md)

## Story 4-1 Deferred Items

### Infrastructure/Ops (requires platform configuration)

- **F1 [CRITICAL] Rate limiting**: Add rate limiting to validate-participant Edge Function to prevent brute-force attacks on participant codes. Requires Supabase platform-level configuration or API gateway. (supabase/functions/validate-participant/index.ts)
- **F2 [CRITICAL] CORS restriction**: Replace wildcard CORS (`Access-Control-Allow-Origin: *`) with specific allowed origins for production deployment. (supabase/functions/validate-participant/index.ts)

### Test Coverage Expansion

- **F4 [HIGH] Edge Function tests**: Add unit tests for validate-participant Edge Function covering invalid JSON, malformed codes, error responses. Requires Deno test setup. (supabase/functions/validate-participant/index.ts)
- **F5 [HIGH] ParticipantSessionProvider tests**: Add unit tests covering session persistence, timeout edge cases, race conditions. (src/contexts/ParticipantSessionProvider.tsx)
- **F10 [MEDIUM] ParticipantRoute tests**: Add tests verifying redirect behavior and loading states. (src/router/ParticipantRoute.tsx)

### Security Hardening

- **F6 [HIGH] XSS sanitization**: Sanitize contestName, name, organizationName before rendering. Low risk for MVP (data comes from trusted admins). (src/contexts/ParticipantSessionProvider.tsx, src/pages/participant/ParticipantInfoPage.tsx)
- **F7 [MEDIUM] Session integrity**: Add integrity check (HMAC) to localStorage session to prevent client-side tampering. Backend should validate anyway, but defense-in-depth. (src/contexts/ParticipantSessionProvider.tsx)

### Nice-to-haves

- **F13 [LOW] Configurable timeout**: Move SESSION_TIMEOUT_MS and WARNING_BEFORE_MS to environment variables or config file. (src/contexts/ParticipantSessionProvider.tsx)
- **F14 [LOW] Error boundary**: Add error boundary wrapping participant routes for graceful error handling. (src/router/index.tsx)
- **F16 [LOW] Missing JSDoc**: Add JSDoc explaining why getCustomErrorMessage existed alongside ERROR_MESSAGES (now removed, but pattern may recur).

### QA Review Findings (Deferred)

- **QA-2 [HIGH] Inactivity tracking**: Implement explicit inactivity tracking by calling `updateActivity()` on user interactions and route changes to fully satisfy AC6/AC7. Current implementation relies on page-level activity; add hooks to track form input, navigation, etc. (src/contexts/ParticipantSessionProvider.tsx)
- **QA-4 [MEDIUM] Root route session handling**: Root route (`/`) should detect participant session and redirect authenticated participants to `/participant/info` instead of always showing landing. (src/router/index.tsx)
- **QA-5 [MEDIUM] CodeEntryPage tests**: Add missing integration tests for entry and session flows covering success path, error scenarios, and redirects. (src/pages/participant/CodeEntryPage.test.tsx)
- **QA-6 [MEDIUM] ParticipantSessionProvider tests**: Add unit tests for session provider covering persistence, expiry, and edge cases. (src/contexts/ParticipantSessionProvider.test.tsx)
- **QA-7 [MEDIUM] Story status update**: Update story status and Dev Agent Record/File List to reflect actual implementation work. (_bmad-output/implementation-artifacts/4-1-participant-code-entry-session.md)
- **QA-8 [LOW] Error message punctuation**: Align error message punctuation with AC text (e.g., periods vs no periods). (src/lib/errorCodes.ts)

## Story 5-4 Deferred Review Findings

### Test Quality

- **F7 [MEDIUM] Fake timers in auto-save tests**: Timer-based tests ("Saved fades after 2s", "debounce fires after 1500ms") use real timers, making the suite slow and flaky. Switch to `vi.useFakeTimers()` + `vi.advanceTimersByTime()`. (src/pages/judge/SubmissionReviewPage.test.tsx)
- **F8 [MEDIUM] Restore deleted test coverage**: 5 Story 5.2 tests were removed without full replacement — missing: "Next/Save & Next disabled on last submission", "auto-save before backward navigation when dirty", "does not auto-save during navigation when not dirty". (src/pages/judge/SubmissionReviewPage.test.tsx)
- **F11 [MEDIUM] Brittle keyboard tab-order test**: RatingDisplay keyboard test hard-codes 5 tab presses to reach score buttons — breaks if DOM structure changes. (src/features/reviews/components/RatingDisplay.test.tsx)
- **F13 [LOW] Duplicate placeholder test**: "feedback textarea has correct placeholder text" (Story 5.4) duplicates "shows feedback textarea" (Story 5.2). Remove one. (src/pages/judge/SubmissionReviewPage.test.tsx)

### Code Quality

- **CR-1 [LOW] Debounce fires without dirty check**: `handleFeedbackChange` debounce fires even if typed text reverts to original saved value — one redundant upsert. Add `isDirty` guard inside debounce callback. (src/pages/judge/SubmissionReviewPage.tsx:146)
- **CR-2 [MEDIUM] Navigation save can overlap in-flight performSave**: If a rating auto-save is still in-flight when user clicks "Save & Next", both writes fire concurrently. Benign with upsert semantics but wasteful. Route nav saves through `performSave` or guard on `savingRef`. (src/pages/judge/SubmissionReviewPage.tsx:164)
- **CR-3 [LOW] Render-phase state sync could use useEffect**: Submission sync block sets state during render body. Works correctly per React docs but could be moved to `useEffect` for clarity. (src/pages/judge/SubmissionReviewPage.tsx:74)
- **CR-4 [LOW] Regenerate story File List from git**: File List in story file should be regenerated to include all actually modified files (future-work.md, sprint-status.yaml, story file itself). (_bmad-output/implementation-artifacts/5-4-rating-feedback-form.md)
- **F9 [MEDIUM] Misleading variable name**: `nextUnreviewed` can return a reviewed submission as fallback. Rename to `nextNavigationTarget` or split into separate variables. (src/pages/judge/SubmissionReviewPage.tsx:48-54)
- **F14 [LOW] Non-null assertion**: `submissions!.length` suppresses compiler safety. Replace with `submissions?.length ?? 0` or similar safe access. (src/pages/judge/SubmissionReviewPage.tsx:231)
- **F15 [LOW] Dead CSS class**: `transition-opacity` on "Saved" span does nothing — element is unmounted, not faded. Remove class or implement actual fade-out animation. (src/pages/judge/SubmissionReviewPage.tsx:279)

### Accessibility

- **F10 [MEDIUM] Feedback textarea maxLength**: No `maxLength` attribute on feedback textarea — no guard against excessively long input. Add a reasonable limit (e.g., 2000 chars). (src/pages/judge/SubmissionReviewPage.tsx:269)
- **F12 [MEDIUM] Radiogroup keyboard pattern**: Tier and score radio buttons use Tab between items instead of Arrow keys per WAI-ARIA Authoring Practices. Implement proper radiogroup keyboard interaction where Tab enters/exits the group and Arrow keys navigate within. (src/features/reviews/components/RatingDisplay.tsx)
