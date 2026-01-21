# Epic 3: Judge Onboarding & Assignment

**Goal:** Super Admin can invite judges to categories, and judges can set their password and access the system.

**FRs covered:** FR2, FR3, FR4, FR20-24 (7 FRs)
**NFRs:** NFR7-9

---

## Story 3.1: Assign Judge to Category

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

## Story 3.2: Judge Invitation Email

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

## Story 3.3: Judge Password Setup

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

## Story 3.4: Judge Login & Dashboard

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

## Story 3.5: Admin View Judge Progress

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
