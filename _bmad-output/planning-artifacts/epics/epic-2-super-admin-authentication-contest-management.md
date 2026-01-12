# Epic 2: Super Admin Authentication & Contest Management

**Goal:** Super Admin can log in, create/manage contests, define categories, and generate participant codes.

**FRs covered:** FR1, FR4, FR6-19 (15 FRs)
**NFRs:** NFR7-9, NFR14
**UX Components:** UX17 (ContestCard), UX19 (CodeListTable)

---

## Story 2.1: Super Admin Login
Status: in-progress

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
**Then** I am redirected to the Judge dashboard (/judge/dashboard)

~~**Given** I am logged in as a Participant (code-based session)~~
~~**When** I try to access /admin/* routes~~
~~**Then** I am redirected to the login page~~
**(Deferred to Epic 4 - requires ParticipantSessionContext)**

**Requirements:** FR1, FR4, NFR7-9

---

### Review Follow-ups (AI)

- [ ] [AI-Review][High] Add comprehensive unit/integration tests for `AuthProvider.tsx` to cover authentication state management, Supabase integration, and the `useAuth` hook.
- [ ] [AI-Review][High] Add comprehensive unit/integration tests for `AdminRoute.tsx` to cover routing protection logic and redirects for different user roles.
- [ ] [AI-Review][Medium] Update `epic-2-super-admin-authentication-contest-management.md` to include "Tasks/Subtasks", "Dev Agent Record", "File List", and "Change Log" sections, and ensure all changes are documented.

---

## Story 2.2: Admin Layout & Dashboard Shell

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

## Story 2.3: Create Contest

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

## Story 2.4: Contest List & Status Management

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

## Story 2.5: Category Management

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

## Story 2.6: Participant Code Management

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

## Story 2.7: Admin Dashboard with Stats

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
