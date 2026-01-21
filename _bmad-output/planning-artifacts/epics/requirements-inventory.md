# Requirements Inventory

## Functional Requirements

**Authentication & Access**
- FR1: Super Admin can log in via email and password
- FR2: Judge can log in via email and password
- FR3: New judges must set their password when first accessing the platform via invite link
- FR4: Super Admin and Judges can recover their password via email reset flow
- FR5: Participant can access a contest using contest code and participant code (no password required)

**Contest Management**
- FR6: Super Admin can create a new contest with name, description, cover image, unique contest code, and general contest rules
- FR7: Super Admin can define categories within a contest with type (video or photo), deadline, rules, and description
- FR8: Super Admin can set contest status (Draft, Published, Closed, Reviewed, Finished)
- FR9: Super Admin can view a list of all contests with status indicators
- FR10: Super Admin can edit contest details while in any status
- FR11: Super Admin can delete a contest while in any status
- FR12: Super Admin can edit contest categories only while contest is in Draft status
- FR13: Super Admin can view a dashboard showing submission counts and judge progress per contest
- FR14: Categories have independent status (Draft, Published, Closed) separate from contest status

**Participant Code Management**
- FR15: Super Admin can generate participant codes in batches of 50 via "Generate Codes" button (contest can exist with 0 codes)
- FR16: Super Admin can generate additional participant code batches as needed
- FR17: Super Admin can view all participant codes for a contest with Used/Unused status
- FR18: Super Admin can export participant codes as a list for distribution
- FR19: Each participant code is an 8-digit unique identifier scoped to its contest

**Judge Management**
- FR20: Super Admin can assign judges to specific categories within a contest by email address
- FR21: System sends email invitation to judges when their assigned category is closed (deadline reached)
- FR22: Super Admin can view judge progress (submissions reviewed vs. total) per category
- FR23: Super Admin can remove a judge from a category; existing reviews by that judge are not transferred to replacement judges
- FR24: Judge can view all assigned contests and categories after logging in

**Participant Submissions**
- FR25: Participant can view available categories and their status (Published/Closed)
- FR26: Participant can submit personal information (name, school/organization)
- FR27: Participant can enter Teacher/Leader/Coach name and email
- FR28: Participant data auto-fills on subsequent submissions within the same contest
- FR29: Participant can upload a video file (up to 500MB) to a video category
- FR30: Participant can upload a photo file (up to 10MB) to a photo category
- FR31: Participant can see upload progress during file upload
- FR32: Submission timestamp is recorded when upload begins, not when it completes (deadline grace for slow connections)
- FR33: Participant can preview their uploaded submission before final submit
- FR34: Participant can edit or replace their submission before the category deadline
- FR35: When a participant replaces a submission, the old file is deleted from the server
- FR36: Participant can withdraw from a category entirely before the deadline
- FR37: Participant can submit to multiple categories within the same contest

**Judging & Evaluation**
- FR38: Judge can view a dashboard of assigned categories with review progress
- FR39: Judge can view submissions anonymously (identified by participant code only)
- FR40: Judge can view photos in full-screen display
- FR41: Judge can stream videos directly in the browser
- FR42: Judge can rate each submission using a 5-tier scale (Developing Skills 1-2, Emerging Producer 3-4, Proficient Creator 5-6, Advanced Producer 7-8, Master Creator 9-10)
- FR43: Judge can provide written feedback for each submission
- FR44: Judge can navigate between submissions (Next/Previous)
- FR45: Judge can see their review progress within a category
- FR46: Judge can drag-and-drop to rank their top 3 submissions per category
- FR47: Judge can mark a category as complete when all submissions are reviewed and ranked
- FR48: System notifies Super Admin when a judge marks a category as complete

**Admin Review & Override**
- FR49: Super Admin can view all submissions with full participant data (name, institution, T/L/C info)
- FR50: Super Admin can view judge ratings and written feedback for any submission
- FR51: Super Admin can override judge written feedback
- FR52: Super Admin can override category rankings (Top 3 order)
- FR53: Super Admin can disqualify individual submissions

