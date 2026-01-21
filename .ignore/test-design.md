# System-Level Test Design Document

**Project:** Media Education Solutions
**Generated:** 2026-01-11
**Author:** TEA (Master Test Architect)
**Phase:** Pre-Implementation Testability Review

---

## Executive Summary

This document captures system-level testability decisions before implementation begins. The architecture is **generally testable** with specific concerns around time-dependent logic and load testing requirements.

### Risk Assessment Summary

| Risk Level | Count | Action Required |
|------------|-------|-----------------|
| CRITICAL (9) | 1 | 100+ concurrent uploads - k6 load testing mandatory |
| HIGH (6-8) | 3 | Time mocking patterns, PII leak prevention |
| MEDIUM (4-5) | 4 | Standard E2E/integration coverage |
| LOW (1-3) | 2 | Standard test coverage |

---

## 1. Architecture Testability Assessment

### 1.1 Component Analysis

| Component | Controllability | Observability | Reliability | Score |
|-----------|-----------------|---------------|-------------|-------|
| Supabase (Auth/DB) | HIGH | HIGH | HIGH | 2 (LOW) |
| Bunny Stream/Storage | MEDIUM | MEDIUM | MEDIUM | 4 (MEDIUM) |
| Brevo Email | MEDIUM | MEDIUM | HIGH | 3 (LOW) |
| Participant Session | MEDIUM | MEDIUM | MEDIUM | 4 (MEDIUM) |
| 120-min Timeout | LOW | MEDIUM | LOW | 6 (HIGH) |
| Deadline Logic | LOW | MEDIUM | LOW | 6 (HIGH) |
| Anonymous Judging | HIGH | MEDIUM | HIGH | 2 (LOW) |
| 100+ Uploads | LOW | LOW | LOW | 9 (CRITICAL) |

### 1.2 Key Findings

**Strengths:**
- Supabase provides excellent testability via RLS policies and API seeding
- Feature-based folder structure supports isolated testing
- TanStack Query enables cache state inspection
- Sentry integration provides error observability

**Concerns:**
1. **Time-dependent logic** (session timeout, deadlines) requires clock mocking
2. **Concurrent upload load** requires k6, not Playwright
3. **Three auth flows** increases test fixture complexity
4. **Bunny integration** requires network mocking for reliable tests

---

## 2. Architecturally Significant Requirements (ASRs)

| ASR ID | Requirement | Source | Test Level | Risk |
|--------|-------------|--------|------------|------|
| ASR-1 | 100+ simultaneous uploads | NFR-4 | k6 Load | CRITICAL |
| ASR-2 | 99.5% upload success rate | NFR-5 | k6 + E2E | HIGH |
| ASR-3 | 120-min session timeout | Architecture | Unit + E2E | HIGH |
| ASR-4 | Anonymous judging (no PII) | NFR-SEC | E2E + Security | HIGH |
| ASR-5 | Deadline enforcement | FR | E2E (time mock) | HIGH |
| ASR-6 | 3 auth flows | Architecture | Integration + E2E | MEDIUM |
| ASR-7 | Video playback < 2s | NFR-3 | E2E + Performance | MEDIUM |
| ASR-8 | Winners page password | NFR-SEC | E2E | MEDIUM |
| ASR-9 | Rate limiting | Architecture | Integration | MEDIUM |
| ASR-10 | Resumable uploads | NFR-REL | E2E | MEDIUM |

---

## 3. Test Levels Strategy

### 3.1 Test Pyramid

```
                    ┌─────────────────────┐
                    │   E2E Tests (15%)   │  ← Critical paths only
                    │   Playwright        │
                    └──────────┬──────────┘
                               │
               ┌───────────────┴───────────────┐
               │    Integration Tests (30%)     │  ← API + DB operations
               │    Playwright API + Vitest     │
               └───────────────┬───────────────┘
                               │
       ┌───────────────────────┴───────────────────────┐
       │           Unit Tests (45%)                     │  ← Business logic
       │           Vitest                               │
       └───────────────────────┬───────────────────────┘
                               │
   ┌───────────────────────────┴───────────────────────────┐
   │              Component Tests (10%)                     │  ← UI isolation
   │              Vitest + React Testing Library            │
   └───────────────────────────────────────────────────────┘
```

