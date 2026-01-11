# MVP Scope

## Core Features

### Super Admin
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

### Judges
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

### Participants
- **Access:** Contest code + participant code login (no account creation)
- **Contest View:** See all categories with open/closed status
- **Submission:**
  - Enter personal info (name, institution, T/L/C name, T/L/C email)
  - Auto-fill for subsequent category submissions in same contest
  - Upload video (up to 500MB) or photo (up to 10MB) per category type
- **Edit/Withdraw:** Replace file or withdraw from category before deadline
- **Feedback:** View judge ratings and feedback after contest is Finished

### System / Integrations
- **Media:** Bunny Stream (video), Bunny Storage (photos) - direct uploads
- **Email:** Brevo templates for judge invites and T/L/C notifications
- **Winners Page:** Password-protected, displays top 3 per category with embedded media and downloads

---

## Out of Scope for MVP

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

## MVP Success Criteria

| Criteria | Validation |
|----------|------------|
| Core workflow complete | A contest can go from Draft → Finished without manual intervention outside the platform |
| Scale target met | Platform handles 5+ concurrent contests with 200-500 participants each |
| Deadline crunch survived | 100+ simultaneous uploads complete without failures |
| Judge adoption | Judges complete reviews without support escalations |
| Client satisfaction | Jeb confirms platform replaces his manual processes |

---

## Future Vision

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
