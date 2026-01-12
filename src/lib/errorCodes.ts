/**
 * Standardized error codes for the application.
 * Use these constants for consistent error handling across features.
 */
export const ERROR_CODES = {
  // Authentication & Session
  INVALID_CODES: 'INVALID_CODES',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',

  // Contest & Category
  CONTEST_NOT_FOUND: 'CONTEST_NOT_FOUND',
  CATEGORY_CLOSED: 'CATEGORY_CLOSED',

  // File Upload
  SUBMISSION_LIMIT_EXCEEDED: 'SUBMISSION_LIMIT_EXCEEDED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',

  // General
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

/**
 * User-friendly error messages for each error code.
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  INVALID_CODES: 'The contest or participant code is invalid.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  AUTH_INVALID_CREDENTIALS: 'Invalid email or password.',
  AUTH_SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  AUTH_UNAUTHORIZED: 'You are not authorized to access this resource.',
  CONTEST_NOT_FOUND: 'Contest not found.',
  CATEGORY_CLOSED: 'This category is no longer accepting submissions.',
  SUBMISSION_LIMIT_EXCEEDED: 'You have reached the submission limit.',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed.',
  INVALID_FILE_TYPE: 'This file type is not supported.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
}

/**
 * Get user-friendly message for an error code.
 */
export function getErrorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code]
}
