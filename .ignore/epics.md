---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-generate-stories", "step-04-validate-coverage"]
inputDocuments:
  - "_bmad-output/planning-artifacts/prd/functional-requirements.md"
  - "_bmad-output/planning-artifacts/prd/non-functional-requirements.md"
  - "_bmad-output/planning-artifacts/architecture/index.md"
  - "_bmad-output/planning-artifacts/architecture/starter-template-evaluation.md"
  - "_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md"
  - "_bmad-output/planning-artifacts/ux-design/responsive-design-accessibility.md"
---

# media-education-solutions - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for media-education-solutions, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

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
- FR15: System automatically generates 50 participant codes when a contest is created
- FR16: Super Admin can generate additional participant codes in batches of 50
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

### NonFunctional Requirements

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

### Pre-Release Security Checklist

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

### Additional Requirements

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

### FR Coverage Map

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
| FR15 | Epic 2 | Auto-generate 50 participant codes |
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

## Epic List

### Epic 1: Project Foundation & Core Infrastructure
Deployable application skeleton with database, auth infrastructure, and project structure ready for feature development.

**FRs covered:** None (infrastructure only)
**Additional Requirements:** ARCH1-ARCH25, UX1-UX8, UX20-UX25, NFR1-2, NFR7-9, NFR14, NFR18, NFR22-23, NFR27-34

**Deliverables:**
- Vite + React-TS + TypeScript project setup
- Tailwind CSS v4 + shadcn/ui configured
- React Router DOM routing structure
- TanStack Query + React Hook Form + Zod
- Supabase client configured
- Database schema deployed (all tables)
- RLS policies implemented
- Sentry error tracking
- CI/CD pipeline (Vercel)
- Bulletproof React folder structure
- Environment variables configured
- PROJECT_INDEX.md created (LLM discoverability)
- lib/errorCodes.ts with standardized errors
- Base UI consistency patterns established (button hierarchy, toast system, loading states)

---

### Epic 2: Super Admin Authentication & Contest Management
Super Admin can log in, create/manage contests, define categories, and generate participant codes.

**FRs covered:** FR1, FR4, FR6-19 (15 FRs)
**NFRs addressed:** NFR7-9, NFR14
**UX Components:** UX17 (ContestCard), UX19 (CodeListTable)

**User Outcomes:**
- Admin logs in with email/password
- Admin creates contests with full details
- Admin defines video/photo categories with deadlines
- Admin generates and exports participant codes
- Admin views contest list and dashboard
- Admin manages contest and category status

---

### Epic 3: Judge Onboarding & Assignment
Super Admin can invite judges to categories, and judges can set their password and access the system.

**FRs covered:** FR2, FR3, FR4, FR20-24 (7 FRs)
**NFRs addressed:** NFR7-9

**User Outcomes:**
- Admin assigns judges to categories by email
- Judges receive invite and set password
- Judges log in and see assigned categories
- Admin views judge assignments and progress
- Admin can remove judges from categories

---

### Epic 4: Participant Submission Experience
Participants can enter contests with their codes, upload media, and manage their submissions.

**FRs covered:** FR5, FR25-37 (14 FRs)
**NFRs addressed:** NFR4-6, NFR10, NFR12-13, NFR15-16, NFR18-21, NFR24-25
**UX Components:** UX13 (UploadProgress - P0)
**UX Safeguards:** UX9 (session warning), UX12 (deadline countdown)

**User Outcomes:**
- Participant accesses contest with codes
- Participant views available categories
- Participant submits personal and T/L/C info
- Participant uploads video (500MB) or photo (10MB)
- Participant sees upload progress
- Participant previews, edits, replaces, or withdraws submissions

---

### Epic 5: Judging & Evaluation Workflow
Judges can anonymously review all submissions, provide ratings and feedback, and rank their top 3.

**FRs covered:** FR38-48 (11 FRs)
**NFRs addressed:** NFR3, NFR10
**UX Components:** UX14 (RatingScale - P0), UX15 (MediaViewer - P0), UX16 (SubmissionCard - P1), UX18 (RankingDropzone - P1)

**User Outcomes:**
- Judge views dashboard with assigned categories
- Judge reviews submissions anonymously
- Judge views photos full-screen, streams videos
- Judge rates using 5-tier scale (1-10)
- Judge provides written feedback
- Judge ranks top 3 via drag-drop
- Judge marks category as complete

---

### Epic 6: Admin Oversight & Results Publication
Super Admin can review all submissions with full data, override as needed, and publish winners.

**FRs covered:** FR49-60 (12 FRs)
**NFRs addressed:** NFR11
**UX Safeguards:** UX11 (confirmation dialogs for disqualify)

**User Outcomes:**
- Admin views all submissions with full participant data
- Admin views judge ratings and feedback
- Admin overrides feedback and rankings
- Admin disqualifies submissions
- Admin generates password-protected winners page
- Winners page shows top 3 with downloadable media
- Participants view their feedback after contest finishes

---

### Epic 7: Email Notification System
All stakeholders receive timely email notifications for key events.

**FRs covered:** FR61-64 (4 FRs)
**NFRs addressed:** NFR26

**Notifications:**
- Judge invite when assigned and category closes
- Admin notification when judge completes category
- T/L/C notification when results available
- All emails include relevant links and instructions

---

## Epic 1: Project Foundation & Core Infrastructure

**Goal:** Deployable application skeleton with database, auth infrastructure, and project structure ready for feature development.

**Requirements:** ARCH1-25, UX1-8, UX20-25, NFR1-2, NFR7-9, NFR14, NFR18, NFR22-23, NFR27-34

---

### Story 1.1: Project Initialization

As a **developer**,
I want **a fully configured React + TypeScript project with Tailwind CSS, shadcn/ui, and routing**,
So that **I have a modern, consistent foundation to build features on**.

**Acceptance Criteria:**

**Given** a fresh development environment
**When** I clone the repository and run `npm install && npm run dev`
**Then** the application starts without errors on localhost
**And** the page displays a placeholder "Media Education Solutions" heading

**Given** the project is initialized
**When** I inspect the dependencies
**Then** I see React 18+, TypeScript, Vite, Tailwind CSS v4, React Router DOM
**And** shadcn/ui is configured with the project's color tokens

**Given** Tailwind is configured
**When** I use responsive classes (sm:, md:, lg:, xl:, 2xl:)
**Then** breakpoints match UX spec (sm:640, md:768, lg:1024, xl:1280, 2xl:1440)

**Given** React Router is configured
**When** I navigate to an undefined route
**Then** I see a NotFound page placeholder

**Requirements:** ARCH1-4, UX1

---

### Story 1.2: Supabase Integration & Base Schema

As a **developer**,
I want **Supabase configured with authentication and the profiles table**,
So that **admin and judge authentication is ready to implement**.

**Acceptance Criteria:**

**Given** Supabase client is configured
**When** I import from `@/lib/supabase`
**Then** I get a typed Supabase client connected to the project

**Given** the database migration runs
**When** I check the schema
**Then** the `profiles` table exists with columns: id (UUID, FK to auth.users), email, role, first_name, last_name, created_at

**Given** a user signs up via Supabase Auth
**When** the auth trigger fires
**Then** a corresponding row is created in the profiles table

**Given** RLS is enabled on profiles
**When** an unauthenticated request tries to read profiles
**Then** the request is denied

**Given** environment variables are set
**When** the app loads
**Then** VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are available to the client

**Requirements:** ARCH7-8, NFR7-8, NFR23

---

### Story 1.3: Feature Architecture & Discoverability

As a **developer or AI agent**,
I want **a well-organized folder structure with discoverability files**,
So that **I can quickly understand and navigate the codebase**.

**Acceptance Criteria:**

**Given** the src folder structure
**When** I inspect the directories
**Then** I see: features/, components/ui/, lib/, pages/, contexts/, types/, router/

**Given** the features folder
**When** I check its contents
**Then** I see placeholder folders for: auth, contests, categories, participants, submissions, reviews, rankings, notifications
**And** each folder has an index.ts with a placeholder export comment

**Given** PROJECT_INDEX.md exists at project root
**When** I read it
**Then** I see a master manifest listing all features, their purpose, and key exports
**And** it follows the LLM discoverability format from architecture

