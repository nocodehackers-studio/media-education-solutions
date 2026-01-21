# 4. NFR Testing Approach

## 4.1 Performance

| Metric | Tool | Threshold |
|--------|------|-----------|
| Page load | Playwright + Lighthouse | < 3s |
| Navigation | Playwright timing | < 500ms |
| Video start | Playwright timing | < 2s |
| Concurrent uploads | k6 | 100 VUs, p95 < 5s |

## 4.2 Security

| Requirement | Test Strategy |
|-------------|---------------|
| Auth flows | Verify 401/403 on unauthorized access |
| Anonymous judging | Assert PII not in DOM content |
| Winners page | Verify data loads only after password |
| Session expiry | Mock clock, verify redirect |

## 4.3 Reliability

| Requirement | Test Strategy |
|-------------|---------------|
| Upload success | k6 threshold: < 0.5% error rate |
| Resumable uploads | Network drop + resume via Playwright |
| Error handling | Mock API failures, verify UI feedback |

---
