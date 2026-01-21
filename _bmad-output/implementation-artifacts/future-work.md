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

*No items currently tracked*

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

<!-- Example:
- **Refactor auth middleware for better testability**
  - **Impact:** Improved test coverage, maintainability
  - **Effort:** Small
  - **Priority:** Medium
-->

*No items currently tracked*

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