**Results & Winners**
- FR54: Super Admin can generate a winners page for a contest
- FR55: Super Admin can set a password for the winners page
- FR56: Winners page is publicly accessible but displays no data until correct password is entered
- FR57: Winners page displays top 3 ranked submissions per category after password authentication
- FR58: Winners page media (videos and photos) is downloadable in best quality
- FR59: Participant can view their feedback and rating after contest is marked Finished
- FR60: Participant can access feedback using the same codes they used for submission

**Notifications**
- FR61: System sends email to judges when they are assigned and their category is closed
- FR62: System sends email to Super Admin when a judge completes a category
- FR63: System sends email to Teachers/Leaders/Coaches when contest results are available
- FR64: Email notifications include relevant links and instructions

## NonFunctional Requirements

**Performance**
- NFR1: Page load time < 3 seconds (initial application load on broadband)
- NFR2: Navigation response < 500ms (between views within the SPA)
- NFR3: Video playback start < 2 seconds (judge streaming submissions)
- NFR4: Support 100+ simultaneous uploads (deadline crunch scenario)
- NFR5: Upload success rate 99.5%+
- NFR6: Real-time progress indicator during file upload

**Security**
- NFR7: Email + password authentication for Super Admin and Judges
- NFR8: Passwords hashed, never stored in plaintext
- NFR9: Secure session tokens with expiration
- NFR10: Anonymous judging - judge interface shows participant codes only, no PII
- NFR11: Winners page data loads only after correct password entered
- NFR12: Participants can only view their own submissions and feedback
- NFR13: Media files accessible only to authorized users

**Scalability**
- NFR14: Support 5+ active contests simultaneously
- NFR15: Support 200-500 participants per contest
- NFR16: Handle 30% of submissions in final 10 minutes (deadline crunch)
- NFR17: Media storage scales with contest volume via Bunny infrastructure

**Reliability**
- NFR18: System uptime 99.9% during active contest periods
- NFR19: Resumable uploads; retry on failure
- NFR20: No lost submissions or reviews
- NFR21: Clear error messages; graceful degradation
- NFR22: Database backups via Supabase

**Integration Dependencies**
- NFR23: Supabase for auth, database, backend (critical)
- NFR24: Bunny Stream for video storage & streaming (high priority)
- NFR25: Bunny Storage for photo storage (high priority)
- NFR26: Brevo for email notifications (medium priority)
- NFR27: Vercel for hosting & deployment (critical)

**Accessibility**
- NFR28: Keyboard navigation for all interactive elements
- NFR29: Proper form labels
- NFR30: Sufficient color contrast (4.5:1 minimum body text, 3:1 large text)
- NFR31: Visible focus indicators
- NFR32: Touch targets minimum 44x44px
- NFR33: Respect `prefers-reduced-motion`
- NFR34: Usable up to 200% zoom

**Security Validation**
- NFR35: Pre-release security audit covering OWASP Top 10, RLS verification, and penetration testing must pass before production deployment

## Pre-Release Security Checklist

| Category | Check | Description |
|----------|-------|-------------|
| **OWASP Top 10** | Automated scan | Run OWASP ZAP or similar against staging environment |
| **RLS Audit** | Data isolation | Verify Admin/Judge/Participant cannot access unauthorized data |
| **Auth Tokens** | Session security | Validate token expiration, secure storage, no hijacking vectors |
| **Penetration Test** | Cross-user access | Participant A cannot view Participant B's submissions |
| **Penetration Test** | Role escalation | Judge cannot access admin functions |
| **Penetration Test** | Anonymous judging | Judge interface has zero PII leakage |
| **Input Validation** | Injection prevention | SQL injection, XSS, command injection tests |
| **File Upload** | Malicious files | Validate file type checking, size limits, no executable uploads |
| **API Security** | Rate limiting | Verify rate limits prevent brute force on codes |
| **API Security** | Signed URLs | Confirm no direct Bunny endpoint access possible |
| **Winners Page** | Password protection | Data must not load until password entered (not just hidden) |

**Gate Criteria:** All checks must PASS before production deployment. Any FAIL blocks release.

## Additional Requirements

**From Architecture - Starter Template:**
- ARCH1: Project initialization using official manual setup (Vite + React-TS template)
- ARCH2: Tailwind CSS v4 + shadcn/ui for styling
- ARCH3: React Hook Form + Zod for form validation
- ARCH4: React Router DOM for routing
- ARCH5: TanStack Query for server state management
- ARCH6: Sentry for error tracking

