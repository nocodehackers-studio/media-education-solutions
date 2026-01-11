# Functional Requirements

## Authentication & Access

- FR1: Super Admin can log in via email and password
- FR2: Judge can log in via email and password
- FR3: New judges must set their password when first accessing the platform via invite link
- FR4: Super Admin and Judges can recover their password via email reset flow
- FR5: Participant can access a contest using contest code and participant code (no password required)

## Contest Management

- FR6: Super Admin can create a new contest with name, description, cover image, unique contest code, and general contest rules
- FR7: Super Admin can define categories within a contest with type (video or photo), deadline, rules, and description
- FR8: Super Admin can set contest status (Draft, Published, Closed, Reviewed, Finished)
- FR9: Super Admin can view a list of all contests with status indicators
- FR10: Super Admin can edit contest details while in any status
- FR11: Super Admin can delete a contest while in any status
- FR12: Super Admin can edit contest categories only while contest is in Draft status
- FR13: Super Admin can view a dashboard showing submission counts and judge progress per contest
- FR14: Categories have independent status (Draft, Published, Closed) separate from contest status

## Participant Code Management

- FR15: System automatically generates 50 participant codes when a contest is created
- FR16: Super Admin can generate additional participant codes in batches of 50
- FR17: Super Admin can view all participant codes for a contest with Used/Unused status
- FR18: Super Admin can export participant codes as a list for distribution
- FR19: Each participant code is an 8-digit unique identifier scoped to its contest

## Judge Management

- FR20: Super Admin can assign judges to specific categories within a contest by email address
- FR21: System sends email invitation to judges when their assigned category is closed (deadline reached)
- FR22: Super Admin can view judge progress (submissions reviewed vs. total) per category
- FR23: Super Admin can remove a judge from a category; existing reviews by that judge are not transferred to replacement judges
- FR24: Judge can view all assigned contests and categories after logging in

## Participant Submissions

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

## Judging & Evaluation

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

## Admin Review & Override

- FR49: Super Admin can view all submissions with full participant data (name, institution, T/L/C info)
- FR50: Super Admin can view judge ratings and written feedback for any submission
- FR51: Super Admin can override judge written feedback
- FR52: Super Admin can override category rankings (Top 3 order)
- FR53: Super Admin can disqualify individual submissions

## Results & Winners

- FR54: Super Admin can generate a winners page for a contest
- FR55: Super Admin can set a password for the winners page
- FR56: Winners page is publicly accessible but displays no data until correct password is entered
- FR57: Winners page displays top 3 ranked submissions per category after password authentication
- FR58: Winners page media (videos and photos) is downloadable in best quality
- FR59: Participant can view their feedback and rating after contest is marked Finished
- FR60: Participant can access feedback using the same codes they used for submission

## Notifications

- FR61: System sends email to judges when they are assigned and their category is closed
- FR62: System sends email to Super Admin when a judge completes a category
- FR63: System sends email to Teachers/Leaders/Coaches when contest results are available
- FR64: Email notifications include relevant links and instructions