**Given** components/ui/index.ts exists
**When** I check its exports
**Then** it exports Button, Card, Input from shadcn/ui (minimum starter set)

**Given** lib/index.ts exists
**When** I check its exports
**Then** it exports supabase client, cn utility, queryClient

**Requirements:** ARCH12-14, ARCH23-25

---

### Story 1.4: Core UI Components & Patterns

As a **developer**,
I want **core UI patterns established (toasts, loading states, error handling)**,
So that **all features have consistent user feedback**.

**Acceptance Criteria:**

**Given** the toast system is configured
**When** I call `toast.success("Message")`
**Then** a green toast appears top-right and auto-dismisses after 4 seconds

**Given** the toast system is configured
**When** I call `toast.error("Error message")`
**Then** a red toast appears top-right and requires manual dismissal

**Given** lib/errorCodes.ts exists
**When** I import ERROR_CODES
**Then** I get typed constants: INVALID_CODES, SESSION_EXPIRED, CONTEST_NOT_FOUND, CATEGORY_CLOSED, FILE_TOO_LARGE, INVALID_FILE_TYPE, VALIDATION_ERROR, SERVER_ERROR

**Given** TanStack Query is configured
**When** I use a query hook
**Then** I have access to isLoading, isFetching, error states

**Given** React Hook Form + Zod are configured
**When** I create a form with validation
**Then** validation runs on blur and shows inline errors below fields

**Given** a Skeleton component exists
**When** I render `<Skeleton className="h-4 w-full" />`
**Then** a loading placeholder animation displays

**Requirements:** ARCH5-6, ARCH19-22, UX20-22, UX24, NFR21

---

### Story 1.5: CI/CD & Environment Configuration

As a **developer**,
I want **automated deployments and error tracking configured**,
So that **code changes deploy automatically and errors are captured**.

**Acceptance Criteria:**

**Given** code is pushed to main branch
**When** Vercel receives the webhook
**Then** the application builds and deploys to production URL

**Given** a PR is opened
**When** Vercel receives the webhook
**Then** a preview deployment is created with a unique URL

**Given** .env.example exists
**When** I review it
**Then** I see all required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_SENTRY_DSN

**Given** Sentry is configured
**When** an unhandled error occurs in production
**Then** the error is captured and sent to Sentry with stack trace

**Given** the GitHub Actions workflow exists
**When** a PR is opened
**Then** lint and type-check run automatically

**Requirements:** ARCH6, ARCH15-17, NFR27

---

## Epic 2: Super Admin Authentication & Contest Management

**Goal:** Super Admin can log in, create/manage contests, define categories, and generate participant codes.

**FRs covered:** FR1, FR4, FR6-19 (15 FRs)
**NFRs:** NFR7-9, NFR14
**UX Components:** UX17 (ContestCard), UX19 (CodeListTable)

---

### Story 2.1: Super Admin Login

As a **Super Admin**,
I want **to log in with my email and password**,
So that **I can access the admin dashboard and manage contests**.

**Acceptance Criteria:**

**Given** I am on the login page
**When** I enter a valid admin email and password
**Then** I am authenticated and redirected to the admin dashboard
**And** my session is stored securely

**Given** I am on the login page
**When** I enter invalid credentials
**Then** I see an error message "Invalid email or password"
**And** I remain on the login page

**Given** I am logged in
**When** I click "Logout"
**Then** my session is terminated
**And** I am redirected to the login page

**Given** I forgot my password
**When** I click "Forgot password" and enter my email
**Then** I receive a password reset email
**And** I can set a new password via the reset link

