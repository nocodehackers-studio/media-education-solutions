# Non-Functional Requirements

## Performance

| Requirement | Target | Context |
|-------------|--------|---------|
| Page load time | < 3 seconds | Initial application load on broadband |
| Navigation response | < 500ms | Between views within the SPA |
| Video playback start | < 2 seconds | Judge streaming submissions |
| Upload throughput | 100+ simultaneous | Deadline crunch scenario |
| Upload success rate | 99.5%+ | Critical for participant trust |
| Progress indicator | Real-time updates | During file upload |

## Security

| Requirement | Implementation |
|-------------|----------------|
| Authentication | Email + password for Super Admin and Judges |
| Password storage | Hashed, never stored in plaintext |
| Session management | Secure session tokens with expiration |
| Anonymous judging | Judge interface shows participant codes only, no PII |
| Winners page | Data loads only after correct password entered (not on page load) |
| Data access | Participants can only view their own submissions and feedback |
| File access | Media files accessible only to authorized users |

## Scalability

| Scenario | Requirement |
|----------|-------------|
| Concurrent contests | Support 5+ active contests simultaneously |
| Participants per contest | Support 200-500 participants |
| Deadline crunch | Handle 30% of submissions in final 10 minutes |
| Media storage | Scale with contest volume via Bunny infrastructure |
| Database | Supabase scales with usage |

## Reliability

| Requirement | Target |
|-------------|--------|
| System uptime | 99.9% during active contest periods |
| Upload resilience | Resumable uploads; retry on failure |
| Data integrity | No lost submissions or reviews |
| Error handling | Clear error messages; graceful degradation |
| Backup | Database backups via Supabase |

## Integration Dependencies

| Service | Purpose | Failure Impact |
|---------|---------|----------------|
| **Supabase** | Auth, database, backend | Critical - platform non-functional |
| **Bunny Stream** | Video storage & streaming | High - video submissions/judging blocked |
| **Bunny Storage** | Photo storage | High - photo submissions/judging blocked |
| **Brevo** | Email notifications | Medium - notifications delayed, core function works |
| **Vercel** | Hosting & deployment | Critical - platform inaccessible |

## Accessibility

Basic accessibility compliance (as defined in Web Application Requirements):
- Keyboard navigation for all interactive elements
- Proper form labels
- Sufficient color contrast
- Visible focus indicators

No formal WCAG certification required for MVP.

