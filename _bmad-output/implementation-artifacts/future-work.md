# Future Work & Deferred Items

**Project:** media-education-solutions
**Last Updated:** 2026-01-12

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

---

### Epic 4: Participant Submission Experience
*Items discovered during Epic 4 implementation*

*No items currently tracked*

---

### Epic 5: Judging & Evaluation Workflow
*Items discovered during Epic 5 implementation*

*No items currently tracked*

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
