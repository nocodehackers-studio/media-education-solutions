# 8. Architectural Recommendations

## 8.1 Required Patterns for Testability

1. **Time Abstraction:** Inject TimeProvider for session/deadline logic
2. **Storage Abstraction:** Wrap localStorage for participant sessions
3. **API Client Abstraction:** Enable network mocking via MSW
4. **Feature Index Exports:** Keep `index.ts` files updated for test imports

## 8.2 Recommended Project Changes

Add to Epic 1 (Foundation) acceptance criteria:

- [ ] Time abstraction implemented for session timeout
- [ ] Auth fixtures created for all 3 roles
- [ ] Data factories created for all entities
- [ ] Network mocking configured for Bunny endpoints
- [ ] k6 load test scaffolding created

---
