# Epic 5 Retrospective: Judging & Evaluation Workflow

**Epic Completed:** 2026-02-01
**Stories Completed:** 6/6
**Implementation Time:** ~2 days (2026-01-31 to 2026-02-01)
**Test Suite Growth:** 624 → ~780 tests (+25%)

---

## Epic Summary

| Story | Name | Deliverables |
|-------|------|--------------|
| 5-1 | Judge Review Dashboard | `reviews` table, `get_submissions_for_review` RPC, CategoryReviewPage, SubmissionCard, ReviewProgress, SubmissionFilter |
| 5-2 | Anonymous Submission View | SubmissionReviewPage, MediaViewer, RatingDisplay (basic), useUpsertReview, keyboard nav, auto-save on navigate |
| 5-3 | Media Playback (Photo & Video) | PhotoZoomViewer (zoom/pan/pinch), video error handling + retry, loading states, Bunny Stream controls hint |
| 5-4 | Rating & Feedback Form | Granular score selection within tiers, debounced feedback auto-save, "Saved" indicator, rating validation on navigation, "Save & Next" |
| 5-5 | Top 3 Ranking (Drag & Drop) | `rankings` table, @dnd-kit integration, RankingSlot, DraggableSubmissionCard, RankingPage, rating hierarchy constraint, "Proceed to Ranking" gate |
| 5-6 | Mark Category Complete & Notify Admin | `judging_completed_at` column, `mark_category_complete` RPC, `notify-admin-category-complete` Edge Function, DB triggers (prevent modification on completed), read-only mode across all judge pages, "Complete" badge on dashboard |

---

## What Went Well

### 1. Fastest Epic Delivery Yet
- 6 stories in ~2 days, surpassing Epic 4 (7 stories in ~4 days)
- Established patterns from Epics 1-4 (Edge Functions, TanStack Query, RPC, component structure) became velocity multipliers
- By mid-epic, development was assembling known patterns rather than inventing new ones

### 2. Adversarial Reviews Catching Real Bugs
- Story 5-4: Caught stale closure bugs in debounced auto-save (F1-F6 all fixed)
- Story 5-1: RPC GRANT/REVOKE hardening, null guard on API data, auth error distinction
- Story 5-3: iframe onError handling, touch device expand button visibility
- Fix rates improving: 5-3 hit 71%, 5-6 addressed all findings
- ~55 findings across 6 stories, ~22 fixed in-story — conscious triage, not neglect

### 3. Architecture Patterns Compounding
- N+1 query fix from Epic 3 retro delivered via `get_submissions_for_review` RPC in Story 5-1
- Edge Function template from Epic 4 made `notify-admin-category-complete` straightforward
- Submission data model from Epic 4 reused directly for judge review flow
- PhotoLightbox pattern from Epic 4 informed PhotoZoomViewer design

### 4. Defense-in-Depth on Completion
- Database triggers block review/ranking modifications on completed categories
- Frontend read-only mode disables editing across all judge pages
- RPC validates prerequisites (all reviewed, 3 rankings) before marking complete
- Two independent layers — even if frontend has a gap, database rejects unauthorized changes

### 5. Test Suite Growth
- 624 → ~780 tests across 6 stories (+25% growth)
- Consistent co-located unit tests for every new component and hook
- Pre-existing DashboardPage test failure (lingering since Story 4-7) fixed in Story 5-1

---

## What Could Be Improved

### 1. Quality Gates Consuming 80-90% of Delivery Time (CRITICAL)

**Issue:** Every story's quality gate runs `npm run test` — the full test suite with no scoping. Developers completed coding in 5-10 minutes, adversarial review + fixes in ~10 minutes, but quality gates took 45-50 minutes. Sometimes the server overloaded and gates crashed without completing.

**Root Cause:** `npm run test` invokes Vitest with no filters. It scans every `*.test.ts` and `*.test.tsx` across the entire project. By Story 5-6, that's ~780 tests in 68+ test files.

**Impact by story:**

