# Story 7.5: Email Delivery Tracking & Retry

Status: ready-for-dev

## Story

As a **Super Admin**,
I want **to view email delivery status and retry failed emails from the admin dashboard**,
so that **I can ensure all stakeholders receive their notifications**.

## Acceptance Criteria

1. **Given** I am on a contest dashboard **When** I view the notifications section **Then** I see a summary: total emails sent, successful deliveries, failed deliveries.

2. **Given** I want to see details **When** I click "View All Notifications" **Then** I see a table with columns: Recipient, Type, Status, Sent At, Actions.

3. **Given** an email has failed status **When** I view it **Then** I see the error message **And** I see a "Retry" button.

4. **Given** I click "Retry" **When** the retry processes **Then** a new send attempt is made via Brevo **And** the status updates to "sent" or remains "failed" **And** `retry_count` is incremented.

5. **Given** an email fails 3 times **When** the third failure occurs **Then** it is marked `permanently_failed` **And** no automatic retries occur **And** admin must manually intervene.

6. **Given** I view email logs **When** I filter by type **Then** I can filter by: Judge invitations, Completion notifications, T/L/C notifications.

7. **Given** I want to export logs **When** I click "Export" **Then** I download a CSV of notification history.

## Tasks / Subtasks

- [ ] Task 1: Create notification summary component (AC: 1)
  - [ ] 1.1 Create `src/features/notifications/components/NotificationSummary.tsx`
  - [ ] 1.2 Display counts: total, sent, failed
  - [ ] 1.3 Use `useNotificationLogs(contestId)` hook
- [ ] Task 2: Create notification logs table component (AC: 2, 3, 6)
  - [ ] 2.1 Create `src/features/notifications/components/NotificationLogsTable.tsx`
  - [ ] 2.2 Columns: Recipient, Type (badge), Status (badge with color), Sent At, Actions
  - [ ] 2.3 Type filter: dropdown for judge_invitation, judge_complete, tlc_results
  - [ ] 2.4 Status badges: sent=green, failed=red, pending=yellow, permanently_failed=gray
  - [ ] 2.5 Show error message on hover/expand for failed entries
  - [ ] 2.6 "Retry" button for failed entries (not permanently_failed)
- [ ] Task 3: Create retry Edge Function or API method (AC: 4, 5)
  - [ ] 3.1 Create `src/features/notifications/api/` retry method
  - [ ] 3.2 Read the original notification_log entry to get email details
  - [ ] 3.3 Re-send via Brevo using the same recipient, type, and a re-send subject
  - [ ] 3.4 Update notification_log: increment retry_count, update status
  - [ ] 3.5 If retry_count >= 3 and still failing, set status to 'permanently_failed'
- [ ] Task 4: Create useNotificationLogs hook (AC: 1, 2, 6)
  - [ ] 4.1 Create `src/features/notifications/hooks/useNotificationLogs.ts`
  - [ ] 4.2 TanStack Query hook querying `notification_logs` table
  - [ ] 4.3 Accept `contestId` filter
  - [ ] 4.4 Accept `type` filter (optional)
- [ ] Task 5: Create useRetryNotification mutation hook (AC: 4, 5)
  - [ ] 5.1 Create `src/features/notifications/hooks/useRetryNotification.ts`
  - [ ] 5.2 TanStack mutation hook calling retry API
  - [ ] 5.3 Invalidate notification logs query on success
- [ ] Task 6: Add CSV export (AC: 7)
  - [ ] 6.1 Add "Export CSV" button to NotificationLogsTable
  - [ ] 6.2 Generate CSV from current filtered data (client-side)
  - [ ] 6.3 Trigger download with `Blob` and `URL.createObjectURL`
- [ ] Task 7: Integrate into admin dashboard (AC: 1, 2)
  - [ ] 7.1 Add NotificationSummary to contest detail page
  - [ ] 7.2 Add "View All Notifications" link/button that opens Sheet or navigates to full view
  - [ ] 7.3 Use Sheet component (consistent with existing admin panels)
