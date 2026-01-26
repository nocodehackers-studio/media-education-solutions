# Epic 3 Retrospective: Judge Onboarding & Assignment

**Epic Completed:** 2026-01-26
**Stories Completed:** 5/5
**Implementation Time:** ~4 days (2026-01-22 to 2026-01-26)

---

## Epic Summary

| Story | Name | Deliverables |
|-------|------|--------------|
| 3-1 | Assign Judge to Category | Edge Function `create-judge`, AssignJudgeSheet, CategoryCard judge display |
| 3-2 | Judge Invitation Email | Edge Function `send-judge-invitation`, Brevo integration, auto-send on close |
| 3-3 | Judge Password Setup | SetPasswordPage, invite link generation, session validation |
| 3-4 | Judge Login & Dashboard | JudgeDashboardPage, useCategoriesByJudge hook, category cards |
| 3-5 | Admin View Judge Progress | JudgesTab, JudgesTable, JudgeProgressCell, JudgeDetailSheet |

---

## What Went Well

1. **Edge Function Pattern Established**
   - `create-judge` and `send-judge-invitation` established solid patterns for admin-only privileged operations
   - Service role key usage, auth verification, CORS handling documented for reuse

2. **Type System Leverage**
   - `CategoryWithContext` type enabled clean data flow
   - Transform functions consistently applied
   - TypeScript catching issues at compile time

3. **Component Reuse**
   - `AssignJudgeSheet` reused in CategoryCard and JudgesTable
   - Sheet/Card/Badge patterns consistent across features
   - Loading skeletons and error states standardized

4. **Incremental Delivery**
   - Each story built cleanly on previous: profile → invite → password → login → tracking
   - No blockers or rework required

5. **Review Process**
   - Adversarial code reviews found real issues
   - Deferred items properly tracked in `3-4-future-work.md`

---

## What Could Be Improved

### 1. Test Execution Performance (HIGH CONCERN)

**Issue:** Tests are being skipped because they take too long and consume too many local resources.

**Impact:**
- Reduced confidence in code quality
- Potential bugs shipping to production
- Technical debt accumulating silently

**Recommendations:**
- Consider running tests in CI only (GitHub Actions) to offload local resources
- Use `--watch` mode for targeted testing during development
- Split test suites: unit tests (fast) vs integration tests (slow)
- Add `npm run test:quick` script for critical path tests only

### 2. Solo-Dev Workflow Speed vs Quality Trade-off (HIGH CONCERN)

**Issue:** Using solo-dev workflow makes development fast, but raises concerns about code quality.

**Impact:**
- Less rigorous planning phase
- Potential architectural shortcuts
- Review findings may be deferred rather than addressed

**Recommendations:**
- Continue using solo-dev for velocity, but enforce:
  - Mandatory adversarial code review (`/code-review`) before marking done
  - Quality gates (build, lint, type-check) must pass - no exceptions
  - Future-work.md pattern for tracking deferred items
- Consider adding "quality checkpoint" epic before MVP release
- Run full test suite in CI even if skipped locally

### 3. N+1 Query Pattern

**Issue:** `listByJudge()` makes individual count queries per category.

**Decision:** Defer to Epic 5 when reviews table is added - will refactor with RPC.

### 4. Manual Deployment Steps

**Issue:** Edge Function deployment and secret setting still manual.

**Decision:** Manual deployment acceptable for project scale. Document in ops runbook.

### 5. Accessibility

**Decision:** Add accessibility audit as final step after last epic, before MVP release.

---

## Patterns Established

### Edge Function Auth Pattern
```typescript
const authHeader = req.headers.get('Authorization');
const supabaseClient = createClient(url, anonKey, {
  global: { headers: { Authorization: authHeader } }
});
const { data: profile } = await supabaseClient
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();
if (profile?.role !== 'admin') throw new Error('Admin access required');
```

### Supabase Invite Link Generation
```typescript
const { data } = await supabaseAdmin.auth.admin.generateLink({
  type: 'invite',
  email: judgeEmail,
  options: { redirectTo: `${appUrl}/set-password` },
});
```

### Session Type Validation
```typescript
const hashParams = new URLSearchParams(window.location.hash.substring(1));
const type = hashParams.get('type');
const validTypes = ['invite', 'recovery', 'magiclink'];
```

### Role-Based Redirect
```typescript
if (user.role === 'admin') navigate('/admin/dashboard');
else if (user.role === 'judge') navigate('/judge/dashboard');
```

---

## Deferred Items

| ID | Description | Priority | Target |
|----|-------------|----------|--------|
| QA-1 | N+1 submission count queries | Medium | Epic 5 |
| F5 | API unit tests for listByJudge | Medium | Quality checkpoint |
| F9 | Accessibility improvements | Medium | Post-final-epic |
| 3-2 | Deploy Edge Functions + secrets | Manual | Ops runbook |
| QA-2 | Test date brittleness | Low | Quality checkpoint |

---

## Decisions for Future Epics

1. **Deployment:** Manual (acceptable for project scale)
2. **Testing:** Manual E2E, automated unit/integration in CI
3. **N+1 Queries:** Fix in Epic 5 with reviews table
4. **Accessibility:** Audit after final epic, before MVP
5. **Test Performance:** Move heavy tests to CI, keep local tests fast
6. **Code Quality:** Enforce adversarial review + quality gates on every story

---

## Impact on Epic 4

**New patterns needed:**
- ParticipantSessionContext (localStorage + React context, not Supabase Auth)
- Bunny Storage/Stream integration via Edge Functions
- File upload with progress (UploadProgress component)
- Public routes with participant-specific RLS

**Carry forward:**
- Edge Function auth pattern (adapted for participant validation)
- Component state patterns (loading/error/success)
- TanStack Query for API state
- Card-based mobile-first layouts

---

## Action Items

- [ ] Document Edge Function deployment in ops runbook
- [ ] Add `npm run test:quick` script for fast local testing
- [ ] Configure GitHub Actions for full test suite
- [ ] Schedule quality checkpoint epic before MVP
- [ ] Schedule accessibility audit after final epic

---

*Retrospective completed: 2026-01-26*
