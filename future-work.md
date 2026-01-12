# Future Work

- Validate contest code character set in API layer or add a DB check constraint to prevent 0/O/1/I codes. (src/features/contests/api/contestsApi.ts)
- Expand contest detail page to show contest name, code, and status so the post-create redirect confirms AC3 intent. (src/pages/admin/ContestDetailPage.tsx)
- Replace React namespace type usage in tests with type-only imports. (src/features/contests/components/CreateContestForm.test.tsx)

## Story 2-4 Review Items

- **Mobile empty state CTA accessibility**: Validate that the "Create your first contest" button Sheet trigger is accessible and visible on mobile devices. Consider adding a11y tests. (src/pages/admin/ContestsPage.tsx:101)
- **API unit tests for contestsApi**: Add direct unit tests for contestsApi.update(), updateStatus(), and delete() methods with mocked Supabase. Currently only covered by component integration tests. (src/features/contests/api/contestsApi.ts)
- **Cover image upload**: Requires Bunny Storage infrastructure integration. Deferred from AC4 - consider bundling with Bunny Stream setup in Epic 4 (Participant Submission). Currently uses placeholder URLs. (src/features/contests/api/contestsApi.ts, src/features/contests/components/EditContestForm.tsx)
