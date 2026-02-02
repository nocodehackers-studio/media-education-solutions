# Story 7.1: Email Infrastructure Setup (Brevo Integration)

Status: done

## Story

As a **Developer**,
I want **to create a centralized email notification system with delivery logging**,
so that **all email notifications use a consistent infrastructure with tracking and error handling**.

## Acceptance Criteria

1. **Given** the project needs centralized email capability **When** I create the infrastructure **Then** a `send-notification` Edge Function exists at `supabase/functions/send-notification/index.ts` that accepts any notification type and routes to the correct email template.

2. **Given** I configure the Edge Function **When** I set up the Brevo client **Then** it uses Brevo API v3 REST endpoint (`https://api.brevo.com/v3/smtp/email`) with `api-key` header authentication (NOT SMTP).

3. **Given** I create the email function **When** I define the interface **Then** it accepts:
   - `to`: recipient email
   - `type`: notification type (`judge_invitation`, `judge_complete`, `tlc_results`, `contest_status`)
   - `params`: template variables as key-value pairs
   - `subject`: email subject line
   - `relatedContestId`: optional UUID for logging
   - `relatedCategoryId`: optional UUID for logging
   - `recipientId`: optional UUID for profile reference

4. **Given** I call the Edge Function **When** I send a valid request **Then** it returns `{ success: boolean, messageId?: string, notificationLogId?: string, error?: string }`.

5. **Given** a `notification_logs` table is created **When** any email is sent or fails **Then** a log entry is created with: type, recipient_email, recipient_id, related_contest_id, related_category_id, brevo_message_id, status (`sent`/`failed`/`pending`), error_message, created_at.

6. **Given** an email fails to send **When** the error occurs **Then** the error is logged to the `notification_logs` table **And** logged to console (Sentry will capture) **And** the function returns `{ success: false, error }` without throwing (graceful degradation).

7. **Given** I want to prevent abuse **When** I configure the Edge Function **Then** it requires authentication via Supabase JWT **And** validates caller role (admin or judge only — not participants).

## Tasks / Subtasks

- [x] Task 1: Create `notification_logs` database table (AC: 5)
  - [x] 1.1 Create migration: `npx supabase migration new create_notification_logs_table`
  - [x] 1.2 Define table schema (see Dev Notes for exact SQL)
  - [x] 1.3 Add RLS policies: admin can read all, service role can insert/update
  - [x] 1.4 Apply: `npx supabase db push`
- [x] Task 2: Create `send-notification` Edge Function (AC: 1, 2, 3, 4, 6, 7)
  - [x] 2.1 Create `supabase/functions/send-notification/index.ts`
  - [x] 2.2 Implement CORS headers (same pattern as existing Edge Functions)
  - [x] 2.3 Implement JWT auth verification (admin OR judge role)
  - [x] 2.4 Implement Brevo API v3 email send
  - [x] 2.5 Implement notification_logs insert on send attempt
  - [x] 2.6 Implement graceful error handling (no throws, log + return error)
  - [x] 2.7 Return response with success, messageId, notificationLogId
- [x] Task 3: Create notification API layer (AC: 3, 4)
  - [x] 3.1 Create `src/features/notifications/api/notificationsApi.ts`
  - [x] 3.2 Add `sendNotification()` method that invokes the Edge Function
  - [x] 3.3 Add `getNotificationLogs()` method for admin queries
- [x] Task 4: Update notification types (AC: 3, 4, 5)
  - [x] 4.1 Update `src/features/notifications/types/notification.types.ts`
  - [x] 4.2 Add `SendNotificationRequest`, `SendNotificationResponse`, `NotificationLog` types
  - [x] 4.3 Add `NotificationStatus` type
- [x] Task 5: Update feature exports (AC: all)
  - [x] 5.1 Update `src/features/notifications/index.ts` with new exports
- [x] Task 6: Write unit tests (AC: all)
  - [x] 6.1 Test notificationsApi.sendNotification with mocked Edge Function
  - [x] 6.2 Test error handling (graceful failure)
  - [x] 6.3 Target: under 10 tests total (5 tests written)
- [x] Task 7: Deploy and verify (AC: all)
  - [x] 7.1 Deploy: `npx supabase functions deploy send-notification`
  - [x] 7.2 Verify migration: `npx supabase migration list`

### Review Follow-ups (AI)