- [ ] Task 8: Update feature exports (AC: all)
  - [ ] 8.1 Update `src/features/notifications/index.ts` with all new exports
- [ ] Task 9: Write minimal tests (AC: all)
  - [ ] 9.1 NotificationSummary renders counts correctly
  - [ ] 9.2 NotificationLogsTable renders rows with correct status badges
  - [ ] 9.3 Retry button visibility (shown for failed, hidden for permanently_failed)
  - [ ] 9.4 CSV export generates valid output
  - [ ] 9.5 Target: under 12 tests total
- [ ] Task 10: Quality gate and deploy (AC: all)
  - [ ] 10.1 Run quality gates

## Dev Notes

### Architecture: Retry Strategy

**Simple retry via `retry-notification` Edge Function:**

The retry function:
1. Reads the notification_log entry to get original email details
2. We need the original subject and HTML content — but notification_logs doesn't store email body
3. **Problem: We don't store the original email content in notification_logs**

**Solution: Store minimal replay info, not full email body.**

For retry, we can't replay the exact original email unless we store it. Options:
- **Option A**: Store `htmlContent` in notification_logs (wasteful, large column)
- **Option B**: Store enough params to reconstruct the email (type + params + subject)
- **Option C**: Admin retry triggers the original Edge Function again (e.g., re-call `send-judge-invitation` with same category ID)

**Recommended: Option C** — Re-invoke the original Edge Function. This is the simplest and most correct approach because:
- The original function re-fetches current data (judge info, contest name, etc.)
- No need to store email body in the database
- Each notification type already has its own Edge Function

**Implementation:**
```typescript
async retryNotification(logId: string): Promise<{ success: boolean; error?: string }> {
  // 1. Fetch the notification_log entry
  const { data: log } = await supabase
    .from('notification_logs')
    .select('*')
    .eq('id', logId)
    .single();

  if (!log) return { success: false, error: 'Log entry not found' };
  if (log.retry_count >= 3) return { success: false, error: 'Max retries exceeded' };

  // 2. Based on type, re-invoke the appropriate Edge Function
  let result;
  switch (log.type) {
    case 'judge_invitation':
      result = await supabase.functions.invoke('send-judge-invitation', {
        body: { categoryId: log.related_category_id, /* other params from original */ },
      });
      break;
    case 'judge_complete':
      result = await supabase.functions.invoke('notify-admin-category-complete', {
        body: { categoryId: log.related_category_id },
      });
      break;
    case 'tlc_results':
      result = await supabase.functions.invoke('send-tlc-notification', {
        body: { contestId: log.related_contest_id },
      });
      break;
  }

  // 3. Update the log entry
  const newRetryCount = (log.retry_count || 0) + 1;
  const newStatus = result?.data?.success
    ? 'sent'
    : (newRetryCount >= 3 ? 'permanently_failed' : 'failed');

  await supabase
    .from('notification_logs')
    .update({
      retry_count: newRetryCount,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', logId);

  return result?.data || { success: false, error: 'Unknown error' };
}
```

**Important caveat for T/L/C retry:** Re-invoking `send-tlc-notification` will re-send to ALL T/L/C recipients, not just the failed one. For a more targeted retry, the T/L/C function would need a `singleEmail` parameter. **For MVP, accept this limitation** — admin can see which specific emails failed and re-trigger manually if needed. Or add a `targetEmail` param to the Edge Function.

### Notification Summary Component

```tsx
// src/features/notifications/components/NotificationSummary.tsx
interface NotificationSummaryProps {
  contestId: string;
}

export function NotificationSummary({ contestId }: NotificationSummaryProps) {
  const { data: logs, isLoading } = useNotificationLogs(contestId);

  const summary = useMemo(() => {
    if (!logs) return { total: 0, sent: 0, failed: 0 };
    return {
      total: logs.length,
      sent: logs.filter(l => l.status === 'sent').length,
      failed: logs.filter(l => ['failed', 'permanently_failed'].includes(l.status)).length,
    };
  }, [logs]);

  // Render 3 stat cards: Total, Sent (green), Failed (red)
}
```

