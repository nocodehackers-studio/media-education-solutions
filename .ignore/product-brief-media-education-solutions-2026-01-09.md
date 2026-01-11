---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - _bmad-output/planning-artifacts/project-brief.md
date: 2026-01-09
author: NocodeHackers
projectName: media-education-solutions
---

# Product Brief: Media Education Solutions

## Executive Summary

Media Education Solutions is a custom contest management platform built for Media Education Solutions (Jeb) to efficiently manage photo and video contests at scale. The platform replaces time-consuming manual processes with a centralized, automated system - enabling Jeb to grow from managing 2-3 contests to dozens without proportional increases in admin overhead.

Built on a modern, scalable stack (React, Supabase, Bunny Stream/Storage), the platform handles large participant volumes and substantial media files while remaining fully customizable for future feature requests.

---

## Core Vision

### Problem Statement

Media Education Solutions runs photo and video contests for schools, organizations, and events. Currently, managing just 2-3 concurrent contests requires significant manual coordination - creating admin bottlenecks that limit business growth. As participant volumes grow and client demand increases, the manual approach doesn't scale.

### Problem Impact

- **Growth ceiling:** Can't take on more contest clients without drowning in admin work
- **Time drain:** Manual coordination across judges, participants, and media files consumes hours that could go toward business development
- **Scaling wall:** Large participant volumes per contest compound the coordination challenge

### Why Existing Solutions Fall Short

Off-the-shelf contest platforms (Submittable, Judgify, etc.) offer rigid workflows and limited customization. Jeb needs full control to:
- Add features on request as his business evolves
- Modify existing functionality to match specific client needs
- Own the platform entirely rather than depending on third-party roadmaps

### Proposed Solution

A custom-built contest management platform featuring:
- **Single Super Admin** managing multiple contests across various clients and events
- **Clear role separation** (Admin / Judges / Participants) with appropriate access controls
- **Automated workflows** from contest creation through winner publication
- **Anonymous judging** to ensure fair evaluation
- **Scalable media handling** for large video (500MB) and photo uploads at volume
- **Extensible architecture** enabling future feature additions without major rewrites

### Key Differentiators

| Differentiator | Why It Matters |
|----------------|----------------|
| Purpose-built for Jeb's workflow | Not forcing a business into a generic tool's assumptions |
| Full ownership & control | Features added on request, no vendor lock-in |
| Modern scalable stack | Handles growing participant volumes and media files |
| Clean extensible codebase | Future modifications are straightforward, not hacky |

---

## Target Users

### Primary Users

#### Super Admin (Jeb)

**Profile:** Business owner running Media Education Solutions. Manages all contests for various clients and events. Needs to scale from 2-3 contests to dozens without proportional time investment.

**Technical Level:** Comfortable with technology. Wants data visibility through dashboards while maintaining operational simplicity.

**Goals:**
- Efficiently manage multiple concurrent contests
- Monitor submission volumes and judge progress at a glance
- Maintain control over results with override capabilities
- Minimize repetitive manual tasks

**Pain Points:**
- Current manual processes don't scale
- Coordinating judges and tracking progress is time-consuming
- No centralized view of contest status across clients

---

#### Judges

**Profile:** Domain experts (photographers, videographers, industry professionals) invited to evaluate submissions. NOT tech-savvy. May judge multiple contests and multiple categories within each contest.

**Technical Level:** Low. Interface must be extremely simple with pristine UX. Assume minimal patience for learning new tools.

**Goals:**
- Quickly understand what they need to review
- View submissions clearly (video streaming, photo display)
- Provide ratings and feedback efficiently
- Know when they're done

**Key Needs:**
- Dashboard showing all assigned contests with progress status (Pending / In Progress / Complete)
- Within each contest, see assigned categories with same status visibility
- Anonymous submissions (identified by code only) to ensure fair evaluation
- Simple rating scale and feedback entry

---

#### Participants