### 3.2 Test Level by Epic

| Epic | Unit | Component | Integration | E2E |
|------|------|-----------|-------------|-----|
| E1: Foundation | Utils, Supabase client | UI components | RLS, DB schema | Smoke |
| E2: Admin + Contest | Validation logic | Forms | Auth, CRUD | Login, create |
| E3: Judge Onboarding | Token validation | Forms | Email, password | Journey |
| E4: Participant | Session, code validation | Upload UI | Bunny URLs | Submit journey |
| E5: Judging | Rating/tier calc | Rating scale, D&D | Review CRUD | Evaluate |
| E6: Results | Ranking algorithm | Winners display | Override | Publish |
| E7: Email | Template render | N/A | Brevo API | Delivery |

---

## 4. NFR Testing Approach

### 4.1 Performance

| Metric | Tool | Threshold |
|--------|------|-----------|
| Page load | Playwright + Lighthouse | < 3s |
| Navigation | Playwright timing | < 500ms |
| Video start | Playwright timing | < 2s |
| Concurrent uploads | k6 | 100 VUs, p95 < 5s |

### 4.2 Security

| Requirement | Test Strategy |
|-------------|---------------|
| Auth flows | Verify 401/403 on unauthorized access |
| Anonymous judging | Assert PII not in DOM content |
| Winners page | Verify data loads only after password |
| Session expiry | Mock clock, verify redirect |

### 4.3 Reliability

| Requirement | Test Strategy |
|-------------|---------------|
| Upload success | k6 threshold: < 0.5% error rate |
| Resumable uploads | Network drop + resume via Playwright |
| Error handling | Mock API failures, verify UI feedback |

---

## 5. Testability Concerns & Mitigations

### TC-1: 120-Minute Session Timeout (Risk: 6)

**Problem:** Testing timeout in real-time is impossible.

**Mitigation:**
```typescript
// 1. Abstract time functions
export interface TimeProvider {
  now(): Date;
  addMinutes(date: Date, minutes: number): Date;
}

// 2. Inject in hook
export function useSessionTimeout(
  timeoutMinutes: number,
  timeProvider: TimeProvider = realTimeProvider
) { /* ... */ }

// 3. Test with clock mocking
test('session expires after 120 minutes', async ({ page }) => {
  await page.clock.install({ time: new Date('2025-01-01T10:00:00') });
  await loginAsParticipant(page);
  await page.clock.fastForward('02:01:00');
  await expect(page).toHaveURL(/\/session-expired/);
});
```

### TC-2: Deadline Enforcement (Risk: 6)

**Mitigation:**
- Use `page.clock.install()` in Playwright
- Seed category with deadline = now + 1 minute
- Test: before deadline (success), after (failure)

### TC-3: 100+ Concurrent Uploads (Risk: 9 - CRITICAL)

**Problem:** This is a LOAD TESTING requirement, not E2E.

**Mitigation:**
```javascript
// tests/load/concurrent-uploads.k6.js
export const options = {
  scenarios: {
    deadline_crunch: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '1m', target: 150 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    'http_req_duration{name:generate_signed_url}': ['p(95)<1000'],
    'http_req_duration{name:upload_to_bunny}': ['p(95)<5000'],
    'errors': ['rate<0.005'],
  },
};
```

### TC-4: Anonymous Judging PII Verification (Risk: 6)

