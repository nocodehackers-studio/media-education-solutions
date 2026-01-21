# Media Education Solutions

## 00. Project Overview

NocodeHackers will develop a **Minimum Viable Product (MVP)** for a web platform that allows Media Education Solutions (Jeb) to create, manage, and evaluate **photo and video contests**.

The platform will:

- Replace manual, error-prone processes with a **centralized, automated system**.
- Support three roles: **Super Admin**, **Judges**, and **Participants**.
- Provide a **clear, repeatable workflow** from contest creation to winner publication.
- Be built as an MVP, but with a **scalable architecture** so it can grow over time (more contests, more admins, more features).

---

## 01. User Roles

**Single Super Admin**

- Responsible for creating contests, managing categories, assigning judges, reviewing results, and publishing winners.

**Judges**

- Invited on a **per-category** basis to evaluate submissions, give feedback, and determine the top 3 winners in each category.

**Participants**

- Use random access codes for the contest, submit their video or photo to one or more categories, edit or withdraw their submissions before the deadline, and later view feedback.

---

## 02. Contest Life-Cycle

Each contest will move through five clearly defined states:

1. **Draft**
    - Contest is being created and configured by the Super Admin.
    - Categories, rules, judges, and dates are set.
    - Not yet visible or accessible to any other user.
2. **Published**
    - The contest is live.
    - Participant codes are generated and can be used to log in.
    - Participants can view active categories and submit work until the category deadlines.
3. **Closed**
    - All submission deadlines have passed.
    - Participants can no longer submit, edit, or withdraw.
    - Judges are invited via email to start reviewing submissions.
4. **Reviewed**
    - Judges have completed their evaluations and selected the top 3 in each category.
    - Super Admin can review, override, and finalize results.
5. **Finished**
    - Super Admin confirms all final winners.
    - Winners Page (URL + password) is generated.
    - Teachers/Leaders/Coaches are notified that results and feedback are available.
    - Participants can log in with their access codes to view their own feedback.
    

---

## 03. Functional Scope

### Super Admin Features

**Authentication & Access**

- Login via email + password.

**Contest Management**

- Create new contests with:
    - Contest name, topic, and public contest code.
    - General contest rules.
- Define categories per contest:
    - Category name.
    - Type: **Video** or **Photo**.
    - Category-specific rules.
    - Start and end dates (deadlines).
    - Assign a single judge (by email).

**Participant Codes**

- Generate **participant codes** on demand.
- Each participant code is:
    - 8-digit random code.
    - Unique per contest (not contest category).
- Contest code is shared publicly. Participant codes are distributed privately.

**Publishing & State Control**

- Move contest from **Draft → Published → Closed → Reviewed → Finished**.

**Monitoring & Metrics**

- Contest and category overview, including:
    - Number of participants per category.
    - Judge progress per category (e.g., “8/20 submissions reviewed”).

**Review & Override**

- Access all submissions with full participant data:
    - Full Name.
    - Institution.
    - Teacher/Leader/Coach Name.
    - Teacher/Leader/Coach Email.
- Review judges’ ratings and written feedback.
- Override
    - Any written feedback.
    - Category rankings (Top 3 order).
    - Individual participant status (e.g., disqualify a category submission).

**Winners & Output**

- Mark contest as **Finished** once all categories are finalized.
- Generate a **Winners Page URL + password** for each contest:
    - Shows the top 3 submissions per category.
    - Videos and photos are displayed and downloadable.
- Trigger PDF generation through **Documint or PDFMonkey**
    - Contest information.
    - Category rules and deadlines.
    - Optimized for printing purposes.
    

---

### Participant Features

**Access & Anonymity**

- Access via:
    - Contest code (public).
    - Personal participant code (delivered privately).

**Contest & Categories**

- After login, participants see:
    - The contest they accessed to.
    - All available categories and their status (Open / Close).
- Participants can join any available category (video or photo) while the category is still open.

**Submission Flow**
For each category joined, participant must provide:

- Full Name.
- Institution.
- Teacher/Leader/Coach Name.
- Teacher/Leader/Coach Email.
- Upload:
    - **Video** (up to 500 MB) **or**
    - **Photo** (up to 10 MB), depending on category type.
- Note: After the first submission, following submissions will auto-fill with the participant's previous personal data.

**Editing & Withdrawal**

- Before the category deadline:
    - Participants can upload a new file (latest version replaces the previous one).
    - Old files are **deleted from the server** to save space.
    - Participant can withdraw from the category entirely.
- After the deadline:
    - All participant controls are disabled (no new uploads, edits, or withdrawals).

**Viewing Feedback**

- After the contest is marked **Finished** (After Jeb manual confirmation):
    - Teachers/Leaders/Coaches receive an email informing them that results and feedback are available.
    - Participants can log in again with the same contest code + participant code.
    - Each participant can see only:
        - Their own submissions.
        - Judges’ feedback and ratings for their entries.

---

### Judge Features

**Authentication**

- Login via email + password.
- Only contests and their categories they’re assigned to are visible.

**Category & Submission View**

- For each assigned category:
    - See list of all submissions.
    - Submissions identified only by **participant code** (no name, school, or teacher info).
    - View:
        - Video (streamed via Bunny Stream).
        - Photo (from Bunny Storage).

**Evaluation**

