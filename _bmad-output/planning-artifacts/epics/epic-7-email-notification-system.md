# Epic 7: Email Notification System

**Goal:** Implement automated email notifications via Brevo for key system events.

**Value Delivered:** Automated communication keeps judges and admins informed without manual effort.

**Dependencies:** Epic 1 (Edge Functions infrastructure), Epic 3 (Judge assignment)

## Story 7.1: Email Infrastructure Setup (Brevo Integration)

As a **Developer**,
I want **to set up Brevo email integration via Supabase Edge Functions**,
So that **the system can send transactional emails reliably**.

**Acceptance Criteria:**

**Given** the project needs email capability
**When** I set up the infrastructure
**Then** I create `supabase/functions/send-notification/index.ts`

**Given** I configure the Edge Function
**When** I set up the Brevo client
**Then** I use the Brevo API v3 (not SMTP) for transactional emails
**And** API key is stored in Supabase secrets: `BREVO_API_KEY`

**Given** I create the email function
**When** I define the interface
**Then** it accepts:
```typescript
interface EmailRequest {
  to: string;           // Recipient email
  templateId: string;   // Brevo template ID
  params: Record<string, string | number>; // Template variables
  subject?: string;     // Optional override
}
```

**Given** I call the Edge Function
**When** I send a valid request
**Then** it returns:
```typescript
interface EmailResponse {
  success: boolean;
  messageId?: string;   // Brevo message ID for tracking
  error?: string;
}
```

**Given** an email fails to send
**When** the error occurs
**Then** the error is logged to Sentry
**And** a meaningful error message is returned
**And** the function does NOT throw (graceful degradation)

**Given** I want to prevent abuse
**When** I configure the Edge Function
**Then** it requires authentication (Supabase JWT)
**And** only admin/system can call it (not participants)

**Environment variables required:**
- `BREVO_API_KEY` - Brevo API key
- `FROM_EMAIL` - Sender email (e.g., noreply@contest.example.com)
- `FROM_NAME` - Sender name (e.g., "Contest Platform")

**Brevo templates to create:**
| Template ID | Purpose |
|-------------|---------|
| judge-invitation | Judge invite when category closes |
| judge-category-complete | Admin notification when judge finishes |
| tlc-results-available | T/L/C notification when contest finished |

**Requirements:** ARCH13, NFR26

---

## Story 7.2: Judge Invitation Email

As a **System**,
I want **to automatically email judges when their assigned category closes**,
So that **judges know when to start reviewing**.

**Acceptance Criteria:**

**Given** a category deadline passes (or admin manually closes)
**When** the category status changes to "Closed"
**Then** the system triggers judge invitation email

**Given** the category has an assigned judge
**When** the invitation triggers
**Then** an email is sent with:
| Field | Value |
|-------|-------|
| To | Judge email (from profiles table) |
| Subject | "Ready to Judge: {Category Name} in {Contest Name}" |
| Template | judge-invitation |

**Given** the email template
**When** it renders
**Then** it includes:
- Judge's name
- Contest name
- Category name
- Number of submissions to review
- Login link (direct to judge dashboard)
- Category deadline (when judging must be complete, if set)

**Given** the judge has never logged in
**When** they click the login link
**Then** they are directed to set password first (Story 3.2)

**Given** the judge has logged in before
**When** they click the login link
**Then** they go to login page with email prefilled

**Given** the system sends the invitation
**When** the email is queued
**Then** `categories.invited_at` is updated with timestamp
**And** the email send is logged in the database

**Given** the email fails to send
**When** the error occurs
**Then** the error is logged
**And** admin can see "Invitation Failed" status
**And** admin can manually trigger re-send

**Given** admin manually re-sends invitation
**When** they click "Resend Invite"
**Then** a new email is sent
**And** `invited_at` is updated

