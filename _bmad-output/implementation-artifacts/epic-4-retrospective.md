# Epic 4 Retrospective: Participant Submission Experience

**Epic Completed:** 2026-01-30
**Stories Completed:** 7/7
**Implementation Time:** ~4 days (2026-01-26 to 2026-01-30)

---

## Epic Summary

| Story | Name | Deliverables |
|-------|------|--------------|
| 4-1 | Participant Code Entry & Session | Edge Function `validate-participant`, ParticipantSessionContext, CodeEntryForm, 120-min timeout |
| 4-2 | Participant Info Form | Edge Functions `update-participant`/`get-participant`, ParticipantInfoForm, Zod validation |
| 4-3 | View Categories & Submission Status | Edge Function `get-participant-categories`, DeadlineCountdown, ParticipantCategoryCard |
| 4-4 | Video Upload with Progress | TUS protocol uploads, Edge Functions `create-video-upload`/`finalize-upload`, UploadProgress, VideoUploadForm |
| 4-5 | Photo Upload with Progress | Server-side proxy Edge Function `upload-photo`, **critical security fix** (Bunny API key exposure) |
| 4-6 | Submission Preview & Confirm | Edge Functions `get-submission`/`confirm-submission`, SubmissionPreview, PhotoLightbox, `uploaded` intermediate status |
| 4-7 | Edit, Replace & Withdraw | Edge Function `withdraw-submission`, hard delete + Bunny cleanup, deadline lockout, AlertDialog confirmation |

---

## What Went Well

1. **Velocity Compounded from Earlier Epics**
   - Epic 4 (7 stories, CDN integration) completed in roughly the same timeframe as Epic 3 (5 stories, simpler scope)
   - Established patterns from Epics 1-3 (Edge Functions, TanStack Query, component structure) became velocity multipliers
   - By Story 4-4, development was mostly assembling known patterns rather than inventing new ones

2. **Critical Security Catch via Adversarial Review**
   - Story 4-5 originally exposed Bunny Storage API key to the client browser
   - Adversarial code review caught it; fixed with server-side proxy Edge Function pattern
   - All 5 review findings in 4-5 were fixed — 100% fix rate
   - This pattern is now reusable for all future Bunny interactions

3. **Adversarial Review Quality Improved Over Time**
   - 4-2: 19 findings, 4 fixed (21% — lots of noise)
   - 4-3: 12 findings, 10 fixed (83%)
   - 4-5: 5 findings, 5 fixed (100%)
   - 4-7: 14 findings, 7 fixed (50% — 7 consciously deferred)
   - Reviews became more targeted and actionable as the epic progressed

4. **Incremental Architecture — No Over-Engineering**
   - Submission lifecycle evolved naturally: simple (4-4) → intermediate status (4-6) → full lifecycle with replace/withdraw/lock (4-7)
   - No rework required — each story built cleanly on the previous
   - Two distinct upload patterns established: TUS (video/Bunny Stream) and server-side proxy (photo/Bunny Storage)

5. **Testing Growth**
   - Test suite grew from unmeasured to 579/580 passing tests
   - 1 pre-existing failure (judge/DashboardPage date formatting drift) — unrelated to Epic 4
   - Consistent unit test coverage for new components and hooks

6. **Edge Function Pattern Maturity**
   - Consistent template across all stories: CORS headers, service role key, participant ownership validation
   - New functions are fast to scaffold because the pattern is proven

---

## What Could Be Improved

### 1. Deferred Technical Debt Accumulating (ACKNOWLEDGED)

**Issue:** 31+ unchecked review follow-ups across the epic. Stories 4-1, 4-4, and 4-6 have 24 items between them. Story 4-7 deferred 7 items to future-work.md including TOCTOU race condition and path traversal validation.

**Team Decision:** Defer to post-epic hardening phase. Some items will resolve naturally as later epics build on this work. Comprehensive `future-work.md` roundup planned after all epics, followed by full security assessment.

### 2. Incomplete Story Metadata (3 of 7 stories)

**Issue:** Stories 4-1, 4-4, and 4-6 have empty Dev Agent Records and File Lists. Stories 4-2, 4-3, 4-5, and 4-7 have complete records.

**Impact:** Reduces story auditability and traceability.

**Action:** Fill in Dev Agent Record and File List consistently before marking future stories done.

### 3. Epic 3 Action Items — Zero Completed

**Issue:** All 5 action items from Epic 3 retrospective were not addressed:
1. Document Edge Function deployment in ops runbook
2. Add `npm run test:quick` script
3. Configure GitHub Actions for full test suite
4. Schedule quality checkpoint epic before MVP
5. Schedule accessibility audit after final epic

