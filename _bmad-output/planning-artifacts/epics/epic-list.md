# Epic List

## Epic 1: Project Foundation & Core Infrastructure
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

## Epic 2: Super Admin Authentication & Contest Management
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

## Epic 3: Judge Onboarding & Assignment
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

## Epic 4: Participant Submission Experience
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

## Epic 5: Judging & Evaluation Workflow
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

## Epic 6: Admin Oversight & Results Publication
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

## Epic 7: Email Notification System
All stakeholders receive timely email notifications for key events.

**FRs covered:** FR61-64 (4 FRs)
**NFRs addressed:** NFR26

**Notifications:**
- Judge invite when assigned and category closes
- Admin notification when judge completes category
- T/L/C notification when results available
- All emails include relevant links and instructions

---
