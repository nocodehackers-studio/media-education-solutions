// features/notifications/index.ts
// Notifications feature - Email notifications via Brevo
// Story 3-2: Minimal types, expanded Story 7-1: Centralized infrastructure
// Story 7-5: Delivery tracking, retry, admin views

// === API ===
export { notificationsApi } from './api/notificationsApi';

// === Components ===
export { NotificationSummary } from './components/NotificationSummary';
export { NotificationLogsTable } from './components/NotificationLogsTable';

// === Hooks ===
export { useNotificationLogs } from './hooks/useNotificationLogs';
export { useRetryNotification } from './hooks/useRetryNotification';

// === Utils ===
export { isAllJudgingComplete } from './utils/isAllJudgingComplete';

// === Types ===
export type {
  NotificationType,
  NotificationStatus,
  SendNotificationRequest,
  SendNotificationResponse,
  NotificationLog,
  JudgeInvitationPayload,
  JudgeInvitationResponse,
  CategoryCompletePayload,
  CategoryCompleteResponse,
  RetryNotificationResponse,
} from './types/notification.types';
