# 2. Architecturally Significant Requirements (ASRs)

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