### NotificationLogsTable Component

Use the established admin table pattern from `AdminSubmissionsTable` (Story 6-1):
- Sortable columns
- Type filter dropdown
- Status badges with colors
- Action column with Retry button
- Sheet component for detail view on row click

### CSV Export (Client-Side)

```typescript
function exportToCsv(logs: NotificationLog[]) {
  const headers = ['Recipient', 'Type', 'Status', 'Error', 'Sent At', 'Retry Count'];
  const rows = logs.map(l => [
    l.recipientEmail, l.type, l.status, l.errorMessage || '', l.createdAt, l.retryCount
  ]);

  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `notifications-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
```

### Integration Point: Contest Detail Page

The notification summary should appear on the contest detail page (admin). The full notification logs table opens in a Sheet (consistent with existing admin patterns like AdminSubmissionsTable, JudgeRatingsSheet, etc.).

Look at how Story 6-1 and 6-2 added admin views to the contest detail area for the pattern to follow.

### useNotificationLogs Hook

```typescript
// src/features/notifications/hooks/useNotificationLogs.ts
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../api/notificationsApi';

export function useNotificationLogs(contestId?: string, type?: string) {
  return useQuery({
    queryKey: ['notification-logs', contestId, type],
    queryFn: () => notificationsApi.getNotificationLogs(contestId, type),
    enabled: !!contestId,
  });
}
```

### RLS Note

The `notification_logs` table RLS policy (created in Story 7-1) allows admin SELECT only. The retry function uses the `supabase` client (user's JWT) to read logs, then invokes Edge Functions that use service role for updates. This should work because:
- Admin reads logs via RLS (SELECT policy allows admin)
- Edge Functions update logs via service role (bypasses RLS)

### Existing Components to Reuse

| Component | Location | Usage |
|-----------|----------|-------|
| `Badge` | `@/components/ui/badge` | Status badges |
| `Sheet`, `SheetContent`, etc. | `@/components/ui/sheet` | Full logs view |
| `Button` | `@/components/ui/button` | Retry, Export buttons |
| `Select` | `@/components/ui/select` | Type filter dropdown |
| `Card`, `CardContent` | `@/components/ui/card` | Summary cards |
| `Table`, `TableRow`, etc. | `@/components/ui/table` | Logs table |
| `Skeleton` | `@/components/ui/skeleton` | Loading states |

### Testing Policy (STRICT)

```bash
# MANDATORY: Max 12 tests, max 5 minutes.
# 1. NotificationSummary renders correct counts (2 tests: with data, empty)
# 2. NotificationLogsTable renders rows with badges (2 tests: sent/failed badges)
# 3. Retry button shown for failed, hidden for permanently_failed (2 tests)
# 4. CSV export generates valid output (1 test)
# 5. useNotificationLogs returns data (1 test)
# Use: npx vitest run --changed
```

### Quality Gate

```bash
npm run build && npm run lint && npm run type-check && npx vitest run --changed
```

### Project Structure Notes

**New files:**
```
src/features/notifications/components/NotificationSummary.tsx       (NEW)
src/features/notifications/components/NotificationLogsTable.tsx      (NEW)
src/features/notifications/hooks/useNotificationLogs.ts             (NEW)
src/features/notifications/hooks/useRetryNotification.ts            (NEW)
```

**Modified files:**
```
src/features/notifications/api/notificationsApi.ts   (MODIFIED — add retry method, add type filter)
src/features/notifications/index.ts                  (MODIFIED — new exports)
src/pages/admin/ContestDetailPage.tsx                (MODIFIED — add notification summary)
```

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-7-email-notification-system.md#Story 7.5]
- [Source: src/features/notifications/api/notificationsApi.ts — API layer from Story 7-1]
- [Source: src/features/notifications/types/notification.types.ts — Types from Story 7-1]
- [Source: src/pages/admin/ContestDetailPage.tsx — Integration target]
- [Source: _bmad-output/project-context.md — All critical rules]
- [Source: _bmad-output/implementation-artifacts/epic-6-retro-2026-02-01.md — Min viable testing]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
