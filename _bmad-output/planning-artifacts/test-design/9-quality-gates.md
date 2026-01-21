# 9. Quality Gates

## 9.1 Per-Story Gates

- [ ] Unit tests for business logic
- [ ] Integration tests for API operations
- [ ] E2E tests for user-facing functionality
- [ ] No hard waits (`waitForTimeout`)
- [ ] Explicit assertions in test bodies
- [ ] Test execution < 1.5 minutes

## 9.2 Pre-Release Gates

- [ ] All E2E journeys pass
- [ ] k6 load test: 100 VUs, p95 < 5s, errors < 0.5%
- [ ] Security tests: no PII leaks, auth enforcement
- [ ] NFR thresholds met with evidence

---