| Story | Files Modified | Tests Run | Tests Relevant | Waste |
|-------|---------------|-----------|----------------|-------|
| 5-1 | ~20 files | 624 | ~58 | 91% |
| 5-2 | ~12 files | ~640 | ~50 | 92% |
| 5-3 | 6 files | 680 | ~19 | 97% |
| 5-4 | 4 files | 699 | ~19 | 97% |
| 5-5 | ~26 files | 735 | ~55 | 93% |
| 5-6 | ~15 files | ~780 | ~45 | 94% |

**Resolution:** Replace `npm run test` with `npx vitest run --changed` in all quality gates. Vitest natively detects changed files via git and runs only affected tests. Full suite runs at epic boundaries only.

**Updated quality gate standard:**
```bash
npm run build              # ~30s, keep as-is
npm run lint               # ~15s, keep as-is
npm run type-check         # ~15s, keep as-is
npx vitest run --changed   # Scoped to changed files — seconds, not minutes
```

### 2. Incomplete Dev Agent Records (3rd Consecutive Retro)

**Issue:** Stories 5-2 and 5-6 have completely empty Dev Agent Records (agent model, completion notes, file list all blank/placeholders). Stories 5-1 and 5-4 still show status "in-progress" instead of "done".

**History:** This was flagged in Epic 3 retro and Epic 4 retro. Still not resolved.

**Action:** Make Dev Agent Record completion mandatory — no story marked done without populated records.

### 3. Epic 4 Action Items — Partial Follow-Through

| # | Action Item | Status |
|---|-------------|--------|
| 1 | Fill in Dev Agent Record consistently | ❌ Not Addressed |
| 2 | Maintain future-work.md as living document | ✅ Completed |
| 3 | Comprehensive future-work.md roundup after all epics | ⏳ Ongoing |
| 4 | Full security assessment after roundup | ❌ Not yet applicable |
| 5 | CI/GitHub Actions, ops runbook, test:quick, accessibility audit | ❌ Not Addressed |
| 6 | Fix DashboardPage test failure in Epic 5 | ✅ Fixed in 5-1 |

**Score: 2 completed, 1 in progress, 3 not addressed.**

### 4. Edge Function Auth Gap

**Issue:** `notify-admin-category-complete` Edge Function only verifies the caller is authenticated (valid JWT), but does NOT verify `auth.uid()` matches `categories.assigned_judge_id`. Any authenticated user could call the endpoint and trigger admin notification emails.

**Priority:** HIGH — must fix before Epic 6 adds more admin-facing endpoints.

---

## Patterns Established

### Scoped Test Runs (NEW — from this retro)
```bash
# Per-story quality gate:
npx vitest run --changed    # Only tests affected by git changes

# Epic boundary (after last story):
npm run test                # Full suite
```

### RPC for Complex Queries
```
Client → supabase.rpc('function_name', params) → SECURITY DEFINER function
- Column-level control (anonymous judging)
- Auth validation inside function
- REVOKE public, GRANT to authenticated
```

### Defense-in-Depth for State Enforcement
```
Layer 1: Frontend — UI disables editing (read-only mode)
Layer 2: Database — Triggers block modifications (RAISE EXCEPTION)
Layer 3: RPC — Validates prerequisites before state transitions
```

### Adversarial Review Triage
- CRITICAL/HIGH findings: Fix in-story
- MEDIUM: Fix if quick, defer if not
- LOW: Defer to future-work.md
- Track all deferred items with file references

---

## Deferred Items