**From Architecture - Data & Security:**
- ARCH7: Supabase database schema implementation (contests, categories, participants, submissions, reviews, rankings, profiles tables)
- ARCH8: Row Level Security (RLS) policies for all tables
- ARCH9: Signed upload URLs via Edge Functions (no direct Bunny endpoints)
- ARCH10: Participant session expires after 120 minutes of inactivity
- ARCH11: Storage isolation pattern: `/{contest_id}/{category_id}/{participant_code}/{file}`

**From Architecture - Frontend Structure:**
- ARCH12: Bulletproof React folder structure with feature-based organization
- ARCH13: Every feature folder MUST have an index.ts exporting its public API
- ARCH14: Imports only from feature index, not internal paths

**From Architecture - Infrastructure:**
- ARCH15: CI/CD pipeline: push to main deploys to production, PR creates preview
- ARCH16: Environment separation: development (separate Supabase), preview/production (production Supabase)
- ARCH17: Environment variables setup for all services

**From Architecture - Implementation Patterns:**
- ARCH18: Naming conventions - snake_case for DB (tables, columns), camelCase for code (functions, variables), PascalCase for components and types, SCREAMING_SNAKE for constants
- ARCH19: Standardized error codes in `lib/errorCodes.ts` (INVALID_CODES, SESSION_EXPIRED, CONTEST_NOT_FOUND, CATEGORY_CLOSED, FILE_TOO_LARGE, etc.)
- ARCH20: API response format: `{ data: T | null, error: { message: string, code: string } | null }`
- ARCH21: Date handling - TIMESTAMPTZ in DB, ISO 8601 in API, Intl.DateTimeFormat for display
- ARCH22: Loading state patterns - isLoading (skeleton), isFetching (subtle indicator), isSubmitting (button spinner), isUploading (progress bar)

**From Architecture - LLM Discoverability:**
- ARCH23: PROJECT_INDEX.md required at project root as master manifest for AI agent discoverability
- ARCH24: Every feature folder must have index.ts exporting ALL components, hooks, API, types, schemas
- ARCH25: AI agents must read PROJECT_INDEX.md first, import only from feature index (never deep paths)

**From UX Design - Responsive & Accessibility:**
- UX1: Desktop-first responsive design, optimized for MacBook Pro 13" (1440px)
- UX2: Responsive adaptations for sidebar (fixed 256px desktop, hamburger mobile)
- UX3: Tables with horizontal scroll or card view on mobile
- UX4: WCAG 2.1 Level AA compliance target
- UX5: Lighthouse accessibility score >= 90
- UX6: Semantic HTML structure (main, nav, section, article, button)
- UX7: Logical heading hierarchy (h1 -> h2 -> h3)
- UX8: aria-live regions for toasts and status updates

**From Party Mode Review - UX Safeguards:**
- UX9: Session timeout warning toast displayed 5 minutes before participant session expires
- UX10: Empty states with clear CTAs for all list views (no contests, no submissions, no categories, no reviews)
- UX11: Confirmation dialogs required for destructive actions (delete contest, disqualify submission, withdraw from category)
- UX12: Deadline countdown timer visible on participant submission page

**From UX Design - Custom Components (Required):**
- UX13: `<UploadProgress>` component (P0) - file name, progress bar, percentage, speed, states: Idle/Uploading/Processing/Complete/Error
- UX14: `<RatingScale>` component (P0) - 5-tier selection with labels (Developing Skills → Master Creator), keyboard accessible
- UX15: `<MediaViewer>` component (P0) - full-screen photo/video, Esc to exit, Spacebar play/pause, arrow keys nav
- UX16: `<SubmissionCard>` component (P1) - anonymous display (code only, no PII), thumbnail, rating status
- UX17: `<ContestCard>` component (P1) - contest overview with status badge, submission count, judge progress
- UX18: `<RankingDropzone>` component (P1) - drag-drop top 3 positions, visual feedback on drop
- UX19: `<CodeListTable>` component (P2) - code management with status filtering, bulk export

