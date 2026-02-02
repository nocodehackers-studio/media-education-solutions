// features/notifications/index.ts
// Notifications feature - Email notifications via Brevo
// Story 3-2: Minimal types, expanded Story 7-1: Centralized infrastructure

// === API ===
export { notificationsApi } from './api/notificationsApi';

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
} from './types/notification.types';