**Mitigation:**
```typescript
test('judge view hides participant PII', async ({ page }) => {
  const participant = await seedParticipant({
    name: 'SECRET_NAME',
    organization_name: 'SECRET_ORG',
    tlc_email: 'secret@email.com'
  });

  await loginAsJudge(page);
  await page.goto('/judge/submissions');

  const content = await page.content();
  expect(content).not.toContain('SECRET_NAME');
  expect(content).not.toContain('SECRET_ORG');
  expect(content).not.toContain('secret@email.com');
});
```

---

## 6. Test Infrastructure Requirements

### 6.1 Recommended Test Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Unit | Vitest | Fast, Vite-native |
| Component | Vitest + RTL | UI isolation |
| Integration | Vitest + MSW | API mocking |
| E2E | Playwright | Browser automation |
| Load | k6 | Performance testing |
| Visual | Playwright screenshots | Regression |

### 6.2 Required Fixtures

```typescript
// tests/fixtures/auth.fixture.ts
export const test = base.extend({
  adminPage: async ({ page, request }, use) => {
    // Login as admin via API
    // Provide authenticated page
  },
  judgePage: async ({ page, request }, use) => {
    // Login as judge via API
  },
  participantPage: async ({ page }, use) => {
    // Set localStorage session
  },
});
```

### 6.3 Required Data Factories

```typescript
// tests/factories/index.ts
export function createContest(overrides?: Partial<Contest>): Contest;
export function createCategory(overrides?: Partial<Category>): Category;
export function createParticipant(overrides?: Partial<Participant>): Participant;
export function createSubmission(overrides?: Partial<Submission>): Submission;
export function createReview(overrides?: Partial<Review>): Review;
```

---

## 7. Critical User Journeys (E2E)

| ID | Journey | Priority | Est. Time |
|----|---------|----------|-----------|
| CUJ-1 | Admin creates contest + categories | P0 | 45s |
| CUJ-2 | Admin generates participant codes | P0 | 30s |
| CUJ-3 | Judge onboarding (invite → login) | P0 | 60s |
| CUJ-4 | Participant submits video | P0 | 90s |
| CUJ-5 | Judge rates + ranks submissions | P0 | 60s |
| CUJ-6 | Admin publishes winners | P1 | 45s |
| CUJ-7 | Session timeout | P1 | 30s |
| CUJ-8 | Deadline enforcement | P1 | 30s |

---

## 8. Architectural Recommendations

### 8.1 Required Patterns for Testability

1. **Time Abstraction:** Inject TimeProvider for session/deadline logic
2. **Storage Abstraction:** Wrap localStorage for participant sessions
3. **API Client Abstraction:** Enable network mocking via MSW
4. **Feature Index Exports:** Keep `index.ts` files updated for test imports

### 8.2 Recommended Project Changes

Add to Epic 1 (Foundation) acceptance criteria:

- [ ] Time abstraction implemented for session timeout
- [ ] Auth fixtures created for all 3 roles
- [ ] Data factories created for all entities
- [ ] Network mocking configured for Bunny endpoints
- [ ] k6 load test scaffolding created

---

## 9. Quality Gates

### 9.1 Per-Story Gates

- [ ] Unit tests for business logic
- [ ] Integration tests for API operations
- [ ] E2E tests for user-facing functionality
- [ ] No hard waits (`waitForTimeout`)
- [ ] Explicit assertions in test bodies
- [ ] Test execution < 1.5 minutes

### 9.2 Pre-Release Gates

- [ ] All E2E journeys pass
- [ ] k6 load test: 100 VUs, p95 < 5s, errors < 0.5%
- [ ] Security tests: no PII leaks, auth enforcement
- [ ] NFR thresholds met with evidence

---

## 10. Next Steps

1. **Implementation Readiness:** Review this document as input to gate check
2. **Epic 1:** Implement test infrastructure as part of foundation
3. **Per-Story:** Generate ATDD tests before implementation
4. **Pre-Release:** Execute traceability matrix + NFR assessment

---

*Generated by TEA (Master Test Architect) via BMAD Method*