- For each submission:
    - Assign one rating from the following scale:
        - **Developing Skills 1-2**
        - **Emerging Producer 3-4**
        - **Proficient Creator 5-6**
        - **Advanced Producer 7-8**
        - **Master Creator 9-10**
    - Write  feedback (text).

**Progress Tracking**

- Judge interface includes a progress indicator:
    - e.g., “8 of 20 submissions reviewed” for each category.

**Ranking & Completion**

- Ability to sort and **reorder the winning top 3** submissions via drag-and-drop.
- After all submissions has been reviewed, the can mark the category as **review complete**, which:
    - Locks their rankings.
    - Notifies the Super Admin that judging for that category is finished.

---

### Winners Page

For each **Finished** contest, the system will create a Winners Page:

- Protected by an automatically generated password.
- Shows per category:
    - 1st place.
    - 2nd place.
    - 3rd place.
- Contains:
    - Embedded video player for winners.
    - Photos displayed inline.
    - All media is available for download on the best quality possible.

The Super Admin shares this URL and password with contest stakeholders (e.g., Schools, or event organizers).

---

### Email Notifications

All emails are sent via **Brevo**, using fixed templates with dynamic fields (contest name, category name, etc.).

**Email Events:**

- **Judge invites**
    
    When a contest or category enters the judging phase, each assigned judge receives:
    
    - A login link (or reminder).
    - Contest and category information.
- **Judging complete → Admin notification**
    
    When a judge marks a category as reviewed, the Super Admin is notified.
    
- **Contest finished → Teacher notification**
    
    When the contest is marked **Finished**, the system sends an email to all **Teachers/Leaders/Coaches**:
    
    - Informing them that results and feedback are available.
    - Instructing them to share this information with the participant.

> Important:
> 
> 
> Participants themselves **do not** receive emails, since the system does not store their email addresses.
> 

---

## 04. Main screens

**Super Admin**

- Login
- Contest list
- Create/Edit contest
- Contest detail with category list (with general metrics)
- Category submissions with judge reviews
- Individual submission view with full data and feedback
- Winners page configuration

**Judges**

- Login
- Assigned contests
- Contest detail with category list
- Category submissions list with progress indicator
- Individual submission evaluation (rating + feedback)

**Participants**

- Login (contest code + participant code)
- Contest overview with categories
- Category submission form
- Submission detail (current file, status)
- Submission confirmation page
- Post-contest feedback view (after contest is Finished)

---

## 05. Technology Stack

- **Frontend:** React + Vite
- **Backend / Auth / Database:** Supabase
- **Video streaming & transcoding:** Bunny Stream
- **Photo storage:** Bunny Storage
- **Email:** Brevo
- **PDF generation:** Documint or PDFMonkey (to be defined)
- **Deployment:** Vercel
- **Version control:** GitHub
- **Assisted coding:** Lovable, Claude Code, Codex

The stack is modern, cloud-based, and designed to scale with future needs (more contests, additional roles, and new features).

---

## 06. Timeline

The project will be delivered in **4–6 weeks**, approximately:

- **Weeks 1–2**
    - Refine requirements based on this proposal
    - Define data model and contest life-cycle
    - Design key UX flows and screens
    - Set up project structure, Supabase, and integrations
- **Weeks 2–4**
    - Implement Super Admin features
    - Implement Participant flows and media uploads
    - Integrate Bunny Stream & Bunny Storage
    - Integrate Brevo for transactional emails
- **Weeks 4–6**
    - Implement Judge flows, ratings, and ranking
    - Winners Page and PDF generation
    - End-to-end testing of complete contest cycle
    - Bug fixes and deployment to production
    

---

## 07. Budget & Payment Terms

### Total Investment

**$10,000 USD**

This includes:

- Design and development of the MVP platform
- Integration with Supabase, Bunny Stream/Storage, Brevo, and Documint/PDFMonkey
- Deployment to Vercel
- Internal QA and shared testing with Media Education Solutions
- Technical handover and basic documentation

Does not includes:

- Monthly/Annual payments to any required services or subscriptions. (See below)

### Payment Terms

- **50%** due at project start.
- **50%** due upon delivery of the MVP to production.

### Bug Fixing

- Bugs and issues directly related to the agreed scope, identified during:
    - Internal QA and
    - An initial acceptance period with Media Education Solutions
    will be fixed at no additional cost.
    

---

## 08. Estimated Monthly Tool Costs

These costs are approximates:

- **Supabase** ~$25/month
- **Brevo** ~$5-15/month (email volume dependent)
- **Bunny Stream & Bunny Storage** (usage-based billing for storage and bandwidth)
- **Vercel** ~$5-15/month (can typically operate on free or low-cost tiers for the MVP)
- **PDFMonkey** ~$9/month
- **Github** $0 (Free)

Exact costs will depend on real-world usage (number of contests, submissions, and traffic).

---

## 09. Out of Scope for this MVP

The following items are **not included** in this phase:

- Multi-language support
- Multiple judges per category
- Public voting or audience scoring
- Contest duplication / templating
- CSV or advanced data exports
- Advanced dashboards or reporting
- AI-based plagiarism or content analysis
- Paid contest registration / payment processing
- Mobile app (native); the platform will be responsive for mobile browsers, but no native iOS/Android app is included