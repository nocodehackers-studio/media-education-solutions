# Epic 6: Admin Oversight & Results Publication

**Goal:** Enable Super Admin to review judge work, override when necessary, and publish contest results.

**Value Delivered:** Complete control over final results with transparency into judge decisions.

**Dependencies:** Epic 2 (Admin Auth), Epic 5 (Judging complete)

## Story 6.1: Admin View All Submissions

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

## Story 6.2: View Judge Ratings & Feedback

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

## Story 6.3: Override Feedback & Rankings

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

## Story 6.4: Disqualify Submissions

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

## Story 6.5: Generate Winners Page

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

## Story 6.6: Winners Page Display & Download

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

## Story 6.7: Participant Feedback View

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
