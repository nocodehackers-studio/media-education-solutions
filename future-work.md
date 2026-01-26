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
