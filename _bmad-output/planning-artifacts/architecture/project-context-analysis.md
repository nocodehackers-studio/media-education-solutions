# Project Context Analysis

## Requirements Overview

**Functional Requirements:**

64 functional requirements across 9 domains:

| Domain | FRs | Architectural Impact |
|--------|-----|---------------------|
| Authentication & Access | FR1-FR5 | Three auth flows: Admin/Judge (email+password), Participant (codes only) |
| Contest Management | FR6-FR14 | State machine with 5 states, category independence |
| Participant Codes | FR15-FR19 | Auto-generation, batch operations, scoped uniqueness |
| Judge Management | FR20-FR24 | Assignment system, progress tracking, email triggers |
| Participant Submissions | FR25-FR37 | Heavy file handling, timestamp logic, edit/withdraw flows |
| Judging & Evaluation | FR38-FR48 | Anonymous interface, rating system, drag-drop ranking |
| Admin Review & Override | FR49-FR53 | Full data visibility, override capabilities |
| Results & Winners | FR54-FR60 | Password-protected public page, feedback access |
| Notifications | FR61-FR64 | Email integration via Brevo |

**Non-Functional Requirements:**

| Category | Requirement | Architectural Decision Driver |
|----------|-------------|------------------------------|
| Performance | 100+ simultaneous uploads | Direct browser-to-Bunny uploads, no server bottleneck |
| Performance | <3s initial load | Code splitting, lazy loading, CDN hosting |
| Performance | <2s video playback | Bunny Stream transcoding + edge delivery |
| Security | Anonymous judging | Separate data models for judge view vs admin view |
| Security | Password-protected winners | Client-side gate, data fetched only after auth |
| Scalability | 5+ concurrent contests | Multi-tenant data model, efficient queries |
| Scalability | 200-500 participants/contest | Bunny handles storage scale, Supabase handles metadata |
| Reliability | 99.5% upload success | Resumable uploads, retry logic, clear error states |

**Scale & Complexity:**

- Primary domain: Full-stack web application (React SPA + Supabase BaaS)
- Complexity level: Medium-High
- Estimated architectural components: ~15-20 (auth, contests, categories, codes, submissions, reviews, rankings, notifications, file handling, etc.)

## Technical Constraints & Dependencies

**Fixed Technology Choices (from PRD):**
- Frontend: React + Vite (SPA, no SSR needed)
- Backend: Supabase (Auth, PostgreSQL, Edge Functions if needed)
- Video: Bunny Stream (storage, transcoding, streaming)
- Photos/Assets: Bunny Storage (all files per architectural decision)
- Email: Brevo (transactional templates)
- Hosting: Vercel (frontend deployment)

**Design System (from UX Spec):**
- Component library: shadcn/ui + Tailwind CSS
- Typography: Inter
- Custom components: 7 identified (UploadProgress, RatingScale, MediaViewer, SubmissionCard, ContestCard, RankingDropzone, CodeListTable)

## Cross-Cutting Concerns Identified

1. **File Upload Pipeline**
   - Direct browser → Bunny uploads (bypass server)
   - Chunked/resumable for large videos
   - Progress tracking with real-time UI feedback
   - Timestamp locks on upload start (deadline fairness)

2. **Role-Based Access Control**
   - Admin: Full access to all data
   - Judge: Anonymous view only (codes, no PII)
   - Participant: Own submissions and feedback only
   - Enforced at database level (RLS policies)

3. **Contest State Machine**
   - States: Draft → Published → Closed → Reviewed → Finished
   - Categories have independent status within contests
   - State transitions trigger notifications

4. **Anonymous Data Isolation**
   - Judge queries must never join to participant PII
   - Separate API endpoints or views for judge vs admin
   - Audit trail for any PII access

5. **Notification System**
   - Trigger points: Judge assignment, category close, review complete, contest finish
   - Brevo templates for each notification type
   - Async processing (don't block user actions)

6. **Bunny Upload Security (CRITICAL)**
   - **No direct public Bunny endpoints** — All uploads authenticated and authorized
   - **Signed upload URLs** — Short-lived, single-use URLs generated server-side after validating:
     - Valid participant code for the contest
     - Category is still open (not past deadline)
     - User hasn't exceeded submission limits
   - **Storage isolation** — Unique paths: `/{contest_id}/{category_id}/{participant_code}/{file}`
   - **No enumeration** — Participants cannot list or guess other file paths
   - **Delete protection** — Only submitting participant (pre-deadline) or admin can delete
   - **Rate limiting** — Per-participant, per-contest limits to prevent abuse
   - **File validation** — Verify file type and size before accepting