**Given** I am not logged in
**When** I try to access /admin/* routes
**Then** I am redirected to the login page

**Given** I am logged in as a Judge
**When** I try to access /admin/* routes
**Then** I am redirected to the Judge dashboard (/judge)

**Given** I am logged in as a Participant (code-based session)
**When** I try to access /admin/* routes
**Then** I am redirected to the login page

**Requirements:** FR1, FR4, NFR7-9

---

### Story 2.2: Admin Layout & Dashboard Shell

As a **Super Admin**,
I want **a consistent admin layout with sidebar navigation**,
So that **I can easily navigate between admin sections**.

**Acceptance Criteria:**

**Given** I am logged in as admin
**When** I view any admin page
**Then** I see a sidebar with navigation links: Dashboard, Contests
**And** the sidebar is 256px wide on desktop

**Given** I am on mobile (< 768px)
**When** I view any admin page
**Then** the sidebar is hidden behind a hamburger menu
**And** I can toggle it open/closed

**Given** I am on the dashboard
**When** I view the page
**Then** I see placeholder sections for contest stats
**And** the page title shows "Dashboard"

**Given** the sidebar shows my profile
**When** I look at the bottom of the sidebar
**Then** I see my email and a logout button

**Given** breadcrumbs are enabled
**When** I navigate to a nested page (e.g., Contest > Category)
**Then** I see breadcrumb navigation showing the path

**Requirements:** FR9, FR13 (partial), UX2, UX23

---

### Story 2.3: Create Contest

As a **Super Admin**,
I want **to create a new contest with basic details**,
So that **I can set up a competition for participants**.

**Acceptance Criteria:**

**Given** I am on the Contests page
**When** I click "Create Contest"
**Then** I see a form with fields: name, description, cover image upload, contest code, general rules

**Given** I am filling the contest form
**When** I leave the contest code blank
**Then** a unique 6-character alphanumeric code is auto-generated

**Given** I submit a valid contest form
**When** the contest is created
**Then** the contest is saved with status "Draft"
**And** 50 participant codes are automatically generated
**And** I am redirected to the contest detail page
**And** I see a success toast "Contest created"

**Given** I try to create a contest with a duplicate code
**When** I submit the form
**Then** I see an error "Contest code already exists"

**Given** the database migration runs for this story
**When** I check the schema
**Then** `contests` table exists with: id, name, description, cover_image_url, contest_code, rules, status, created_at, updated_at
**And** `participant_codes` table exists with: id, contest_id, code, is_used, participant_id, created_at
**And** RLS policies restrict access to authenticated admins only

**Requirements:** FR6, FR15, FR19, ARCH7-8

---

### Story 2.4: Contest List & Status Management

As a **Super Admin**,
I want **to view all contests and manage their status**,
So that **I can track and control the contest lifecycle**.

**Acceptance Criteria:**

**Given** I am on the Contests page
**When** the page loads
**Then** I see a list of all contests as ContestCard components
**And** each card shows: name, status badge, submission count (0 initially), created date

**Given** I view the contest list
**When** there are no contests
**Then** I see an empty state: "No contests yet" with "Create your first contest" button

**Given** I click on a contest card
**When** the detail page loads
**Then** I see the full contest details with tabs: Details, Categories, Codes, Judges

**Given** I am on a contest detail page
**When** I click "Edit"
**Then** I can modify: name, description, cover image, rules
**And** changes are saved with a success toast

**Given** I want to change contest status
**When** I click the status dropdown
**Then** I can select: Draft, Published, Closed, Reviewed, Finished
**And** the status updates immediately

**Given** I want to delete a contest
**When** I click "Delete"
**Then** I see a confirmation dialog: "Are you sure? This will delete all categories, submissions, and codes."
**And** only after confirming is the contest deleted

**Requirements:** FR8, FR9, FR10, FR11, UX10, UX11, UX17, UX25

---

### Story 2.5: Category Management

As a **Super Admin**,
I want **to create and manage categories within a contest**,
So that **participants can submit to different competition types**.

**Acceptance Criteria:**

**Given** contest status is Draft or Published
**When** I click "Add Category"
**Then** I can create a new category (starts in Draft status)

**Given** contest status is Closed, Reviewed, or Finished
**When** I view the Categories tab
**Then** the "Add Category" button is disabled/hidden
**And** I see a message "Cannot add categories to a closed contest"

**Given** a category is in Draft status
**When** I view that category
**Then** I can edit all fields: name, type, deadline, rules, description
**And** I can delete the category

**Given** a category is in Published or Closed status
**When** I view that category
**Then** all form fields are disabled (read-only)
**And** I can only change the status

**Given** a category has 0 submissions
**When** I change its status
**Then** I can select: Draft, Published, or Closed

**Given** a category has 1+ submissions
**When** I change its status
**Then** I can only select: Published or Closed
**And** Draft option is disabled with tooltip "Cannot set to Draft - category has submissions"

**Given** a category deadline has passed
**When** the system checks (or page loads)
**Then** the category status is automatically set to Closed

**Given** the database migration runs for this story
**When** I check the schema
**Then** `categories` table exists with: id, contest_id, name, type (enum: video/photo), deadline, rules, description, status, created_at
**And** RLS policies restrict to authenticated admins

**Requirements:** FR7, FR12, FR14, ARCH7-8

---

### Story 2.6: Participant Code Management

As a **Super Admin**,
I want **to view, generate, and export participant codes**,
So that **I can distribute access codes to participants**.

**Acceptance Criteria:**

**Given** I am on the contest Codes tab
**When** the page loads
**Then** I see a CodeListTable showing all codes with columns: Code, Status (Used/Unused), Participant Name (if used)

**Given** I view the codes list
**When** some codes are used
**Then** used codes show the participant's name
**And** unused codes show "-" in the participant column

**Given** I want to filter codes
**When** I click the status filter
**Then** I can filter by: All, Used, Unused

**Given** I need more codes
**When** I click "Generate 50 More"
**Then** 50 new 8-digit codes are created
**And** I see a success toast "50 codes generated"
**And** the list updates to show new codes

**Given** I want to export codes
**When** I click "Export"
**Then** a CSV file downloads with columns: Code, Status
**And** filename is "{contest_code}_participant_codes.csv"

**Given** participant codes are generated
**When** I inspect any code
**Then** it is exactly 8 digits, numeric only
**And** it is unique within the contest

**Requirements:** FR16, FR17, FR18, FR19, UX19

---

### Story 2.7: Admin Dashboard with Stats

As a **Super Admin**,
I want **to see an overview of all contests with key metrics**,
So that **I can quickly assess contest health and judge progress**.

**Acceptance Criteria:**

**Given** I am on the admin dashboard
**When** the page loads
**Then** I see a summary section with: Total Contests, Active Contests, Total Submissions

**Given** I have active contests
**When** I view the dashboard
**Then** I see a list of active contests with: name, status, submission count, judge progress percentage

**Given** a contest has judges assigned
**When** I view its dashboard card
**Then** I see "Judge Progress: X/Y reviewed" where X is completed reviews and Y is total submissions

**Given** I click on a contest in the dashboard
**When** I am redirected
**Then** I land on that contest's detail page

**Given** there are no contests
**When** I view the dashboard
**Then** I see an empty state with "Create your first contest" CTA

**Requirements:** FR13, UX10, UX17

---

## Epic 3: Judge Onboarding & Assignment

**Goal:** Super Admin can invite judges to categories, and judges can set their password and access the system.

**FRs covered:** FR2, FR3, FR4, FR20-24 (7 FRs)
**NFRs:** NFR7-9

---

### Story 3.1: Assign Judge to Category

As a **Super Admin**,
I want **to assign a judge to a category by email address**,
So that **the judge can review submissions for that category**.

**Acceptance Criteria:**

**Given** I am on a category detail page
**When** I click "Assign Judge"
**Then** I see an input field for judge email address

**Given** I enter an email for someone who is NOT in the system
**When** I click "Assign"
**Then** a new profile is created with role "judge" and no password set
**And** the judge is assigned to this category
**And** I see a success toast "Judge assigned - invite will be sent when category closes"

**Given** I enter an email for someone who already exists as a judge
**When** I click "Assign"
**Then** that existing judge is assigned to this category
**And** I see a success toast "Judge assigned"

**Given** a category already has a judge assigned
**When** I view the category
**Then** I see the assigned judge's email
**And** I see a "Remove Judge" button

**Given** I click "Remove Judge"
**When** I confirm the action
**Then** the judge is unassigned from the category
**And** any existing reviews by that judge remain in the database (not deleted)
**And** I see a success toast "Judge removed"

**Given** the database migration runs for this story
**When** I check the schema
**Then** `categories` table has new columns: assigned_judge_id (FK to profiles, nullable), invited_at (timestamp, nullable)

**Requirements:** FR20, FR23, ARCH7-8

---

### Story 3.2: Judge Invitation Email

As a **System**,
I want **to send invitation emails to judges when their category closes**,
So that **judges know when to start reviewing submissions**.

**Acceptance Criteria:**

**Given** a category has a judge assigned
**When** the category status changes to "Closed" (manually or via deadline)
**Then** an invitation email is sent to the judge
**And** the `invited_at` timestamp is set on the category

**Given** the invitation email is sent
**When** the judge receives it
**Then** the email contains: contest name, category name, submission count, login link
**And** the subject line is "You're invited to judge: {category_name}"

**Given** a category has no judge assigned
**When** the category status changes to "Closed"
**Then** no email is sent
**And** admin sees a warning "Category closed without judge assigned"

**Given** a judge was already invited (invited_at is set)
**When** the category closes again (edge case)
**Then** no duplicate email is sent

**Given** the Supabase Edge Function is created
**When** I check `supabase/functions/send-notification/`
**Then** it handles judge invitation emails via Brevo API

**Requirements:** FR21, NFR26

---

### Story 3.3: Judge Password Setup

As a **new Judge**,
I want **to set my password when first accessing the platform**,
So that **I can securely log in to review submissions**.

**Acceptance Criteria:**

**Given** I am a new judge (profile exists but no password set)
**When** I click the login link in my invitation email
**Then** I am redirected to a "Set Password" page

**Given** I am on the Set Password page
**When** I enter a new password (min 8 characters) and confirm it
**Then** my password is saved
**And** I am automatically logged in
**And** I am redirected to the judge dashboard

**Given** I enter mismatched passwords
**When** I click "Set Password"
**Then** I see an error "Passwords do not match"

**Given** I enter a password less than 8 characters
**When** I click "Set Password"
**Then** I see an error "Password must be at least 8 characters"

**Given** I already have a password set
**When** I try to access the Set Password page
**Then** I am redirected to the regular login page

**Requirements:** FR3, NFR7-8

---

### Story 3.4: Judge Login & Dashboard

As a **Judge**,
I want **to log in and see my assigned categories**,
So that **I can access submissions for review**.

**Acceptance Criteria:**

**Given** I am on the login page
**When** I enter valid judge credentials
**Then** I am authenticated and redirected to /judge dashboard

**Given** I am logged in as a judge
**When** I view my dashboard
**Then** I see a list of all categories assigned to me
**And** each category shows: contest name, category name, status, submission count

**Given** a category is "Closed" (ready for judging)
**When** I view it on my dashboard
**Then** I see a "Start Reviewing" button
**And** the card is highlighted/prominent

**Given** a category is "Published" (not yet closed)
**When** I view it on my dashboard
**Then** I see "Awaiting deadline: {date}"
**And** the "Start Reviewing" button is disabled

**Given** I have no assigned categories
**When** I view my dashboard
**Then** I see an empty state: "No categories assigned yet"

**Given** I forgot my password
**When** I click "Forgot password" on the login page
**Then** I can reset my password via email (same flow as admin)

**Requirements:** FR2, FR4, FR24, NFR7-9, UX23

---

### Story 3.5: Admin View Judge Progress

As a **Super Admin**,
I want **to see how many submissions each judge has reviewed**,
So that **I can track judging progress**.

**Acceptance Criteria:**

**Given** I am on the contest Judges tab
**When** the page loads
**Then** I see a list of all categories with their assigned judges
**And** each row shows: category name, judge email (or "Unassigned"), progress

**Given** a judge has reviewed some submissions
**When** I view the Judges tab
**Then** I see progress as "X / Y reviewed" (e.g., "5 / 12 reviewed")
**And** a progress bar visualizes the percentage

**Given** a judge has completed all reviews
**When** I view the Judges tab
**Then** the progress shows "Complete" with a checkmark
**And** the row is visually marked as done (green highlight or badge)

**Given** a category has no judge assigned
**When** I view the Judges tab
**Then** I see "No judge assigned" in the judge column
**And** an "Assign" button is available

**Given** I click on a judge's email
**When** the action triggers
**Then** I can see detailed review status (which submissions reviewed/pending)

**Requirements:** FR22

---

## Epic 4: Participant Submission Experience

**Goal:** Participants can enter contests with their codes, upload media, and manage their submissions.

**FRs covered:** FR5, FR25-37 (14 FRs)
**NFRs:** NFR4-6, NFR10, NFR12-13, NFR15-16, NFR18-21, NFR24-25
**UX Components:** UX13 (UploadProgress)
**UX Safeguards:** UX9 (session warning), UX12 (deadline countdown)

---

### Story 4.1: Participant Code Entry & Session

As a **Participant**,
I want **to access a contest using my contest code and participant code**,
So that **I can submit my work without creating an account**.

**Acceptance Criteria:**

**Given** I am on the participant entry page
**When** I see the form
**Then** I see two input fields: Contest Code (6 characters) and Participant Code (8 digits)

**Given** I enter a valid contest code and valid participant code
**When** I click "Enter Contest"
**Then** a participant session is created
**And** I am redirected to the contest view page
**And** my session is stored (localStorage + context)

**Given** I enter an invalid contest code
**When** I click "Enter Contest"
**Then** I see an error "Contest not found"

**Given** I enter an invalid participant code
**When** I click "Enter Contest"
**Then** I see an error "Invalid participant code"

**Given** the contest is not Published (Draft, Closed, Reviewed, or Finished)
**When** I try to enter
**Then** I see an error "This contest is not accepting submissions"

**Given** I have an active session
**When** I am inactive for 120 minutes
**Then** I see a session timeout warning 5 minutes before expiry (UX9)
**And** after timeout, I am redirected to the entry page with message "Session expired"

**Given** the database migration runs for this story
**When** I check the schema
**Then** `participants` table exists with: id, contest_id, participant_code_id, name, school_organization, tlc_name, tlc_email, created_at, updated_at
**And** the Supabase Edge Function `validate-participant` exists

**Requirements:** FR5, ARCH9-10, UX9, NFR12

---

### Story 4.2: Participant Info Form

As a **Participant**,
I want **to enter my personal information and teacher/leader/coach details**,
So that **my submission is properly attributed**.

**Acceptance Criteria:**

**Given** I have entered a contest for the first time (no participant record)
**When** I view the info form
**Then** I see fields: Name, School/Organization, Teacher/Leader/Coach Name, T/L/C Email
**And** all fields are empty

**Given** I have previously submitted in this contest
**When** I view the info form
**Then** all fields are auto-filled with my previous data
**And** I can still edit any field

**Given** I fill out all required fields
**When** I click "Continue"
**Then** my participant record is created/updated
**And** I am redirected to the categories view

**Given** I leave required fields empty
**When** I click "Continue"
**Then** I see validation errors on the empty fields
**And** I cannot proceed

**Given** I enter an invalid email for T/L/C
**When** I blur the field
**Then** I see an error "Please enter a valid email address"

**Given** my info is saved
**When** I submit to another category later
**Then** my info auto-fills without re-entering (FR28)

**Requirements:** FR26, FR27, FR28, UX22

---

### Story 4.3: View Categories & Submission Status

As a **Participant**,
I want **to see all available categories and my submission status**,
So that **I know where I can submit and what I've already submitted**.

**Acceptance Criteria:**

**Given** I am on the contest view page
**When** the page loads
**Then** I see a list of all categories for this contest
**And** each category shows: name, type (Video/Photo), deadline, status badge, my submission status

**Given** a category is "Published"
**When** I view it
**Then** I see a "Submit" button
**And** I see the deadline with countdown timer (UX12)

**Given** a category is "Draft"
**When** I view the contest
**Then** that category is NOT visible to me

**Given** a category is "Closed"
**When** I view it
**Then** I see "Submissions closed" instead of submit button
**And** the card is visually muted

**Given** I have already submitted to a category
**When** I view that category
**Then** I see "Submitted" badge with checkmark
**And** I see "View/Edit" button instead of "Submit"

**Given** the deadline is within 2 hours
**When** I view the category
**Then** the countdown timer is highlighted in amber/warning color

**Given** the deadline is within 10 minutes
**When** I view the category
**Then** the countdown timer is highlighted in red/urgent color

**Requirements:** FR25, FR37, UX12, UX25

---

### Story 4.4: Video Upload with Progress

As a **Participant**,
I want **to upload a video file with real-time progress feedback**,
So that **I can submit my video entry and know it's uploading successfully**.

**Acceptance Criteria:**

**Given** I click "Submit" on a video category
**When** I see the upload form
**Then** I see a file picker accepting video formats: .mp4, .mkv, .m4v, .mov, .avi, .flv, .wmv, .ts, .mpeg
**And** I see the maximum file size: 500MB

**Given** I select a valid video file under 500MB
**When** the upload begins
**Then** I see the UploadProgress component with: file name, progress bar, percentage, upload speed
**And** the submission timestamp is recorded NOW (not when upload completes)

**Given** the upload is in progress
**When** I watch the progress
**Then** the progress bar updates smoothly in real-time
**And** I cannot navigate away without a warning

**Given** the upload completes
**When** the file is processed
**Then** I see "Processing..." state briefly
**And** then I am redirected to the preview page

**Given** I select a file over 500MB
**When** I try to upload
**Then** I see an error "File too large. Maximum size is 500MB"
**And** the upload does not start

**Given** I select an unsupported file format
**When** I try to upload
**Then** I see an error "Invalid file type. Supported formats: MP4, MKV, MOV, AVI, WMV, FLV, TS, MPEG"

**Given** the upload fails (network error)
**When** the error occurs
**Then** I see an error message with "Retry" button
**And** the upload can resume from where it left off (resumable)

**Given** the Supabase Edge Function runs
**When** I request an upload URL
**Then** a signed Bunny Stream URL is returned
**And** the upload goes directly to Bunny (not through our server)

**Given** the database migration runs for this story
**When** I check the schema
**Then** `submissions` table exists with: id, participant_id, category_id, media_type, media_url, bunny_video_id, thumbnail_url, status, submitted_at, created_at, updated_at

**Requirements:** FR29, FR31, FR32, ARCH9, ARCH11, NFR4-6, NFR19, NFR24, UX13

---

### Story 4.5: Photo Upload with Progress

As a **Participant**,
I want **to upload a photo file with real-time progress feedback**,
So that **I can submit my photo entry**.

**Acceptance Criteria:**

**Given** I click "Submit" on a photo category
**When** I see the upload form
**Then** I see a file picker accepting image formats: .jpg, .jpeg, .png, .webp, .gif
**And** I see the maximum file size: 10MB

**Given** I select a valid image file under 10MB
**When** the upload begins
**Then** I see the UploadProgress component with: file name, progress bar, percentage
**And** the submission timestamp is recorded NOW (not when upload completes)

**Given** the upload completes
**When** the file is stored
**Then** I am redirected to the preview page

**Given** I select a file over 10MB
**When** I try to upload
**Then** I see an error "File too large. Maximum size is 10MB"

**Given** I select an unsupported file format
**When** I try to upload
**Then** I see an error "Invalid file type. Supported formats: JPG, PNG, WebP, GIF"

**Given** the upload fails
**When** the error occurs
**Then** I see an error message with "Retry" button

**Given** the Supabase Edge Function runs
**When** I request an upload URL
**Then** a signed Bunny Storage URL is returned
**And** the file is stored at path: /{contest_id}/{category_id}/{participant_code}/{filename}

**Requirements:** FR30, FR31, FR32, ARCH9, ARCH11, NFR5-6, NFR25, UX13

---

### Story 4.6: Submission Preview & Confirm

As a **Participant**,
I want **to preview my uploaded submission before final submit**,
So that **I can verify it's correct before committing**.

**Acceptance Criteria:**

**Given** my upload completes
**When** I land on the preview page
**Then** I see my uploaded media displayed (video player or image)
**And** I see "Confirm Submission" and "Replace" buttons

**Given** I am previewing a video
**When** I view the preview
**Then** the video plays in an embedded player
**And** I can play/pause and scrub through it

**Given** I am previewing a photo
**When** I view the preview
**Then** the image displays at a reasonable size
**And** I can click to view full-screen

**Given** I click "Confirm Submission"
**When** the submission is confirmed
**Then** the submission status changes to "submitted"
**And** I see a success message "Your submission has been received!"
**And** I am redirected to the categories view

**Given** I click "Replace"
**When** I choose a new file
**Then** I go through the upload flow again
**And** the preview updates with the new file

**Given** I navigate away without confirming
**When** I return to this category later
**Then** I see my pending upload and can still confirm or replace

**Requirements:** FR33, UX15

---

### Story 4.7: Edit, Replace & Withdraw Submission

As a **Participant**,
I want **to edit, replace, or withdraw my submission before the deadline**,
So that **I can improve my entry or remove it entirely**.

**Acceptance Criteria:**

**Given** I have a confirmed submission in a category
**When** I click "View/Edit" on that category
**Then** I see my current submission with options: "Replace" and "Withdraw"

**Given** I click "Replace"
**When** I upload a new file
**Then** the old file is deleted from Bunny storage
**And** the new file becomes my submission
**And** the submitted_at timestamp is updated to NOW

**Given** I click "Withdraw"
**When** I see the confirmation dialog
**Then** it warns "This will remove your submission. You can submit again before the deadline."

**Given** I confirm withdrawal
**When** the action completes
**Then** my submission is deleted
**And** the media file is deleted from Bunny storage
**And** I see the "Submit" button again for this category

**Given** the category deadline has passed
**When** I view my submission
**Then** the "Replace" and "Withdraw" buttons are hidden/disabled
**And** I see "Deadline passed - submission locked"

**Given** the category is Closed
**When** I try to submit, replace, or withdraw
**Then** I am blocked with message "This category is no longer accepting changes"

**Requirements:** FR34, FR35, FR36, UX11

---

## Epic 5: Judging & Evaluation Workflow

**Goal:** Judges can anonymously review all submissions, provide ratings and feedback, and rank their top 3.

**FRs covered:** FR38-48 (11 FRs)
**NFRs:** NFR3, NFR10
**UX Components:** UX14 (RatingScale), UX15 (MediaViewer), UX16 (SubmissionCard), UX18 (RankingDropzone)

---

### Story 5.1: Judge Review Dashboard

As a **Judge**,
I want **to see my review progress for each assigned category**,
So that **I know how many submissions I've reviewed and how many remain**.

**Acceptance Criteria:**

**Given** I am logged in as a judge
**When** I click on a category from my dashboard
**Then** I see the category review page with: category name, contest name, total submissions, my progress

**Given** I am on the category review page
**When** I view the progress section
**Then** I see "X of Y reviewed" with a progress bar
**And** I see a list/grid of all submissions as SubmissionCard components

**Given** I view the submission cards
**When** I look at each card
**Then** I see: participant code (NOT name), thumbnail, review status (Pending/Reviewed)
**And** reviewed submissions show my rating tier

**Given** I have reviewed some submissions
**When** I return to the category later
**Then** my progress is preserved
**And** I can continue where I left off

**Given** I want to filter submissions
**When** I click the filter dropdown
**Then** I can filter by: All, Pending, Reviewed

**Given** the database migration runs for this story
**When** I check the schema
**Then** `reviews` table exists with: id, submission_id, judge_id, rating, feedback, created_at, updated_at
**And** RLS policies ensure judges can only see/edit their own reviews

**Requirements:** FR38, FR45, UX16, NFR10

---

### Story 5.2: Anonymous Submission View

As a **Judge**,
I want **to view submissions anonymously without seeing participant details**,
So that **I can evaluate fairly without bias**.

**Acceptance Criteria:**

**Given** I click on a submission to review
**When** the review page loads
**Then** I see the participant code prominently displayed
**And** I do NOT see: participant name, school, teacher name, or any PII

**Given** I am reviewing a submission
**When** I look at the interface
**Then** I see: media viewer, rating scale, feedback textarea, navigation buttons

**Given** I want to navigate between submissions
**When** I click "Previous" or "Next"
**Then** I move to the adjacent submission in the list
**And** my current work is auto-saved before navigating

**Given** I am on the first submission
**When** I view the navigation
**Then** the "Previous" button is disabled

**Given** I am on the last submission
**When** I view the navigation
**Then** the "Next" button is disabled
**And** I see "You've reached the last submission"

**Given** I use keyboard navigation
**When** I press left/right arrow keys
**Then** I navigate to previous/next submission (when not focused on textarea)

**Requirements:** FR39, FR44, NFR10

---

### Story 5.3: Media Playback (Photo & Video)

As a **Judge**,
I want **to view photos full-screen and stream videos smoothly**,
So that **I can properly evaluate the quality of submissions**.

**Acceptance Criteria:**

**Given** I am reviewing a photo submission
**When** the page loads
**Then** the photo displays at a reasonable preview size
**And** I see an "Expand" button to view full-screen

**Given** I click "Expand" on a photo
**When** the MediaViewer opens
**Then** the photo displays full-screen with a dark overlay
**And** I can press Esc or click outside to close
**And** I can zoom in/out with scroll or pinch

**Given** I am reviewing a video submission
**When** the page loads
**Then** the video loads in an embedded player (Bunny Stream)
**And** playback starts within 2 seconds (NFR3)

**Given** I am watching a video
**When** I use the player controls
**Then** I can: play/pause (spacebar), seek (click timeline), adjust volume, toggle fullscreen
**And** arrow keys skip forward/back 10 seconds

**Given** I am in fullscreen mode
**When** I press Esc
**Then** I exit fullscreen and return to the review page

**Given** the video fails to load
**When** an error occurs
**Then** I see an error message "Video unavailable" with a retry button

**Requirements:** FR40, FR41, NFR3, UX15

---

### Story 5.4: Rating & Feedback Form

As a **Judge**,
I want **to rate submissions on a 5-tier scale and optionally provide written feedback**,
So that **participants receive meaningful evaluation**.

**Acceptance Criteria:**

**Given** I am on a submission review page
**When** I view the rating section
**Then** I see the RatingScale component with 5 tiers:
| Tier | Label | Score Range |
|------|-------|-------------|
| 1 | Developing Skills | 1-2 |
| 2 | Emerging Producer | 3-4 |
| 3 | Proficient Creator | 5-6 |
| 4 | Advanced Producer | 7-8 |
| 5 | Master Creator | 9-10 |

**Given** I click on a rating tier
**When** the tier is selected
**Then** the tier is visually highlighted
**And** my selection is recorded

**Given** I have selected a tier
**When** I want to give a specific score
**Then** I can select a number within the tier's range (e.g., 7 or 8 for "Advanced Producer")

**Given** I view the feedback section
**When** I see the textarea
**Then** I see a placeholder: "Provide constructive feedback for the participant... (optional)"
**And** feedback is NOT required to save the review

**Given** I type feedback
**When** I blur the textarea or navigate away
**Then** my feedback is auto-saved
**And** I see a subtle "Saved" indicator

**Given** I have selected a rating (feedback optional)
**When** I click "Save & Next"
**Then** my review is saved
**And** I navigate to the next unreviewed submission

**Given** I try to navigate without selecting a rating
**When** I click Next
**Then** I see a warning "Please select a rating before continuing"
**And** I am NOT blocked if feedback is empty

**Requirements:** FR42, FR43, UX14

---

### Story 5.5: Top 3 Ranking (Drag & Drop)

As a **Judge**,
I want **to rank my top 3 submissions using drag-and-drop**,
So that **the best entries are identified for awards**.

**Acceptance Criteria:**

**Given** I have reviewed all submissions in a category
**When** I click "Proceed to Ranking"
**Then** I see the RankingDropzone component with three positions: 1st, 2nd, 3rd

**Given** I am on the ranking page
**When** I view available submissions
**Then** I see all reviewed submissions **sorted by rating (highest first, lowest last)**
**And** each card shows: participant code, thumbnail, my rating tier and score

**Given** I drag a submission card
**When** I drop it onto a ranking position
**Then** the card snaps into that position
**And** the position is visually filled
**And** I see confirmation feedback

**Given** a ranking position is already filled
**When** I drag another submission onto it
**Then** the new submission replaces the old one
**And** the old submission returns to the available pool

**Given** I try to rank a lower-rated submission above a higher-rated one
**When** I attempt to drop it in a higher position
**Then** I see an error: "Cannot rank a lower-rated submission above a higher-rated one"
**And** the drop is rejected

**Ranking constraint example:**
- If Submission A is rated "Master Creator (9)" and Submission B is rated "Proficient Creator (5)"
- Submission B CANNOT be ranked 1st if Submission A is ranked 2nd or 3rd
- The ranking must respect the rating hierarchy

**Given** I have multiple submissions with the same rating
**When** I rank them
**Then** I can order them in any position relative to each other (same rating = judge's discretion)

**Given** I want to remove a ranked submission
**When** I drag it out of the position (or click remove)
**Then** the position becomes empty
**And** the submission returns to the available pool

**Given** I use keyboard navigation
**When** I focus on a submission and press Enter
**Then** I can use arrow keys to select a position and Enter to confirm

**Given** I have ranked my top 3
**When** I view the ranking
**Then** I see clearly: 1st Place, 2nd Place, 3rd Place with the selected submissions
**And** the ranking respects rating order: 1st ≥ 2nd ≥ 3rd (by rating score)

**Given** the database migration runs for this story
**When** I check the schema
**Then** `rankings` table exists with: id, category_id, judge_id, rank (1/2/3), submission_id, created_at, updated_at
**And** unique constraint ensures one submission per rank per judge per category

**Requirements:** FR46, UX18

---

### Story 5.6: Mark Category Complete & Notify Admin

As a **Judge**,
I want **to mark a category as complete when I've finished all reviews and rankings**,
So that **the admin knows my judging is done**.

**Acceptance Criteria:**

**Given** I have reviewed ALL submissions in a category
**And** I have ranked my top 3
**When** I view the category page
**Then** I see a "Mark as Complete" button

**Given** I have NOT reviewed all submissions
**When** I view the category page
**Then** the "Mark as Complete" button is disabled
**And** I see "Review all submissions before completing"

**Given** I have NOT ranked top 3
**When** I view the category page
**Then** the "Mark as Complete" button is disabled
**And** I see "Rank your top 3 before completing"

**Given** I click "Mark as Complete"
**When** I see the confirmation dialog
**Then** it shows: "You reviewed X submissions and ranked your top 3. Mark this category as complete?"

**Given** I confirm completion
**When** the action processes
**Then** the category is marked complete for me
**And** I see a success message "Category marked as complete"
**And** I can no longer edit ratings, feedback, or rankings

**Given** the category is marked complete
**When** the system processes
**Then** an email notification is sent to the Super Admin (FR48)
**And** the email contains: judge name, contest name, category name, completion timestamp

**Given** the category is complete
**When** I view it on my dashboard
**Then** I see "Complete" badge
**And** I can still view (read-only) my reviews and rankings

**Requirements:** FR47, FR48, NFR26

---

## Epic 6: Admin Oversight & Results Publication

**Goal:** Enable Super Admin to review judge work, override when necessary, and publish contest results.

**Value Delivered:** Complete control over final results with transparency into judge decisions.

**Dependencies:** Epic 2 (Admin Auth), Epic 5 (Judging complete)

### Story 6.1: Admin View All Submissions

As a **Super Admin**,
I want **to view all submissions with full participant data**,
So that **I can see who submitted what and track participation**.

**Acceptance Criteria:**

**Given** I am logged in as Super Admin
**When** I navigate to a contest's submissions page
**Then** I see a table/list of all submissions across all categories

**Given** I view the submissions list
**When** I examine each row
**Then** I see:
| Field | Source |
|-------|--------|
| Participant Code | submissions.participant_id → participants.code |
| Participant Name | participants.name |
| School/Organization | participants.institution |
| Teacher/Leader/Coach | participants.tlc_name, participants.tlc_email |
| Category | categories.name |
| Media Type | submissions.media_type (video/photo) |
| Submitted At | submissions.submitted_at |
| Status | submissions.status |

**Given** I view the submissions
**When** there are many entries
**Then** I can filter by:
- Category (dropdown)
- Status (submitted, reviewed, disqualified)
- Media type (video/photo)

**Given** I click on a submission row
**When** the detail view opens
**Then** I see the full submission with media preview
**And** I can play videos or view photos in full

**Given** I view a submission
**When** I check the participant info
**Then** I see ALL personal data (name, institution, T/L/C) - NOT anonymized

**Requirements:** FR49

---

### Story 6.2: View Judge Ratings & Feedback

As a **Super Admin**,
I want **to view all judge ratings and feedback for any submission**,
So that **I can ensure fair and quality judging**.

**Acceptance Criteria:**

**Given** I am viewing a submission detail
**When** I look at the judging section
**Then** I see the assigned judge's review (if reviewed)

**Given** the submission has been reviewed
**When** I view the review section
**Then** I see:
| Field | Value |
|-------|-------|
| Judge Name | profiles.name (via reviews.judge_id) |
| Rating Tier | Developing Skills / Emerging Producer / etc. |
| Rating Score | 1-10 |
| Written Feedback | Text (or "No feedback provided") |
| Reviewed At | reviews.updated_at |

**Given** the submission has NOT been reviewed
**When** I view the review section
**Then** I see "Pending Review" with the assigned judge's name

**Given** I am on the category overview
**When** I want to see all ratings at once
**Then** I can view a summary table showing:
| Participant Code | Rating | Feedback Preview | Ranking Position |
**And** ratings are sortable (highest to lowest)

**Given** I want to compare submissions
**When** I select multiple submissions
**Then** I can view them side-by-side with their ratings

**Requirements:** FR50

---

### Story 6.3: Override Feedback & Rankings

As a **Super Admin**,
I want **to override judge feedback and category rankings**,
So that **I can correct errors or ensure quality results**.

**Acceptance Criteria:**

**Given** I am viewing a submission's review
**When** I click "Override Feedback"
**Then** I see a form with:
- Original feedback (read-only, grayed out)
- Override feedback textarea

**Given** I enter override feedback
**When** I click "Save Override"
**Then** the override is saved immediately
**And** the original feedback is preserved in the database (for data integrity)

**Given** I am viewing a category's rankings
**When** I see the judge's top 3
**Then** I see: 1st, 2nd, 3rd with submission details

**Given** I want to override rankings
**When** I click "Override Rankings"
**Then** I see a drag-drop interface (similar to judge's)
**And** I can reorder the top 3

**Given** I override rankings
**When** I submit changes
**Then** the override is saved immediately
**And** the original rankings are preserved (for data integrity)

**Note:** Judges are never notified of overrides. From the judge's perspective, their reviews and rankings remain unchanged in their view.

**Database consideration:**
```sql
-- Add to reviews table
admin_feedback_override TEXT,
admin_override_at TIMESTAMPTZ

-- Add to rankings table
admin_ranking_override UUID REFERENCES submissions(id),  -- The new submission for this rank position
admin_override_at TIMESTAMPTZ
```

**Logic:**
- `submission_id` = judge's original pick for this rank
- `admin_ranking_override` = admin's pick (if different)
- If `admin_ranking_override` IS NULL → use `submission_id`
- If `admin_ranking_override` IS NOT NULL → use `admin_ranking_override`
- `admin_override_at` indicates when the override happened

**Requirements:** FR51, FR52

---

### Story 6.4: Disqualify Submissions

As a **Super Admin**,
I want **to disqualify individual submissions**,
So that **rule-violating entries are excluded from results**.

**Acceptance Criteria:**

**Given** I am viewing a submission
**When** I click "Disqualify"
**Then** I see a confirmation dialog: "Are you sure you want to disqualify this submission?"

**Given** I confirm disqualification
**When** the action processes
**Then** the submission status changes to "disqualified"
**And** the submission is removed from any rankings
**And** I see success: "Submission disqualified"

**Given** a submission is disqualified
**When** it appears in admin lists
**Then** it shows "Disqualified" badge (red)
**And** it is excluded from judge's ranking pool (if not yet ranked)
**And** it is excluded from winners page

**Given** a submission was already in top 3 rankings
**When** I disqualify it
**Then** it is removed from rankings
**And** the rankings are NOT auto-adjusted (admin must re-rank if needed)
**And** a warning shows: "Ranking position is now empty"

**Given** I accidentally disqualified
**When** I view the disqualified submission
**Then** I see a "Restore" button

**Given** I click "Restore"
**When** I confirm restoration
**Then** the submission returns to "submitted" or "reviewed" status
**And** it is NOT automatically re-added to rankings

**Note:** Participants are never notified of disqualification. From the participant's perspective, their submission appears normal - they simply won't appear in winners.

**Database consideration:**
```sql
-- Add to submissions table
disqualified_at TIMESTAMPTZ,
restored_at TIMESTAMPTZ
```

**Requirements:** FR53

---

### Story 6.5: Generate Winners Page

As a **Super Admin**,
I want **to generate a password-protected winners page**,
So that **results can be shared securely with stakeholders**.

**Acceptance Criteria:**

**Given** I am on a contest that is in "Reviewed" status
**When** I want to generate the winners page
**Then** I must first complete a category-by-category approval process

**Given** I start the approval process
**When** I view the first category
**Then** I see:
- Category name
- All submissions in that category
- Judge's ratings and rankings
- Any admin overrides applied
- Current top 3 winners

**Given** I review a category
**When** I am satisfied with the results
**Then** I click "Approve Category"
**And** the category is marked as approved

**Given** I have NOT approved all categories
**When** I try to generate winners page
**Then** the "Generate Winners Page" button is disabled
**And** I see: "Approve all categories before publishing (X of Y approved)"

**Given** all categories are approved
**When** I click "Generate Winners Page"
**Then** I see the winners page setup form

**Given** I see the setup form
**When** I review the options
**Then** I can:
- Set a password (required, min 6 characters)
- Preview the winners page

**Given** I set a password
**When** I enter it
**Then** I see password strength indicator
**And** I must confirm the password

**Given** I click "Preview"
**When** the preview loads
**Then** I see exactly what viewers will see after entering password
**And** I see all top 3 winners per category with media

**Given** I click "Generate"
**When** the page is created
**Then** a unique URL is generated: `/winners/{contest-code}`
**And** I see the URL to share
**And** I can copy the URL to clipboard
**And** the contest status changes to "Finished"

**Given** I want to update the password later
**When** I go to winners page settings
**Then** I can change the password
**And** existing links remain valid (only password changes)

**Given** I want to regenerate after changes
**When** I click "Regenerate Winners Page"
**Then** I must re-approve any modified categories
**And** the URL remains the same

**Given** I want to revoke access
**When** I click "Revoke Winners Page"
**Then** the page shows "Results not available"
**And** even with correct password, no data is shown

**Database consideration:**
```sql
-- Add to contests table
winners_page_enabled BOOLEAN DEFAULT FALSE,
winners_page_password_hash TEXT,
winners_page_generated_at TIMESTAMPTZ

-- Add to categories table
approved_for_winners BOOLEAN DEFAULT FALSE,
approved_at TIMESTAMPTZ
```

**Requirements:** FR54, FR55

---

### Story 6.6: Winners Page Display & Download

As a **Public Viewer**,
I want **to view and download winning submissions after entering the password**,
So that **I can celebrate and share the winners**.

**Acceptance Criteria:**

**Given** I navigate to `/winners/{contest-code}`
**When** the page loads
**Then** I see:
- Contest name and cover image (static, no sensitive data)
- Password input field
- "View Results" button
- **NO winners data is fetched from server yet**

**Given** the page loads
**When** I inspect network requests
**Then** NO API calls are made to fetch submissions, media URLs, or winner data
**And** only the contest name and cover image are loaded (public metadata)

**Given** I enter the wrong password
**When** I click "View Results"
**Then** I see error: "Incorrect password"
**And** I can try again (rate limited: 5 attempts per minute)
**And** still NO winner data is fetched

**Given** I enter the correct password
**When** I click "View Results"
**Then** the password is validated server-side
**And** ONLY THEN the winners data is fetched from API
**And** the winners are revealed with a nice animation
**And** my session is stored in sessionStorage (not localStorage)

**Given** I view the winners
**When** I see the content
**Then** I see each category with:
| Position | Display |
|----------|---------|
| 1st Place | Gold styling, larger display |
| 2nd Place | Silver styling |
| 3rd Place | Bronze styling |

**Given** I view a winner entry
**When** I examine the card
**Then** I see:
- Participant name (NO participant code - this is public)
- School/Organization
- Category name
- Media thumbnail (video) or full image (photo)

**Given** I click on a video winner
**When** the player opens
**Then** I can stream the video in high quality
**And** I see a "Download" button

**Given** I click on a photo winner
**When** the lightbox opens
**Then** I see the full-resolution image
**And** I see a "Download" button

**Download abuse prevention:**

**Given** I click "Download"
**When** the download starts
**Then** only ONE download can be active at a time per session
**And** a "Download in progress..." indicator shows
**And** other download buttons are temporarily disabled

**Given** I try to download multiple files rapidly
**When** I click multiple download buttons
**Then** downloads are queued (max 1 concurrent)
**And** I see: "Please wait for current download to complete"

**Given** I download a file
**When** it completes
**Then** a 3-second cooldown applies before next download
**And** this prevents rapid sequential downloads

**Given** I try to abuse the system (automated/scripted)
**When** unusual patterns are detected (>10 downloads in 5 minutes)
**Then** downloads are temporarily blocked for that session
**And** message: "Too many downloads. Please try again later."

**Given** the download completes
**When** the file is saved
**Then** filename format: `{contest-code}_{category}_{place}_{participant-name}.{ext}`

**Given** the winners page was revoked
**When** I enter the correct password
**Then** I see: "Results are not currently available"

**Given** I access on mobile
**When** I view the winners
**Then** the layout is responsive and touch-friendly
**And** download buttons work on mobile

**Requirements:** FR56, FR57, FR58, UX6

---

### Story 6.7: Participant Feedback View

As a **Participant**,
I want **to view my feedback and rating on my submission page after the contest is finished**,
So that **I can learn and improve from judge evaluations**.

**Acceptance Criteria:**

**Given** I enter my contest code and participant code
**When** the contest status is "Finished"
**Then** I see the same contest view with all categories

**Given** I view a category where I submitted
**When** I navigate to that category
**Then** I see my submission (same page as before)
**And** below my submission, I see a new "Feedback" section

**Given** I view the feedback section
**When** I scroll down on my submission page
**Then** I see:
| Field | Value |
|-------|-------|
| Your Rating | Rating tier name (e.g., "Proficient Creator") |
| Score | Numeric score (e.g., "6 out of 10") |
| Feedback | Judge's written feedback (or "No feedback provided") |

**Given** my submission was disqualified
**When** I view my submission page
**Then** I see my submission normally
**And** I see the feedback section with my rating
**And** there is NO indication of disqualification

**Given** I was a winner (top 3)
**When** I view my feedback
**Then** I see ONLY my rating tier and feedback
**And** I do NOT see my ranking position (1st/2nd/3rd)
**And** I am NOT told I won
**And** I am NOT redirected to winners page

**Given** I was NOT a winner
**When** I view my feedback
**Then** I see the same information as winners (rating + feedback only)
**And** there is no difference in display between winners and non-winners

**Given** the contest is NOT finished
**When** I view my submission
**Then** I do NOT see any feedback section
**And** I see my submission as normal (editable if before deadline)

**Given** I never submitted to a category
**When** I view the categories list
**Then** I see that category displayed but **disabled/grayed out**
**And** I cannot click into it
**And** tooltip or label: "No submission"

**Given** admin overrode feedback
**When** I view it
**Then** I see the admin's feedback (not the original judge feedback)
**And** there is NO indicator that it was overridden

**Requirements:** FR59, FR60

---

## Epic 7: Email Notification System

**Goal:** Implement automated email notifications via Brevo for key system events.

**Value Delivered:** Automated communication keeps judges and admins informed without manual effort.

**Dependencies:** Epic 1 (Edge Functions infrastructure), Epic 3 (Judge assignment)

### Story 7.1: Email Infrastructure Setup (Brevo Integration)

As a **Developer**,
I want **to set up Brevo email integration via Supabase Edge Functions**,
So that **the system can send transactional emails reliably**.

**Acceptance Criteria:**

**Given** the project needs email capability
**When** I set up the infrastructure
**Then** I create `supabase/functions/send-notification/index.ts`

**Given** I configure the Edge Function
**When** I set up the Brevo client
**Then** I use the Brevo API v3 (not SMTP) for transactional emails
**And** API key is stored in Supabase secrets: `BREVO_API_KEY`

**Given** I create the email function
**When** I define the interface
**Then** it accepts:
```typescript
interface EmailRequest {
  to: string;           // Recipient email
  templateId: string;   // Brevo template ID
  params: Record<string, string | number>; // Template variables
  subject?: string;     // Optional override
}
```

**Given** I call the Edge Function
**When** I send a valid request
**Then** it returns:
```typescript
interface EmailResponse {
  success: boolean;
  messageId?: string;   // Brevo message ID for tracking
  error?: string;
}
```

**Given** an email fails to send
**When** the error occurs
**Then** the error is logged to Sentry
**And** a meaningful error message is returned
**And** the function does NOT throw (graceful degradation)

**Given** I want to prevent abuse
**When** I configure the Edge Function
**Then** it requires authentication (Supabase JWT)
**And** only admin/system can call it (not participants)

**Environment variables required:**
- `BREVO_API_KEY` - Brevo API key
- `FROM_EMAIL` - Sender email (e.g., noreply@contest.example.com)
- `FROM_NAME` - Sender name (e.g., "Contest Platform")

**Brevo templates to create:**
| Template ID | Purpose |
|-------------|---------|
| judge-invitation | Judge invite when category closes |
| judge-category-complete | Admin notification when judge finishes |
| tlc-results-available | T/L/C notification when contest finished |

**Requirements:** ARCH13, NFR26

---

### Story 7.2: Judge Invitation Email

As a **System**,
I want **to automatically email judges when their assigned category closes**,
So that **judges know when to start reviewing**.

**Acceptance Criteria:**

**Given** a category deadline passes (or admin manually closes)
**When** the category status changes to "Closed"
**Then** the system triggers judge invitation email

**Given** the category has an assigned judge
**When** the invitation triggers
**Then** an email is sent with:
| Field | Value |
|-------|-------|
| To | Judge email (from profiles table) |
| Subject | "Ready to Judge: {Category Name} in {Contest Name}" |
| Template | judge-invitation |

**Given** the email template
**When** it renders
**Then** it includes:
- Judge's name
- Contest name
- Category name
- Number of submissions to review
- Login link (direct to judge dashboard)
- Category deadline (when judging must be complete, if set)

**Given** the judge has never logged in
**When** they click the login link
**Then** they are directed to set password first (Story 3.2)

**Given** the judge has logged in before
**When** they click the login link
**Then** they go to login page with email prefilled

**Given** the system sends the invitation
**When** the email is queued
**Then** `categories.invited_at` is updated with timestamp
**And** the email send is logged in the database

**Given** the email fails to send
**When** the error occurs
**Then** the error is logged
**And** admin can see "Invitation Failed" status
**And** admin can manually trigger re-send

**Given** admin manually re-sends invitation
**When** they click "Resend Invite"
**Then** a new email is sent
**And** `invited_at` is updated

**Database logging:**
```sql
-- notification_logs table
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'judge_invitation', 'judge_complete', 'tlc_notification', etc.
  recipient_email TEXT NOT NULL,
  recipient_id UUID REFERENCES profiles(id),
  related_contest_id UUID REFERENCES contests(id),
  related_category_id UUID REFERENCES categories(id),
  brevo_message_id TEXT,
  status TEXT NOT NULL, -- 'sent', 'failed', 'pending'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Requirements:** FR21, FR61

---

### Story 7.3: Admin Notification - Judge Complete

As a **System**,
I want **to notify the Super Admin when a judge completes a category**,
So that **the admin knows when to review and publish results**.

**Acceptance Criteria:**

**Given** a judge marks a category as complete (Story 5.6)
**When** the completion is confirmed
**Then** the system triggers admin notification email

**Given** the notification triggers
**When** the email is composed
**Then** it is sent to the Super Admin (role = 'super_admin')
**And** if multiple super admins exist, all receive the email

**Given** the email template
**When** it renders
**Then** it includes:
| Field | Value |
|-------|-------|
| Subject | "Judging Complete: {Category} by {Judge Name}" |
| Judge name | Who completed |
| Contest name | Which contest |
| Category name | Which category |
| Submissions reviewed | Count |
| Top 3 ranked | Brief summary (codes only, no spoilers) |
| Link | Direct to admin category review page |

**Given** the admin clicks the link
**When** they navigate
**Then** they see the judge's reviews and rankings
**And** they can override if needed (Story 6.3)

**Given** all categories in a contest are judged
**When** the last judge completes
**Then** an additional summary email is sent:
- Subject: "All Judging Complete: {Contest Name}"
- Summary of all categories and judges
- Link to generate winners page

**Given** the email is sent
**When** logged
**Then** entry is created in `notification_logs`

**Requirements:** FR48, FR62

---

### Story 7.4: Contest Status Update Emails

As a **System**,
I want **to notify relevant parties when contest status changes**,
So that **stakeholders stay informed of contest lifecycle**.

**Acceptance Criteria:**

**Given** a contest status changes to "Published"
**When** the change is saved
**Then** NO automatic email is sent (admin controls distribution manually)

**Given** a contest status changes to "Closed"
**When** the change is saved
**Then** judge invitation emails are triggered for all closed categories (Story 7.2)

**Given** a contest status changes to "Finished"
**And** the T/L/C notification toggle is ON
**When** the system prepares to send T/L/C emails
**Then** it collects ALL unique T/L/C emails across all participants in the contest
**And** sends exactly ONE email per unique T/L/C email address

**Given** multiple participants have the same T/L/C email
**When** the notification is sent
**Then** that T/L/C receives only ONE email (deduplicated)
**And** the email does NOT list individual participant codes

**Given** T/L/C receives the email
**When** they read it
**Then** they see:
- Subject: "Contest Results Available: {Contest Name}"
- Generic message that results are available
- NO direct link to winners page (admin shares manually)
- Message: "Contact your participants for their individual feedback"

**Given** T/L/C notification is optional
**When** admin configures contest
**Then** there is a toggle: "Notify T/L/C when results published"
**And** default is OFF

**Given** email delivery fails
**When** error occurs
**Then** it is logged
**And** admin can see failed notifications in contest dashboard

**Requirements:** FR63, FR64

---

### Story 7.5: Email Delivery Tracking & Retry

As a **Super Admin**,
I want **to view email delivery status and retry failed emails**,
So that **I can ensure all stakeholders receive notifications**.

**Acceptance Criteria:**

**Given** I am on a contest dashboard
**When** I view the notifications section
**Then** I see a summary:
- Total emails sent
- Successful deliveries
- Failed deliveries
- Pending retries

**Given** I want to see details
**When** I click "View All Notifications"
**Then** I see a table:
| Recipient | Type | Status | Sent At | Actions |

**Given** an email has failed status
**When** I view it
**Then** I see the error message
**And** I see a "Retry" button

**Given** I click "Retry"
**When** the retry processes
**Then** a new send attempt is made
**And** the status updates to "sent" or remains "failed"
**And** retry count is incremented

**Given** an email fails 3 times
**When** the third failure occurs
**Then** it is marked "permanently_failed"
**And** no automatic retries occur
**And** admin must manually intervene

**Given** I view email logs
**When** I filter by type
**Then** I can filter by:
- Judge invitations
- Completion notifications
- T/L/C notifications

**Given** I want to export logs
**When** I click "Export"
**Then** I download a CSV of notification history

**Requirements:** NFR26

---

## Final Validation Checklist

### FR Coverage Summary

| Epic | Stories | FRs Covered |
|------|---------|-------------|
| 1 | 5 | Foundation (ARCH1-25) |
| 2 | 7 | FR1-14 |
| 3 | 5 | FR20-24 |
| 4 | 7 | FR25-37 |
| 5 | 6 | FR38-48 |
| 6 | 7 | FR49-60 |
| 7 | 5 | FR61-64 |

**Total Stories:** 42

### NFR Coverage

- NFR1-7 (Performance): Story 1.1 (infrastructure), Story 4.4-4.5 (upload optimization)
- NFR8-15 (Security): Story 1.1 (RLS), Story 2.1 (auth), Story 3.2 (password)
- NFR16-22 (Reliability): Story 1.1 (error handling), Story 7.5 (retry logic)
- NFR23-28 (Scalability): Story 1.1 (Supabase), Story 4.4-4.5 (Bunny CDN)
- NFR29-34 (Usability): Embedded in all UI stories via UX requirements
- NFR35 (Security Checklist): Pre-release validation (separate workflow)

### UX Coverage

All UX1-25 requirements are embedded within relevant stories as acceptance criteria for UI components and interactions.

### ARCH Coverage

All ARCH1-25 decisions are implemented across Epic 1 foundation and subsequent stories following the established patterns.