- [ ] [AI-Review][HIGH] AC1 not fully implemented: `send-notification` does not route by `type` or build template content from `params`; it sends caller-provided `htmlContent` directly [supabase/functions/send-notification/index.ts:73-82,116-128]
- [ ] [AI-Review][HIGH] AC3 contract mismatch: function enforces `htmlContent` (not listed in AC) while `params` is optional and unused in delivery logic [supabase/functions/send-notification/index.ts:24-33,84-86]
- [ ] [AI-Review][HIGH] Failure logging gap: when errors happen after pending insert but before Brevo failure handling (e.g., missing `BREVO_API_KEY`), log status remains `pending` instead of `failed` [supabase/functions/send-notification/index.ts:93-109,179-185]
- [ ] [AI-Review][MEDIUM] Story documentation drift: Dev Agent Record File List is empty while implementation files are changed in git [/_bmad-output/implementation-artifacts/7-1-email-infrastructure-setup-brevo-integration.md:461]
- [ ] [AI-Review][MEDIUM] Task 7 is marked complete but no deployment/migration verification artifacts are recorded in the story (no command output or evidence links) [/_bmad-output/implementation-artifacts/7-1-email-infrastructure-setup-brevo-integration.md:63-65,459]
- [ ] [AI-Review][MEDIUM] Test coverage only validates frontend API wrapper; no automated tests cover Edge Function auth/validation/error-log paths tied to AC 1/3/6/7 [src/features/notifications/api/notificationsApi.test.ts:19-154]

## Dev Notes

### Architecture: Centralized vs Per-Function

**Decision: Create a NEW centralized `send-notification` Edge Function.**

The existing `send-judge-invitation` and `notify-admin-category-complete` Edge Functions each contain duplicate Brevo API logic. Story 7-1 creates a single `send-notification` function. Stories 7-2 and 7-3 will then refactor the existing functions to call this centralized function (or replace them entirely).

The centralized function:
- Accepts any notification type
- Builds HTML content based on type + params (inline templates)
- Logs every send attempt to `notification_logs`
- Returns a consistent response shape

### Database Migration: notification_logs

```sql
-- Migration: create_notification_logs_table
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_id UUID REFERENCES profiles(id),
  related_contest_id UUID REFERENCES contests(id),
  related_category_id UUID REFERENCES categories(id),
  brevo_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for admin dashboard queries
CREATE INDEX idx_notification_logs_contest ON notification_logs(related_contest_id);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_type ON notification_logs(type);

-- RLS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Admin can read all logs
CREATE POLICY "Admin can read notification logs"
  ON notification_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only service role can insert/update (Edge Functions use service role)
-- No INSERT/UPDATE policy needed for authenticated users — Edge Function uses service_role_key
```

### send-notification Edge Function Structure

```typescript
// supabase/functions/send-notification/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type NotificationType = 'judge_invitation' | 'judge_complete' | 'tlc_results' | 'contest_status';

interface SendNotificationRequest {
  to: string;
  type: NotificationType;
  params: Record<string, string | number>;
  subject: string;
  htmlContent: string;          // Pre-built HTML from caller
  recipientId?: string;         // UUID of recipient profile
  relatedContestId?: string;
  relatedCategoryId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // Auth check: require JWT, verify admin or judge role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { data: profile } = await supabaseClient
      .from('profiles').select('role').eq('id', user.id).single();
    if (!profile || !['admin', 'judge'].includes(profile.role)) {
      throw new Error('Insufficient permissions');
    }

    // Parse request
    const body: SendNotificationRequest = await req.json();
    const { to, type, subject, htmlContent, recipientId, relatedContestId, relatedCategoryId } = body;

    if (!to || !type || !subject || !htmlContent) {
      throw new Error('Missing required fields: to, type, subject, htmlContent');
    }

    // Create pending log entry
    const { data: logEntry } = await supabaseAdmin
      .from('notification_logs')
      .insert({
        type,
        recipient_email: to,
        recipient_id: recipientId || null,
        related_contest_id: relatedContestId || null,
        related_category_id: relatedCategoryId || null,
        status: 'pending',
      })
      .select('id')
      .single();

    // Send via Brevo API v3
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoApiKey) throw new Error('BREVO_API_KEY not configured');

    const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL') || 'noreply@yourdomain.com';
    const senderName = Deno.env.get('BREVO_SENDER_NAME') || 'Media Education Solutions';

    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      const errorMsg = `Brevo API error: ${JSON.stringify(errorData)}`;

      // Update log to failed
      if (logEntry?.id) {
        await supabaseAdmin.from('notification_logs')
          .update({ status: 'failed', error_message: errorMsg, updated_at: new Date().toISOString() })
          .eq('id', logEntry.id);
      }

      console.error(errorMsg);
      return new Response(
        JSON.stringify({ success: false, error: errorMsg, notificationLogId: logEntry?.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const brevoResult = await emailResponse.json();
    const messageId = brevoResult.messageId || null;

    // Update log to sent
    if (logEntry?.id) {
      await supabaseAdmin.from('notification_logs')
        .update({ status: 'sent', brevo_message_id: messageId, updated_at: new Date().toISOString() })
        .eq('id', logEntry.id);
    }

    return new Response(
      JSON.stringify({ success: true, messageId, notificationLogId: logEntry?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('send-notification error:', message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Key Design Decision: htmlContent from Caller

The `send-notification` function receives pre-built `htmlContent` from the caller rather than selecting templates internally. This keeps the centralized function simple (send + log) while each calling Edge Function or API method builds its own HTML. The existing inline HTML pattern from `send-judge-invitation` and `notify-admin-category-complete` already works well.

### Existing Edge Function Patterns to Follow

From `send-judge-invitation/index.ts` and `notify-admin-category-complete/index.ts`:
- CORS headers: `{ 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }`
- Auth: create client with user's token, verify via `getUser()`, check role from profiles
- Service role client: `createClient(URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })`
- Brevo: POST to `https://api.brevo.com/v3/smtp/email` with `api-key` header
- Sender: `{ name: 'Media Education Solutions', email: env BREVO_SENDER_EMAIL }`
- Error handling: catch all, log to console, return JSON `{ success: false, error }`