**Profile:** Primarily teenagers (K-12 students) submitting creative work. Some contests may include adults from companies/teams. Submit independently but must have a Teacher/Leader/Coach associated.

**Technical Level:** Generally comfortable with technology (digital natives). Expect modern, intuitive interfaces.

**Goals:**
- Submit their best work before the deadline
- Edit or replace submissions if needed
- View feedback after contest completion

**Key Needs:**
- Simple login via contest code + participant code
- Clear visibility of which categories are open/closed
- Upload large files (video up to 500MB, photos up to 10MB) reliably
- Auto-fill personal info for subsequent category submissions within same contest
- Access to judge feedback after contest finishes

---

### Secondary Users

#### Teachers / Leaders / Coaches (T/L/C)

**Profile:** Mentors associated with participants. Do NOT log into the platform. Serve as the communication bridge since participant emails are not stored.

**Interaction:**
- Receive participant codes from Jeb/organizers to distribute to their students
- Receive email notification when contest is finished with results and feedback available
- Relay this information to their participants

---

### User Journey Summary

| User | Entry Point | Core Flow | Exit Point |
|------|-------------|-----------|------------|
| Super Admin | Email/password login | Create contests → Monitor → Finalize → Publish | Winners page generated |
| Judge | Email invite → Login | View assignments → Rate submissions → Rank top 3 → Mark complete | Category/contest complete |
| Participant | Contest code + Participant code | View categories → Submit work → Edit if needed | Submission confirmed |
| Participant (post-contest) | Same codes | Log in → View feedback | Feedback reviewed |

---

## Success Metrics

### User Success Metrics

#### Super Admin (Jeb)
| Metric | Success Indicator |
|--------|-------------------|
| Contest capacity | Manages 5+ concurrent contests without increased admin time per contest |
| Coordination elimination | Zero manual video distribution to judges |
| Communication reduction | No "did you receive it?" follow-ups needed - platform handles notifications |
| Single control point | All contest management happens in one place |

#### Judges
| Metric | Success Indicator |
|--------|-------------------|
| Self-service completion | Judges complete reviews without support requests |
| Progress clarity | Judges always know what's pending vs. complete |
| UX friction | No complaints about interface complexity |

#### Participants
| Metric | Success Indicator |
|--------|-------------------|
| Upload success rate | 99%+ of submissions complete successfully |
| Deadline confidence | No failed uploads due to system bottlenecks at crunch time |
| Feedback access | Participants can view their feedback post-contest |

---

### Business Objectives

| Objective | Target |
|-----------|--------|
| Scale enablement | Platform supports 5+ concurrent contests |
| Participant volume | Handle 200-500 participants per contest |
| Client satisfaction | Jeb can take on more clients without proportional time investment |
| Platform reliability | Zero critical failures during contest lifecycle |

---

### Key Performance Indicators

#### Technical KPIs (Critical)

| KPI | Target | Why It Matters |
|-----|--------|----------------|
| Concurrent upload capacity | 100+ simultaneous uploads | Deadline crunch scenario: 30% of participants upload in final 10 minutes |
| Upload success rate | 99.5%+ | Failed uploads at deadline = angry participants, no recourse |
| Video streaming reliability | Zero buffering on playback | Judges need smooth playback for fair evaluation |
| System uptime | 99.9% during contest periods | Downtime during submission windows is catastrophic |

#### Operational KPIs

| KPI | Target |
|-----|--------|
| Admin time per contest | Decreases vs. manual process (qualitative) |
| Judge completion rate | 100% of assigned categories reviewed before deadline |
| Support tickets | Minimal - platform is self-explanatory |

---

### Project Success Criteria (NocodeHackers)

| Criteria | Definition |
|----------|------------|
| Client satisfaction | Jeb is happy with the delivered platform |
| Technical quality | No bugs, no data leaks, no security issues |
| Performance under load | Platform handles deadline crunch without failures |
| Maintainability | Clean codebase ready for future feature additions |

---

## MVP Scope

### Core Features

