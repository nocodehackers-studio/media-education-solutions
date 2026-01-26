# Story 3-4: Future Work & Deferred Findings

Findings from adversarial review that were deferred for future consideration.

## Deferred Items

### F4: Type Casting with `as unknown as` (Low Priority)
**Severity:** High (per review) → **Actual:** Low
**Status:** Deferred - Noise

The double-casting through `unknown` is a known TypeScript limitation when working with Supabase's generated types for complex joins. This is a common pattern in the codebase. The runtime shape is validated by the query itself.

**Future consideration:** When Supabase improves type inference for joins, refactor to remove type assertions.

---

### F5: API Unit Tests for `listByJudge()` (Medium Priority)
**Severity:** High
**Status:** Deferred - Future Story

The `listByJudge()` method is tested indirectly through component tests. Direct API tests would improve coverage.

**Future work:** Add `categoriesApi.test.ts` with tests for:
- Successful fetch with categories
- Empty result handling
- Error scenarios
- Submission count fetching

---

### F6: Hook Tests for `useCategoriesByJudge` (Low Priority)
**Severity:** High (per review) → **Actual:** Low
**Status:** Deferred - Noise

Component tests mock the hook, which is the standard pattern in this codebase. TanStack Query hooks are thin wrappers - testing them directly adds minimal value.

---

### F7: Missing staleTime Configuration (Low Priority)
**Severity:** Medium (per review) → **Actual:** Noise
**Status:** Resolved by architecture

Project uses global `queryClient` settings with `staleTime: 30_000`. Per `project-context.md`: "DO NOT OVERRIDE these in individual hooks". The hook correctly inherits global settings.

---

### F9: Accessibility Improvements (Medium Priority)
**Severity:** Medium
**Status:** Deferred - Future Story

The dashboard could benefit from:
- `aria-label` on icon buttons
- `aria-busy` on loading states
- `aria-live` regions for dynamic content
- Semantic HTML (`<main>`, `<section>`)

**Future work:** Create accessibility audit story for judge dashboard.

---

### F10: Memoize Filter Logic (Low Priority)
**Severity:** Medium (per review) → **Actual:** Low
**Status:** Deferred - Premature Optimization

With a typical judge having 2-5 assigned categories, the filter operations are negligible. `useMemo` overhead would outweigh benefits.

**Future consideration:** If judges can have 50+ categories, add memoization.

---

### F11: Memoize handleLogout (Low Priority)
**Severity:** Low
**Status:** Deferred - Minimal Impact

The function is not passed as props, so recreating it on render doesn't cause child re-renders.

---

### F13: Magic Strings for Status (Low Priority)
**Severity:** Low
**Status:** Deferred - TypeScript Catches Errors

The strings match the `CategoryStatus` type. TypeScript will catch any typos at compile time. Creating constants adds indirection without benefit.

---

### F14: Hardcoded Test Dates (Low Priority)
**Severity:** Low
**Status:** Deferred - Acceptable Risk

Tests use dates in 2026. When reached, tests may need updates. This is a minor maintenance item, not a bug.

---

### F15: Loading State During Logout (Low Priority)
**Severity:** Low
**Status:** Deferred - UX Polish

Adding a loading spinner during logout is a nice-to-have but not critical for MVP.

---

## Summary

| ID | Description | Priority | Recommendation |
|----|-------------|----------|----------------|
| F5 | API unit tests | Medium | Create in test coverage story |
| F9 | Accessibility | Medium | Create a11y audit story |
| F4 | Type casting | Low | Wait for Supabase improvements |
| F10 | Memoization | Low | Monitor if categories grow |
| F15 | Logout loading | Low | Add in UX polish pass |
| F6, F7, F11, F13, F14 | Various | Low | No action needed |