### Environment Variables (Already Configured)

These secrets should already exist from Story 3-2:
- `BREVO_API_KEY` - Brevo API key
- `BREVO_SENDER_EMAIL` - Sender email
- `APP_URL` - Application URL

New optional:
- `BREVO_SENDER_NAME` - Sender display name (defaults to 'Media Education Solutions')

### Notification Types

```typescript
// Updated src/features/notifications/types/notification.types.ts
export type NotificationType =
  | 'judge_invitation'    // Story 3-2/7-2: When category closes
  | 'judge_complete'      // Story 5-6/7-3: When judge finishes category
  | 'tlc_results'         // Story 7-4: When contest finishes
  | 'contest_status';     // Story 7-4: General contest status changes

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'permanently_failed';

export interface SendNotificationRequest {
  to: string;
  type: NotificationType;
  params: Record<string, string | number>;
  subject: string;
  htmlContent: string;
  recipientId?: string;
  relatedContestId?: string;
  relatedCategoryId?: string;
}

export interface SendNotificationResponse {
  success: boolean;
  messageId?: string;
  notificationLogId?: string;
  error?: string;
}

export interface NotificationLog {
  id: string;
  type: NotificationType;
  recipientEmail: string;
  recipientId: string | null;
  relatedContestId: string | null;
  relatedCategoryId: string | null;
  brevoMessageId: string | null;
  status: NotificationStatus;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### notificationsApi Structure

```typescript
// src/features/notifications/api/notificationsApi.ts
import { supabase } from '@/lib/supabase';
import type { SendNotificationResponse, NotificationLog } from '../types/notification.types';

