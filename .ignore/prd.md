---
stepsCompleted: [1, 2, 3, 4, 7, 8, 9, 10, 11]
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-media-education-solutions-2026-01-09.md
  - _bmad-output/planning-artifacts/project-brief.md
workflowType: 'prd'
lastStep: 11
documentCounts:
  briefs: 2
  research: 0
  projectDocs: 0
skippedSteps: [5, 6]
---

# Product Requirements Document - Media Education Solutions

**Author:** NocodeHackers
**Date:** 2026-01-09

## Executive Summary

Media Education Solutions is a multi-purpose contest management platform built for Media Education Solutions (Jeb) to efficiently create, manage, and evaluate photo and video contests at scale. The platform replaces time-consuming manual processes with a centralized, automated system — enabling Jeb to grow from managing 2-3 contests to dozens without proportional increases in admin overhead.

The platform serves diverse audiences including teenagers, high schoolers, companies, and corporate teams — anyone running creative media competitions. Built on a modern, scalable stack (React, Supabase, Bunny Stream/Storage), the platform handles large participant volumes and substantial media files while remaining fully customizable for future feature requests.

### What Makes This Special

| Differentiator | Why It Matters |
|----------------|----------------|
| Purpose-built for Jeb's workflow | Not forcing a business into a generic tool's assumptions |
| Full ownership & control | Features added on request, no vendor lock-in |
| Anonymous judging | Fair evaluation without bias |
| Scalable media handling | 500MB videos, 100+ simultaneous uploads at deadline crunch |
| Extensible architecture | Future modifications are straightforward, not hacky |

## Project Classification

**Technical Type:** Web App (SPA/PWA)
**Domain:** General / Media & Events
**Complexity:** Low-Medium
**Project Context:** Greenfield - new project

This is a multi-purpose contest platform with no regulatory compliance requirements for the MVP. The primary technical complexity lies in handling large media uploads at scale and ensuring reliability during deadline crunch periods when submission volume spikes.

## Success Criteria

### User Success

| User | Success Indicators |
|------|-------------------|
| **Super Admin (Jeb)** | Manages multiple concurrent contests without proportional admin time increase; Zero manual video distribution to judges; No "did you receive it?" follow-ups — platform handles all notifications |
| **Judges** | Complete reviews without support requests (no emails/calls to Jeb asking "how do I...?"); Interface is self-explanatory; Always know what's pending vs. complete |
| **Participants** | Uploads succeed reliably, even during deadline crunch; Can edit/replace submissions before deadline; Can view feedback after contest finishes |

### Business Success

This is a **validation MVP** — success is measured by Jeb's verdict, not analytics dashboards.

| Metric | Target |
|--------|--------|
| Platform adoption | Jeb confirms "this replaced my manual process" |
| User self-service | Zero support emails/calls for basic platform usage |
| Technical reliability | Contests complete end-to-end without manual intervention outside the platform |

### Technical Success

| Metric | Target |
|--------|--------|
| Concurrent uploads | 100+ simultaneous uploads during deadline crunch |
| Upload success rate | 99.5%+ |
| Video streaming | Zero buffering on playback for judges |
| System uptime | 99.9% during contest periods |

### Measurable Outcomes

MVP validation is qualitative, not quantitative:
- Jeb uses the platform for real contests
- Jeb provides feedback on what works and what needs improvement
- No analytics or data tracking in MVP — validation comes from usage and direct feedback

## Product Scope

### MVP - Minimum Viable Product

**Included:**
- Full contest lifecycle (Draft → Published → Closed → Reviewed → Finished)
- Three user roles: Super Admin, Judges, Participants
- Contest creation with categories (video or photo)
- Participant code generation (8-digit unique codes per contest)
- Video uploads (up to 500MB) via Bunny Stream
- Photo uploads (up to 10MB) via Bunny Storage
- Anonymous judging (submissions identified by code only)
- 5-tier rating scale with written feedback
- Drag-and-drop top 3 ranking per category
- Winners page with password protection
- Email notifications via Brevo (judge invites, T/L/C notifications)

### Growth Features (Post-MVP)

- PDF generation for contest materials
- Contest duplication / templating
- CSV exports for reporting
- Enhanced analytics dashboard

### Vision (Future)

- Multi-organization support (licensing to other contest operators)
- Multiple judges per category with consensus workflows
- Customizable rating scales per contest
- Public voting integration
- Multi-language support
- API for third-party integrations

## User Journeys

### Journey 1: Jeb - From Chaos to Control

Jeb runs Media Education Solutions and just landed three new contest clients in the same month. In the old days, this would mean spreadsheets, email chains, and manually sending video files to judges. He'd be up late coordinating everything, and inevitably someone would ask "did you get my submission?" or a judge would email "where do I find the videos?"

