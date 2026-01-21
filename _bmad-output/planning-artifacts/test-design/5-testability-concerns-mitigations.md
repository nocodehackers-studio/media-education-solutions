# 5. Testability Concerns & Mitigations

## TC-1: 120-Minute Session Timeout (Risk: 6)

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

## TC-2: Deadline Enforcement (Risk: 6)

**Mitigation:**
- Use `page.clock.install()` in Playwright
- Seed category with deadline = now + 1 minute
- Test: before deadline (success), after (failure)

## TC-3: 100+ Concurrent Uploads (Risk: 9 - CRITICAL)

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

## TC-4: Anonymous Judging PII Verification (Risk: 6)

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