| Source | Description | Priority | Target |
|--------|-------------|----------|--------|
| 5-1 | Role check in get_submissions_for_review RPC | Low | Security hardening |
| 5-1 | aria-label on SubmissionCard | Low | Accessibility |
| 5-2 | Error state for submissions fetch in SubmissionReviewPage | High | Bug fix |
| 5-2 | Disable keyboard nav while save pending | Low | UX polish |
| 5-2 | ARIA radiogroup semantics on RatingDisplay | Low | Accessibility |
| 5-4 | Debounced auto-save no-change guard | Critical | future-work.md |
| 5-4 | In-flight save de-duplication | Critical | future-work.md |
| 5-5 | Filter ranking pool to exclude unreviewed | Medium | Defensive hardening |
| 5-5 | Custom KeyboardSensor coordinateGetter | Medium | Accessibility |
| 5-5 | Visible helper text on disabled Proceed to Ranking | Low | UX polish |
| 5-6 | Edge Function auth lockdown | High | Security hardening |
| 5-6 | Prevent email when judging_completed_at NULL | Medium | Security hardening |
| 5-6 | RankingPage read-only mode tests | Medium | Test coverage |
| 5-6 | SubmissionReviewPage read-only mode tests | Low | Test coverage |

---

## Action Items

### Process Improvements

1. **[CRITICAL] Update quality gate to use scoped test runs**
   - Owner: Bob (Scrum Master)
   - Action: Update project-context.md and story template — replace `npm run test` with `npx vitest run --changed` for per-story gates. Full suite runs at epic boundaries only.
   - Success criteria: All Epic 6 stories use scoped test runs. Per-story quality gate completes in under 5 minutes total.

2. **[HIGH] Add full-suite test run at epic boundaries**
   - Owner: Dana (QA Engineer)
   - Action: Run full `npm run test` once after the last story of each epic.
   - Success criteria: Full suite passes after Epic 6 final story.

3. **[MEDIUM] Enforce Dev Agent Record completion**
   - Owner: Amelia (Dev Agent)
   - Action: No story marked done without populated agent model, completion notes, and file list.
   - Success criteria: Zero empty Dev Agent Records in Epic 6.

### Technical Debt

4. **[HIGH] Fix Edge Function auth on notify-admin-category-complete**
   - Owner: Charlie (Senior Dev)
   - Action: Add `assigned_judge_id = auth.uid()` check and `judging_completed_at IS NOT NULL` validation.
   - Files: `supabase/functions/notify-admin-category-complete/index.ts`
   - Success criteria: Unauthenticated/unauthorized callers rejected with 403.

5. **[HIGH] Verify DB trigger compatibility with admin overrides (Epic 6 prerequisite)**
   - Owner: Charlie (Senior Dev)
   - Action: Confirm `prevent_review_modification_on_completed` and `prevent_ranking_modification_on_completed` triggers don't block admin override column additions from Story 6.3.
   - Success criteria: Admin can write to `admin_feedback_override` and `admin_ranking_override` columns on completed categories without trigger exceptions.

### Documentation

6. **[LOW] Update stale story status fields**
   - Owner: Bob (Scrum Master)
   - Action: Update 5-1 and 5-4 status from "in-progress" to "done".

### Team Agreements

- Quality gates run **scoped tests only** per story (`npx vitest run --changed`); full suite at epic boundary
- Adversarial reviews continue on every story
- future-work.md continues as living document with priority triage
- Dev Agent Record is mandatory before marking story done

---

## Impact on Epic 6

**Reusable from Epic 5:**
- `reviews` table + RLS policies (admin full access already in place)
- `rankings` table + RLS policies (admin full access already in place)
- `judging_completed_at` flag on categories
- `mark_category_complete` RPC pattern (reference for new admin RPCs)
- `notify-admin-category-complete` Edge Function template (reference for new notifications)
- Read-only enforcement pattern (DB triggers + frontend checks)
- @dnd-kit drag-and-drop pattern (admin ranking overrides in 6.3)
- Rating tier display components (admin view of judge ratings in 6.2)

**New for Epic 6:**
- Admin override columns on reviews and rankings tables
- Category approval flow for winners page
- Password-protected public page (winners)
- Session-based auth for public viewers
- Rate-limited downloads
- Disqualification workflow with restore capability
- Participant feedback view (post-contest)

**Critical path before Epic 6 starts:**
1. Fix Edge Function auth gap (action item #4)
2. Verify DB trigger compatibility with admin overrides (action item #5)
3. Update project-context.md with scoped test run standard (action item #1)

---

*Retrospective completed: 2026-02-01*