This time, Jeb logs into the platform and creates all three contests in under an hour. He defines categories, sets deadlines, and assigns judges by email. The moment he saves each contest, 50 participant codes are automatically generated. He checks the code list — 50 fresh codes, all marked "Unused."

For the big surfing contest expecting 200 participants, he clicks "Generate More Codes" three times. Now he has 200 codes ready. He exports the list and sends it to the event organizer: "Distribute one per participant."

Over the next few weeks, Jeb checks his dashboard between meetings. He glances at the code list — 147 of 200 now show "Used." Submission counts are climbing, judge progress bars are filling up ("12/20 reviewed"), and he hasn't answered a single "how do I...?" email. When the deadline crunch hits and 50 participants upload in the final 10 minutes, he watches the numbers tick up without a single failure.

The breakthrough moment: all three contests finish the same week. Jeb generates winner pages, the system emails the Teachers/Coaches, and he's done. What used to consume his evenings now takes a glance at a dashboard.

### Journey 2: Marcus - The Reluctant Judge

Marcus is a professional photographer who's been roped into judging a youth photo contest by a friend. He's skeptical — the last time he judged something online, it was a nightmare of downloading files and filling out spreadsheets. He almost said no.

Then he gets the judge invite email. One click, and he's looking at a clean dashboard: "2 categories assigned. 0 of 35 submissions reviewed." No downloads. No spreadsheets. He clicks into the first category and sees thumbnails of photos, each labeled with just a participant code — no names, no schools, no bias.

He clicks a photo. It fills his screen beautifully. Below it: a simple rating scale (Developing Skills → Master Creator) and a text box for feedback. He rates it, writes two sentences, hits "Next." The progress bar updates: "1 of 18 reviewed."

Marcus finds his rhythm. Coffee in hand, he works through submissions in 45-minute sessions over three days. When he's done, he drags his top 3 into order and clicks "Mark Complete." A confirmation appears. He closes his laptop and thinks: "That was... actually fine."

### Journey 3: Sofia - Racing the Deadline

Sofia is 16 and has spent three weeks editing a surf video for a competition. Her coach gave her a participant code and told her the deadline is Friday at midnight. It's Friday at 11:42 PM.

She goes to the contest site, enters the contest code and her participant code, and immediately sees the categories. "Video - Open Division" shows a green "Open" badge. She clicks it.

The form asks for her name, school, and coach's info. She fills it in quickly. Then the upload button. Her video is 380MB. She holds her breath and drags the file. A progress bar appears — 23%... 47%... 78%... 100%. "Upload complete. Processing video."

A confirmation screen appears with a thumbnail of her video. She can preview it. It works. The submit button is right there. She clicks it.

11:51 PM. Done. She screenshots the confirmation and texts her coach: "Made it."

### Journey 4: Sofia Returns - The Feedback

Three weeks later, Sofia's coach forwards her an email: "Contest results and feedback are now available." She logs in with the same codes she used before.

The interface looks different now. Her submission shows a badge: "Reviewed." She clicks it and sees:

- **Rating:** Proficient Creator (5-6)
- **Feedback:** "Strong storytelling and good use of slow motion in the barrel sequence. Audio mixing could be tighter — the music overpowers the wave sounds in the middle section. Keep shooting."

She reads it twice. It stings a little — she worked hard on that audio — but it's specific. She knows exactly what to improve for next time. She screenshots the feedback and sends it to her coach.

### Journey 5: Coach Rivera - The Communication Bridge

Coach Rivera runs the surf program at a local high school. Jeb emails him 25 participant codes and instructions: "Distribute one code per student. Deadline is Friday."

Coach Rivera doesn't log into anything. He prints the codes, hands them out, and reminds students about the deadline during practice. He forgets about it.

Three weeks later, an email lands: "Contest results are ready. Please inform your participants they can log in to view feedback."

He forwards the email to his students' group chat: "Results are in. Log in with your code to see feedback." His job is done.

### Journey Requirements Summary

| Journey | Capabilities Revealed |
|---------|----------------------|
| **Jeb - Super Admin** | Contest CRUD, category management, judge assignment, auto-generated participant codes (50 per contest), batch code generation, code list with Used/Unused status, dashboard with submission counts and judge progress, contest lifecycle control, winner page generation |
| **Marcus - Judge** | Judge authentication, assigned contests/categories dashboard, anonymous submission view (code only), media display (photos full-screen), rating scale input, feedback text entry, progress tracking, top 3 drag-and-drop ranking, mark category complete |
| **Sofia - Participant Submit** | Participant login (contest code + participant code), category list with open/closed status, submission form (personal info + T/L/C info), large file upload with progress indicator, upload confirmation with preview |
| **Sofia - Participant Feedback** | Post-contest login, submission status display, rating and feedback view |
| **Coach Rivera - T/L/C** | Email notification when contest finishes (no platform login required) |

