# 6. Test Infrastructure Requirements

## 6.1 Recommended Test Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Unit | Vitest | Fast, Vite-native |
| Component | Vitest + RTL | UI isolation |
| Integration | Vitest + MSW | API mocking |
| E2E | Playwright | Browser automation |
| Load | k6 | Performance testing |
| Visual | Playwright screenshots | Regression |

## 6.2 Required Fixtures

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

## 6.3 Required Data Factories

```typescript
// tests/factories/index.ts
export function createContest(overrides?: Partial<Contest>): Contest;
export function createCategory(overrides?: Partial<Category>): Category;
export function createParticipant(overrides?: Partial<Participant>): Participant;
export function createSubmission(overrides?: Partial<Submission>): Submission;
export function createReview(overrides?: Partial<Review>): Review;
```

---
