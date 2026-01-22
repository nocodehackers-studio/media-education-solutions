// Notification types - Story 3-2
// Minimal types for email notifications (expanded in Epic 7)

/**
 * Types of email notifications in the system
 */
export type NotificationType =
  | 'judge_invitation' // Story 3-2: Sent when category closes
  | 'judge_complete' // Epic 7: Sent when judge completes all reviews
  | 'contest_status'; // Epic 7: Contest status updates

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
