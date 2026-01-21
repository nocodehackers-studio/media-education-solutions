# Epic 4: Participant Submission Experience

**Goal:** Participants can enter contests with their codes, upload media, and manage their submissions.

**FRs covered:** FR5, FR25-37 (14 FRs)
**NFRs:** NFR4-6, NFR10, NFR12-13, NFR15-16, NFR18-21, NFR24-25
**UX Components:** UX13 (UploadProgress)
**UX Safeguards:** UX9 (session warning), UX12 (deadline countdown)

---

## Story 4.1: Participant Code Entry & Session

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
**Then** `participants` table already exists (created in Story 2.3) with: id, contest_id, code (8-digit), status (unused/used), name, organization_name, tlc_name, tlc_email, created_at
**And** the Supabase Edge Function `validate-participant` exists
**Note:** The `participants` table serves dual purpose: codes (unused) and participant records (used). When a participant enters their code, the row is updated from 'unused' to 'used' and populated with their info.

**Given** I have an active participant session (code-based)
**When** I try to access /admin/* routes
**Then** I am redirected to the login page
**(Deferred from Epic 2 Story 2.1 - requires ParticipantSessionContext)**

**Requirements:** FR5, ARCH9-10, UX9, NFR12

---

## Story 4.2: Participant Info Form

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

## Story 4.3: View Categories & Submission Status

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

## Story 4.4: Video Upload with Progress

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

## Story 4.5: Photo Upload with Progress

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

## Story 4.6: Submission Preview & Confirm

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

## Story 4.7: Edit, Replace & Withdraw Submission

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