## Web Application Requirements

### Architecture

**Type:** Single-Page Application (SPA)
**Framework:** React + Vite
**Deployment:** Vercel

The platform is built as a modern SPA, providing a smooth, app-like experience without full page reloads. This is ideal for:
- Judges reviewing multiple submissions in sequence
- Participants uploading large files with progress feedback
- Admin navigating between contests and dashboards efficiently

### Browser Support

**Target:** Modern browsers only

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | Latest 2 versions |
| Firefox | Latest 2 versions |
| Safari | Latest 2 versions |
| Edge | Latest 2 versions |

No support required for Internet Explorer or legacy browsers.

### SEO & Discoverability

**SEO:** Not required

The platform is entirely authenticated — users access via contest codes or login credentials. No public-facing pages need search engine indexing. This simplifies architecture (no SSR/SSG needed).

### Real-Time Features

**Real-time updates:** Not required for MVP

Users will refresh manually to see updated data. This simplifies architecture by avoiding WebSocket/SSE infrastructure. Future versions may add real-time features if needed.

### Accessibility

**Target:** Basic accessibility compliance

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | All interactive elements keyboard-accessible |
| Form labels | All inputs properly labeled |
| Color contrast | Sufficient contrast for readability |
| Focus indicators | Visible focus states on interactive elements |

No formal WCAG certification required for MVP.

### Performance Targets

| Metric | Target |
|--------|--------|
| Initial load | < 3 seconds on broadband |
| Navigation | < 500ms between views |
| Upload feedback | Progress indicator updates during upload |
| Video playback | Stream starts within 2 seconds |

### Responsive Design

**Target:** Desktop-first, mobile-friendly

| Device | Priority |
|--------|----------|
| Desktop | Primary (admin and judge workflows) |
| Tablet | Supported (participant submissions) |
| Mobile | Functional (participant submissions, feedback viewing) |

Judges and admin will primarily use desktop. Participants may submit from mobile devices.

## Scoping & Development Strategy

### MVP Philosophy

**Approach:** Problem-Solving MVP

This is a validation MVP focused on proving the platform replaces Jeb's manual process. Success is measured by Jeb's verdict, not metrics dashboards.

**Core Principle:** Ship the smallest thing that solves the problem, then iterate based on real usage feedback.

### MVP Boundaries

**In Scope (Phase 1):**
- Full contest lifecycle (Draft → Published → Closed → Reviewed → Finished)
- Three user roles: Super Admin, Judges, Participants
- Contest creation with categories (video or photo)
- Auto-generated participant codes (50 per contest) with batch generation
- Code list with Used/Unused status tracking
- Video uploads (up to 500MB) via Bunny Stream
- Photo uploads (up to 10MB) via Bunny Storage
- Anonymous judging (submissions identified by code only)
- 5-tier rating scale with written feedback
- Drag-and-drop top 3 ranking per category
- Winners page with password protection
- Email notifications via Brevo (judge invites, T/L/C notifications)
- Dashboard with submission counts and judge progress

**Explicitly Out of Scope (Post-MVP):**
- PDF generation for contest materials
- Multi-language support
- Multiple judges per category
- Public voting / audience scoring
- Contest duplication / templating
- CSV or advanced data exports
- Analytics dashboards
- AI plagiarism / content analysis
- Payment processing
- Native mobile apps

### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Deadline crunch uploads (100+ simultaneous) | High | High | Bunny infrastructure handles load; implement chunked uploads with progress feedback |
| Judge UX confusion | Medium | Medium | Pristine, self-explanatory interface; progress indicators throughout |
| Large file upload failures | Medium | High | Resumable uploads; clear error messaging; retry capability |
| Video transcoding delays | Low | Medium | Bunny Stream handles transcoding; set user expectations on processing time |

### Development Priorities

**Critical Path (Must work for launch):**
1. Contest CRUD and lifecycle management
2. Participant code generation and tracking
3. File upload pipeline (Bunny integration)
4. Judge review workflow
5. Winners page generation

**Important but not blocking:**
- Email notifications (can be added incrementally)
- Dashboard metrics (manual checking acceptable initially)

## Functional Requirements

### Authentication & Access

- FR1: Super Admin can log in via email and password
- FR2: Judge can log in via email and password
- FR3: New judges must set their password when first accessing the platform via invite link
- FR4: Super Admin and Judges can recover their password via email reset flow
- FR5: Participant can access a contest using contest code and participant code (no password required)

### Contest Management

