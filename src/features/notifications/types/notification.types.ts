// Notification types - Story 3-2, expanded Story 7-1
// Types for email notifications via Brevo

/**
 * Types of email notifications in the system
 */
export type NotificationType =
  | 'judge_invitation' // Story 3-2: Sent when category closes
  | 'judge_complete' // Story 5-6: Sent when judge completes all reviews
  | 'tlc_results' // Story 7-4: When contest finishes
  | 'contest_status'; // Story 7-4: General contest status changes

/**
 * Status of a notification log entry
 */
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'permanently_failed';

/**
 * Request payload for the centralized send-notification Edge Function
 */
export interface SendNotificationRequest {
  to: string;
  type: NotificationType;
  params?: Record<string, string | number>;
  subject: string;
  htmlContent: string;
  recipientId?: string;
  relatedContestId?: string;
  relatedCategoryId?: string;
}

/**
 * Response from the send-notification Edge Function
 */
export interface SendNotificationResponse {
  success: boolean;
  messageId?: string;
  notificationLogId?: string;
  error?: string;
}

/**
 * Notification log entry (camelCase transform from DB)
 */
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

/**
 * Judge invitation email request payload
 * Sent to Edge Function for Brevo delivery
 */
export interface JudgeInvitationPayload {
  categoryId: string;
  judgeEmail: string;
  judgeName?: string;
  categoryName: string;
  contestName: string;
  submissionCount: number;
}

/**
 * Response from send-judge-invitation Edge Function
 */
export interface JudgeInvitationResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Story 5-6: Category complete notification payload
 * Sent to Edge Function for Brevo delivery to admins
 */
export interface CategoryCompletePayload {
  categoryId: string;
}

/**
 * Story 5-6: Response from notify-admin-category-complete Edge Function
 */
export interface CategoryCompleteResponse {
  success: boolean;
  error?: string;
}
