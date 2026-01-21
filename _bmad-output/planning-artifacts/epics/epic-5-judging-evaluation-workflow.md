# Epic 5: Judging & Evaluation Workflow

**Goal:** Judges can anonymously review all submissions, provide ratings and feedback, and rank their top 3.

**FRs covered:** FR38-48 (11 FRs)
**NFRs:** NFR3, NFR10
**UX Components:** UX14 (RatingScale), UX15 (MediaViewer), UX16 (SubmissionCard), UX18 (RankingDropzone)

---

## Story 5.1: Judge Review Dashboard

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

## Story 5.2: Anonymous Submission View

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

## Story 5.3: Media Playback (Photo & Video)

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

## Story 5.4: Rating & Feedback Form

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

## Story 5.5: Top 3 Ranking (Drag & Drop)

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

## Story 5.6: Mark Category Complete & Notify Admin

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