- FR6: Super Admin can create a new contest with name, description, cover image, unique contest code, and general contest rules
- FR7: Super Admin can define categories within a contest with type (video or photo), deadline, rules, and description
- FR8: Super Admin can set contest status (Draft, Published, Closed, Reviewed, Finished)
- FR9: Super Admin can view a list of all contests with status indicators
- FR10: Super Admin can edit contest details while in any status
- FR11: Super Admin can delete a contest while in any status
- FR12: Super Admin can edit contest categories only while contest is in Draft status
- FR13: Super Admin can view a dashboard showing submission counts and judge progress per contest
- FR14: Categories have independent status (Draft, Published, Closed) separate from contest status

### Participant Code Management

- FR15: System automatically generates 50 participant codes when a contest is created
- FR16: Super Admin can generate additional participant codes in batches of 50
- FR17: Super Admin can view all participant codes for a contest with Used/Unused status
- FR18: Super Admin can export participant codes as a list for distribution
- FR19: Each participant code is an 8-digit unique identifier scoped to its contest

### Judge Management

- FR20: Super Admin can assign judges to specific categories within a contest by email address
- FR21: System sends email invitation to judges when their assigned category is closed (deadline reached)
- FR22: Super Admin can view judge progress (submissions reviewed vs. total) per category
- FR23: Super Admin can remove a judge from a category; existing reviews by that judge are not transferred to replacement judges
- FR24: Judge can view all assigned contests and categories after logging in

### Participant Submissions

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

### Judging & Evaluation

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

### Admin Review & Override

- FR49: Super Admin can view all submissions with full participant data (name, institution, T/L/C info)
- FR50: Super Admin can view judge ratings and written feedback for any submission
- FR51: Super Admin can override judge written feedback
- FR52: Super Admin can override category rankings (Top 3 order)
- FR53: Super Admin can disqualify individual submissions

### Results & Winners

- FR54: Super Admin can generate a winners page for a contest
- FR55: Super Admin can set a password for the winners page
- FR56: Winners page is publicly accessible but displays no data until correct password is entered
- FR57: Winners page displays top 3 ranked submissions per category after password authentication
- FR58: Winners page media (videos and photos) is downloadable in best quality
- FR59: Participant can view their feedback and rating after contest is marked Finished
- FR60: Participant can access feedback using the same codes they used for submission

### Notifications

- FR61: System sends email to judges when they are assigned and their category is closed
- FR62: System sends email to Super Admin when a judge completes a category
- FR63: System sends email to Teachers/Leaders/Coaches when contest results are available
- FR64: Email notifications include relevant links and instructions

## Non-Functional Requirements

### Performance

| Requirement | Target | Context |
|-------------|--------|---------|
| Page load time | < 3 seconds | Initial application load on broadband |
| Navigation response | < 500ms | Between views within the SPA |
| Video playback start | < 2 seconds | Judge streaming submissions |
| Upload throughput | 100+ simultaneous | Deadline crunch scenario |
| Upload success rate | 99.5%+ | Critical for participant trust |
| Progress indicator | Real-time updates | During file upload |

### Security

| Requirement | Implementation |
|-------------|----------------|
| Authentication | Email + password for Super Admin and Judges |
| Password storage | Hashed, never stored in plaintext |
| Session management | Secure session tokens with expiration |
| Anonymous judging | Judge interface shows participant codes only, no PII |
| Winners page | Data loads only after correct password entered (not on page load) |
| Data access | Participants can only view their own submissions and feedback |
| File access | Media files accessible only to authorized users |

### Scalability

| Scenario | Requirement |
|----------|-------------|
| Concurrent contests | Support 5+ active contests simultaneously |
| Participants per contest | Support 200-500 participants |
| Deadline crunch | Handle 30% of submissions in final 10 minutes |
| Media storage | Scale with contest volume via Bunny infrastructure |
| Database | Supabase scales with usage |

### Reliability

| Requirement | Target |
|-------------|--------|
| System uptime | 99.9% during active contest periods |
| Upload resilience | Resumable uploads; retry on failure |
| Data integrity | No lost submissions or reviews |
| Error handling | Clear error messages; graceful degradation |
| Backup | Database backups via Supabase |

### Integration Dependencies

| Service | Purpose | Failure Impact |
|---------|---------|----------------|
| **Supabase** | Auth, database, backend | Critical - platform non-functional |
| **Bunny Stream** | Video storage & streaming | High - video submissions/judging blocked |
| **Bunny Storage** | Photo storage | High - photo submissions/judging blocked |
| **Brevo** | Email notifications | Medium - notifications delayed, core function works |
| **Vercel** | Hosting & deployment | Critical - platform inaccessible |

### Accessibility

Basic accessibility compliance (as defined in Web Application Requirements):
- Keyboard navigation for all interactive elements
- Proper form labels
- Sufficient color contrast
- Visible focus indicators

No formal WCAG certification required for MVP.