#### Super Admin
- **Authentication:** Email + password login
- **Contest Management:**
  - Create/edit contests (name, topic, public contest code, rules)
  - Define categories (name, type: video/photo, rules, start/end dates)
  - Assign one judge per category (by email)
  - Manage contest lifecycle (Draft → Published → Closed → Reviewed → Finished)
- **Participant Codes:** Generate 8-digit unique codes per contest
- **Dashboard:**
  - Contest/category overview
  - Submission counts per category
  - Judge progress indicators (e.g., "8/20 reviewed")
- **Review & Override:**
  - View all submissions with full participant data
  - Review judge ratings and feedback
  - Override feedback, rankings, or disqualify submissions
- **Winners:**
  - Mark contest as Finished
  - Generate password-protected Winners Page URL
  - Trigger T/L/C email notifications

#### Judges
- **Authentication:** Email + password login
- **Dashboard:**
  - View all assigned contests with progress status (Pending / In Progress / Complete)
  - Within each contest, view assigned categories with same status indicators
- **Submission Review:**
  - Anonymous submissions (identified by participant code only)
  - Video streaming via Bunny Stream
  - Photo display from Bunny Storage
- **Evaluation:**
  - Fixed 5-tier rating scale (Developing Skills 1-2 → Master Creator 9-10)
  - Written feedback per submission
  - Progress tracking ("8 of 20 reviewed")
- **Ranking:**
  - Drag-and-drop top 3 ordering
  - Mark category as review complete (locks rankings, notifies admin)

#### Participants
- **Access:** Contest code + participant code login (no account creation)
- **Contest View:** See all categories with open/closed status
- **Submission:**
  - Enter personal info (name, institution, T/L/C name, T/L/C email)
  - Auto-fill for subsequent category submissions in same contest
  - Upload video (up to 500MB) or photo (up to 10MB) per category type
- **Edit/Withdraw:** Replace file or withdraw from category before deadline
- **Feedback:** View judge ratings and feedback after contest is Finished

#### System / Integrations
- **Media:** Bunny Stream (video), Bunny Storage (photos) - direct uploads
- **Email:** Brevo templates for judge invites and T/L/C notifications
- **Winners Page:** Password-protected, displays top 3 per category with embedded media and downloads

---

### Out of Scope for MVP

| Feature | Rationale |
|---------|-----------|
| PDF generation | Can be added post-MVP; not critical for core workflow |
| Multi-language support | Single-language sufficient for initial clients |
| Multiple judges per category | One judge per category simplifies MVP |
| Public voting / audience scoring | Not part of current judging model |
| Contest duplication / templating | Manual creation acceptable for MVP scale |
| CSV / advanced data exports | Dashboard provides sufficient visibility |
| Advanced analytics dashboards | Basic metrics sufficient for MVP |
| AI plagiarism / content analysis | Manual review acceptable |
| Payment processing | Out of scope for contest model |
| Native mobile apps | Responsive web is sufficient |
| Multi-organization / multi-tenant | Single Super Admin manages all |
| Customizable rating scales | Fixed 5-tier scale for MVP |

---

### MVP Success Criteria

| Criteria | Validation |
|----------|------------|
| Core workflow complete | A contest can go from Draft → Finished without manual intervention outside the platform |
| Scale target met | Platform handles 5+ concurrent contests with 200-500 participants each |
| Deadline crunch survived | 100+ simultaneous uploads complete without failures |
| Judge adoption | Judges complete reviews without support escalations |
| Client satisfaction | Jeb confirms platform replaces his manual processes |

---

### Future Vision

**Post-MVP Enhancements (v1.x):**
- PDF generation for contest materials
- Contest duplication / templating
- CSV exports for reporting
- Enhanced analytics dashboard

**Future Roadmap (v2.0+):**
- Multi-organization support (Jeb licenses to other contest operators)
- Multiple judges per category with consensus workflows
- Customizable rating scales per contest
- Public voting integration
- Multi-language support
- API for third-party integrations
