# 3. Test Levels Strategy

## 3.1 Test Pyramid

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

## 3.2 Test Level by Epic

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