**Team Decision:** These are **explicitly deferred** to the post-epic hardening phase — not forgotten, consciously deprioritized in favor of feature velocity. The difference between "we forgot" and "we decided not to" matters for accountability.

### 4. Security Vulnerability in Initial Implementation

**Issue:** Story 4-5's first implementation exposed Bunny Storage API key to the client. Caught by adversarial review, not by design.

**Lesson:** Story specs should explicitly flag security boundaries for external service credentials. Architecture docs should be clearer about which keys are server-only.

---

## Patterns Established

### Server-Side Proxy for External APIs
```
Client → Edge Function → Bunny Storage API
(no credentials on client side)
```
Established in 4-5 after security fix. Must be followed for all Bunny interactions going forward.

### Submission Lifecycle
```
uploading → uploaded → submitted
    ↑           |          |
    |      (replace)  (replace)
    └───────────┘──────────┘
                |          |
           (withdraw)  (withdraw)
                ↓          ↓
            [deleted from DB + Bunny]
```

### Edge Function Template
- CORS: `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type`
- Auth: Validate `participantId` + `participantCode` ownership
- Admin client: `createClient(URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })`

### Upload Patterns
- **Video:** TUS protocol → Bunny Stream → `finalize-upload` Edge Function
- **Photo:** Server-side proxy → `upload-photo` Edge Function → Bunny Storage

---

## Deferred Items

| Source | Description | Priority | Target |
|--------|-------------|----------|--------|
| 4-7 | TOCTOU race condition in withdraw | Medium | future-work.md roundup |
| 4-7 | Path traversal validation for Bunny delete | Medium | future-work.md roundup |
| 4-7 | Bunny delete telemetry/retry | Low | future-work.md roundup |
| 4-7 | Zod response validation | Low | future-work.md roundup |
| 4-6 | PhotoLightbox focus trap (accessibility) | Low | Accessibility audit |
| 4-6 | submitted_at preservation on confirm | Medium | future-work.md roundup |
| 4-1 | Inactivity tracking for session timeout | Low | future-work.md roundup |
| All | 31+ unchecked review follow-ups | Mixed | future-work.md roundup |
| Epic 3 | CI/GitHub Actions pipeline | Medium | Post-epic phase |
| Epic 3 | Edge Function deployment ops runbook | Low | Post-epic phase |
| Epic 3 | npm run test:quick script | Low | Post-epic phase |
| Epic 3 | Quality checkpoint before MVP | Medium | Post-epic hardening |
| Epic 3 | Accessibility audit | Medium | Post-final-epic |

---

## Decisions for Future Epics

1. **Velocity over infrastructure:** Continue prioritizing feature delivery through Epics 5-7. CI, testing infrastructure, and hardening are post-epic phase
2. **future-work.md as living document:** Continue deferring non-critical review findings. Comprehensive roundup after all epics
3. **Security assessment:** Full application security review after future-work.md roundup
4. **Story metadata:** Fill in Dev Agent Record and File List consistently
5. **Adversarial reviews:** Continue on every story — they're catching real issues and improving
6. **Server-side proxy:** Mandatory for all external API key usage (Bunny, future integrations)

---

## Impact on Epic 5

**Reusable from Epic 4:**
- PhotoLightbox component (judge photo review)
- Bunny Stream iframe embed pattern (judge video playback)
- Edge Function auth + CORS template
- TanStack Query hook patterns
- UploadProgress component patterns
- Submission data model and status lifecycle

**New for Epic 5:**
- `reviews` table (rating, feedback per judge per submission)
- `rankings` table (top 3 per judge per category)
- Drag-and-drop UI (ranking)
- Auto-save pattern (rating/feedback)
- Keyboard navigation for submission review
- Rating validation constraints (ranking must respect rating hierarchy)
- N+1 query fix deferred from Epic 3 (targeted for 5-1 with RPC)

**No preparation work required** — team moves directly to Epic 5.

---

## Action Items

- [ ] Fill in Dev Agent Record and File List on all future stories before marking done
- [ ] Maintain `future-work.md` as living document through Epics 5-7
- [ ] After all epics: Comprehensive `future-work.md` roundup
- [ ] After roundup: Full security assessment of entire application
- [ ] After all epics: CI/GitHub Actions, ops runbook, test:quick script, accessibility audit
- [ ] Fix pre-existing DashboardPage test failure when touching judge features in Epic 5

---

*Retrospective completed: 2026-01-31*