**From UX Design - Consistency Patterns:**
- UX20: Button hierarchy - one Primary per screen, Secondary for alternatives, Destructive (red) always with confirmation
- UX21: Feedback patterns - Success toast (green, 4s auto-dismiss), Error toast (red, manual dismiss), max 2 toasts stacked
- UX22: Form patterns - validate on blur, single column layout, labels above inputs, specific error messages
- UX23: Navigation patterns - Admin: sidebar + breadcrumbs + tabs; Judge: minimal + progress indicator; Participant: step indicator
- UX24: Loading patterns - skeletons for content areas, spinners inside buttons, progress bars for uploads
- UX25: Status badge colors - Draft (gray), Published (blue), Closed (amber), Reviewed (purple), Finished (green)

## FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 2 | Super Admin login |
| FR2 | Epic 3 | Judge login |
| FR3 | Epic 3 | Judge password setup via invite |
| FR4 | Epic 2, 3 | Password reset flow (Admin & Judge) |
| FR5 | Epic 4 | Participant code access |
| FR6 | Epic 2 | Create contest |
| FR7 | Epic 2 | Define categories |
| FR8 | Epic 2 | Set contest status |
| FR9 | Epic 2 | View contest list |
| FR10 | Epic 2 | Edit contest details |
| FR11 | Epic 2 | Delete contest |
| FR12 | Epic 2 | Edit categories (Draft only) |
| FR13 | Epic 2 | View dashboard |
| FR14 | Epic 2 | Independent category status |
| FR15 | Epic 2 | Generate participant codes via button |
| FR16 | Epic 2 | Generate additional codes |
| FR17 | Epic 2 | View participant codes |
| FR18 | Epic 2 | Export participant codes |
| FR19 | Epic 2 | 8-digit unique codes |
| FR20 | Epic 3 | Assign judges to categories |
| FR21 | Epic 3 | Email invite when category closes |
| FR22 | Epic 3 | View judge progress |
| FR23 | Epic 3 | Remove judge from category |
| FR24 | Epic 3 | Judge view assigned categories |
| FR25 | Epic 4 | View available categories |
| FR26 | Epic 4 | Submit personal info |
| FR27 | Epic 4 | Enter T/L/C info |
| FR28 | Epic 4 | Auto-fill participant data |
| FR29 | Epic 4 | Upload video (500MB) |
| FR30 | Epic 4 | Upload photo (10MB) |
| FR31 | Epic 4 | Upload progress indicator |
| FR32 | Epic 4 | Timestamp on upload start |
| FR33 | Epic 4 | Preview submission |
| FR34 | Epic 4 | Edit/replace submission |
| FR35 | Epic 4 | Delete old file on replace |
| FR36 | Epic 4 | Withdraw from category |
| FR37 | Epic 4 | Submit to multiple categories |
| FR38 | Epic 5 | Judge dashboard |
| FR39 | Epic 5 | Anonymous submission view |
| FR40 | Epic 5 | Full-screen photo view |
| FR41 | Epic 5 | Video streaming |
| FR42 | Epic 5 | 5-tier rating scale |
| FR43 | Epic 5 | Written feedback |
| FR44 | Epic 5 | Navigate submissions |
| FR45 | Epic 5 | Review progress |
| FR46 | Epic 5 | Drag-drop ranking |
| FR47 | Epic 5 | Mark category complete |
| FR48 | Epic 5 | Notify admin on completion |
| FR49 | Epic 6 | Admin view all submissions |
| FR50 | Epic 6 | View judge ratings/feedback |
| FR51 | Epic 6 | Override feedback |
| FR52 | Epic 6 | Override rankings |
| FR53 | Epic 6 | Disqualify submissions |
| FR54 | Epic 6 | Generate winners page |
| FR55 | Epic 6 | Set winners page password |
| FR56 | Epic 6 | Password-protected winners page |
| FR57 | Epic 6 | Display top 3 winners |
| FR58 | Epic 6 | Downloadable winner media |
| FR59 | Epic 6 | Participant view feedback |
| FR60 | Epic 6 | Access feedback with codes |
| FR61 | Epic 7 | Email judges on assignment/close |
| FR62 | Epic 7 | Email admin on judge completion |
| FR63 | Epic 7 | Email T/L/C on results |
| FR64 | Epic 7 | Emails include links/instructions |
