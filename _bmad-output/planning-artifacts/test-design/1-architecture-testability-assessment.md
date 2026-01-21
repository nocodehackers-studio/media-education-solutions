# 1. Architecture Testability Assessment

## 1.1 Component Analysis

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

## 1.2 Key Findings

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