**Database logging:**
```sql
-- notification_logs table
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'judge_invitation', 'judge_complete', 'tlc_notification', etc.
  recipient_email TEXT NOT NULL,
  recipient_id UUID REFERENCES profiles(id),
  related_contest_id UUID REFERENCES contests(id),
  related_category_id UUID REFERENCES categories(id),
  brevo_message_id TEXT,
  status TEXT NOT NULL, -- 'sent', 'failed', 'pending'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Requirements:** FR21, FR61

---

## Story 7.3: Admin Notification - Judge Complete

As a **System**,
I want **to notify the Super Admin when a judge completes a category**,
So that **the admin knows when to review and publish results**.

**Acceptance Criteria:**

**Given** a judge marks a category as complete (Story 5.6)
**When** the completion is confirmed
**Then** the system triggers admin notification email

**Given** the notification triggers
**When** the email is composed
**Then** it is sent to the Super Admin (role = 'super_admin')
**And** if multiple super admins exist, all receive the email

**Given** the email template
**When** it renders
**Then** it includes:
| Field | Value |
|-------|-------|
| Subject | "Judging Complete: {Category} by {Judge Name}" |
| Judge name | Who completed |
| Contest name | Which contest |
| Category name | Which category |
| Submissions reviewed | Count |
| Top 3 ranked | Brief summary (codes only, no spoilers) |
| Link | Direct to admin category review page |

**Given** the admin clicks the link
**When** they navigate
**Then** they see the judge's reviews and rankings
**And** they can override if needed (Story 6.3)

**Given** all categories in a contest are judged
**When** the last judge completes
**Then** an additional summary email is sent:
- Subject: "All Judging Complete: {Contest Name}"
- Summary of all categories and judges
- Link to generate winners page

**Given** the email is sent
**When** logged
**Then** entry is created in `notification_logs`

**Requirements:** FR48, FR62

---

## Story 7.4: Contest Status Update Emails

As a **System**,
I want **to notify relevant parties when contest status changes**,
So that **stakeholders stay informed of contest lifecycle**.

**Acceptance Criteria:**

**Given** a contest status changes to "Published"
**When** the change is saved
**Then** NO automatic email is sent (admin controls distribution manually)

**Given** a contest status changes to "Closed"
**When** the change is saved
**Then** judge invitation emails are triggered for all closed categories (Story 7.2)

**Given** a contest status changes to "Finished"
**And** the T/L/C notification toggle is ON
**When** the system prepares to send T/L/C emails
**Then** it collects ALL unique T/L/C emails across all participants in the contest
**And** sends exactly ONE email per unique T/L/C email address

**Given** multiple participants have the same T/L/C email
**When** the notification is sent
**Then** that T/L/C receives only ONE email (deduplicated)
**And** the email does NOT list individual participant codes

**Given** T/L/C receives the email
**When** they read it
**Then** they see:
- Subject: "Contest Results Available: {Contest Name}"
- Generic message that results are available
- NO direct link to winners page (admin shares manually)
- Message: "Contact your participants for their individual feedback"

**Given** T/L/C notification is optional
**When** admin configures contest
**Then** there is a toggle: "Notify T/L/C when results published"
**And** default is OFF

**Given** email delivery fails
**When** error occurs
**Then** it is logged
**And** admin can see failed notifications in contest dashboard

**Requirements:** FR63, FR64

---

## Story 7.5: Email Delivery Tracking & Retry

As a **Super Admin**,
I want **to view email delivery status and retry failed emails**,
So that **I can ensure all stakeholders receive notifications**.

**Acceptance Criteria:**

**Given** I am on a contest dashboard
**When** I view the notifications section
**Then** I see a summary:
- Total emails sent
- Successful deliveries
- Failed deliveries
- Pending retries

**Given** I want to see details
**When** I click "View All Notifications"
**Then** I see a table:
| Recipient | Type | Status | Sent At | Actions |

**Given** an email has failed status
**When** I view it
**Then** I see the error message
**And** I see a "Retry" button

**Given** I click "Retry"
**When** the retry processes
**Then** a new send attempt is made
**And** the status updates to "sent" or remains "failed"
**And** retry count is incremented

**Given** an email fails 3 times
**When** the third failure occurs
**Then** it is marked "permanently_failed"
**And** no automatic retries occur
**And** admin must manually intervene

**Given** I view email logs
**When** I filter by type
**Then** I can filter by:
- Judge invitations
- Completion notifications
- T/L/C notifications

**Given** I want to export logs
**When** I click "Export"
**Then** I download a CSV of notification history

**Requirements:** NFR26

---