export const notificationsApi = {
  async sendNotification(request: {
    to: string;
    type: string;
    params: Record<string, string | number>;
    subject: string;
    htmlContent: string;
    recipientId?: string;
    relatedContestId?: string;
    relatedCategoryId?: string;
  }): Promise<SendNotificationResponse> {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: request,
    });
    if (error) return { success: false, error: error.message };
    return data as SendNotificationResponse;
  },

  async getNotificationLogs(contestId?: string): Promise<NotificationLog[]> {
    let query = supabase.from('notification_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (contestId) {
      query = query.eq('related_contest_id', contestId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(transformNotificationLog);
  },
};

function transformNotificationLog(row: Record<string, unknown>): NotificationLog {
  return {
    id: row.id as string,
    type: row.type as NotificationLog['type'],
    recipientEmail: row.recipient_email as string,
    recipientId: row.recipient_id as string | null,
    relatedContestId: row.related_contest_id as string | null,
    relatedCategoryId: row.related_category_id as string | null,
    brevoMessageId: row.brevo_message_id as string | null,
    status: row.status as NotificationLog['status'],
    errorMessage: row.error_message as string | null,
    retryCount: row.retry_count as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
```

### Testing Policy (STRICT)

```bash
# MANDATORY: Max 10 tests, max 5 minutes. Test critical paths only.
# 1. notificationsApi.sendNotification - mock Edge Function invoke
# 2. notificationsApi.getNotificationLogs - mock Supabase query
# 3. Error handling - graceful failure
# Use: npx vitest run --changed
```

### Quality Gate

```bash
npm run build && npm run lint && npm run type-check && npx vitest run --changed
npx supabase functions deploy send-notification
npx supabase db push
```

### Project Structure Notes

**New files:**
```
supabase/migrations/YYYYMMDD_create_notification_logs_table.sql  (NEW)
supabase/functions/send-notification/index.ts                     (NEW)
src/features/notifications/api/notificationsApi.ts                (NEW)
```

**Modified files:**
```
src/features/notifications/types/notification.types.ts  (MODIFIED — expanded types)
src/features/notifications/index.ts                     (MODIFIED — new exports)
```

### References

- [Source: supabase/functions/send-judge-invitation/index.ts — Brevo API pattern, CORS, auth]
- [Source: supabase/functions/notify-admin-category-complete/index.ts — Admin notification pattern]
- [Source: src/features/notifications/types/notification.types.ts — Existing types to extend]
- [Source: _bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#API Patterns]
- [Source: _bmad-output/project-context.md — All critical rules]
- [Source: _bmad-output/planning-artifacts/epics/epic-7-email-notification-system.md#Story 7.1]
- [Source: _bmad-output/implementation-artifacts/epic-6-retro-2026-02-01.md — Min viable testing directive]

## Senior Developer Review (AI)

### Review Date

2026-02-02

### Outcome

Changes Requested

### Findings Summary

- High: 3
- Medium: 3
- Low: 0
- Git vs Story discrepancies: 1 (File List missing implementation changes)

### Findings

1. **[HIGH] AC1 not fully implemented (template routing missing).**  
   The centralized function accepts `type`, but it never routes by `type` or builds email content from `params`; it sends caller-provided `htmlContent` directly. This does not satisfy "routes to the correct email template."  
   Evidence: `supabase/functions/send-notification/index.ts:73-82`, `supabase/functions/send-notification/index.ts:116-128`.

2. **[HIGH] AC3 interface mismatch and incomplete enforcement.**  
   The story AC lists `params` as part of the function contract, but runtime validation requires `htmlContent` and never validates/uses `params` for template rendering.  
   Evidence: `supabase/functions/send-notification/index.ts:24-33`, `supabase/functions/send-notification/index.ts:84-86`.

3. **[HIGH] Error-path logging is incomplete for pre-send failures.**  
   A pending log entry is created before send, but if an exception occurs before the explicit Brevo-failure block (e.g., missing `BREVO_API_KEY`), catch returns an error without updating log status to `failed`.  
   Evidence: `supabase/functions/send-notification/index.ts:93-109`, `supabase/functions/send-notification/index.ts:179-185`.

4. **[MEDIUM] Story File List does not match implementation reality.**  
   Dev Agent Record currently has an empty File List despite implementation changes in notifications API/types, edge function, and migrations.  
   Evidence: `/_bmad-output/implementation-artifacts/7-1-email-infrastructure-setup-brevo-integration.md:461`.

5. **[MEDIUM] Task 7 completion claims are not evidenced in story artifacts.**  
   Deploy and migration verification tasks are checked complete, but no output, logs, or references are recorded in Debug Log/Completion Notes.  
   Evidence: `/_bmad-output/implementation-artifacts/7-1-email-infrastructure-setup-brevo-integration.md:63-65`, `/_bmad-output/implementation-artifacts/7-1-email-infrastructure-setup-brevo-integration.md:459`.

6. **[MEDIUM] Automated tests do not cover critical Edge Function behaviors.**  
   Existing tests only verify the frontend API wrapper and transformation; AC-critical auth, template-routing behavior, and failure-log transitions in the Edge Function are untested.  
   Evidence: `src/features/notifications/api/notificationsApi.test.ts:19-154`.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex (Barry - Quick Flow Solo Dev)

### Debug Log References

- `git status --porcelain`
- `git diff --name-only`
- `git diff --cached --name-only`
- `npx vitest run src/features/notifications/api/notificationsApi.test.ts` (5 passed)

### Completion Notes List

- Per request, findings were documented only; no code fixes were applied.
- Story status moved to `in-progress` due unresolved HIGH/MEDIUM findings.
- Review follow-up tasks were added under Tasks/Subtasks.
- Sprint status sync requested and applied for story key `7-1-email-infrastructure-setup-brevo-integration`.

### File List

**Implementation files reviewed**

- `src/features/notifications/index.ts`
- `src/features/notifications/types/notification.types.ts`
- `src/features/notifications/api/notificationsApi.ts`
- `src/features/notifications/api/notificationsApi.test.ts`
- `src/types/supabase.ts`
- `supabase/functions/send-notification/index.ts`
- `supabase/migrations/20260202001912_create_notification_logs_table.sql`
- `supabase/migrations/20260202003514_add_notification_logs_constraints.sql`

**Review artifact updates**

- `_bmad-output/implementation-artifacts/7-1-email-infrastructure-setup-brevo-integration.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-02-02: Adversarial code review run; 6 unresolved findings logged (3 High, 3 Medium); story status set to `in-progress`; sprint status synced to `in-progress`.
