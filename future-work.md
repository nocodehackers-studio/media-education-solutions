# Future Work

- Validate contest code character set in API layer or add a DB check constraint to prevent 0/O/1/I codes. (src/features/contests/api/contestsApi.ts)
- Expand contest detail page to show contest name, code, and status so the post-create redirect confirms AC3 intent. (src/pages/admin/ContestDetailPage.tsx)
- Replace React namespace type usage in tests with type-only imports. (src/features/contests/components/CreateContestForm.test.tsx)
