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
  CONTEST_NOT_ACCEPTING: 'CONTEST_NOT_ACCEPTING',
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',

  // Participant Session
  INVALID_PARTICIPANT_CODE: 'INVALID_PARTICIPANT_CODE',
  PARTICIPANT_INACTIVE: 'PARTICIPANT_INACTIVE',
  PARTICIPANT_SESSION_EXPIRED: 'PARTICIPANT_SESSION_EXPIRED',
  MISSING_CODES: 'MISSING_CODES',

  // Divisions
  DIVISION_NOT_FOUND: 'DIVISION_NOT_FOUND',
  DIVISION_CREATE_FAILED: 'DIVISION_CREATE_FAILED',
  DIVISION_UPDATE_FAILED: 'DIVISION_UPDATE_FAILED',
  DIVISION_DELETE_FAILED: 'DIVISION_DELETE_FAILED',
  DIVISION_LOAD_FAILED: 'DIVISION_LOAD_FAILED',
  DIVISION_LAST_REMAINING: 'DIVISION_LAST_REMAINING',
  CATEGORY_DUPLICATE_FAILED: 'CATEGORY_DUPLICATE_FAILED',
  CATEGORY_CLOSED: 'CATEGORY_CLOSED',
  CATEGORY_HAS_SUBMISSIONS: 'CATEGORY_HAS_SUBMISSIONS',
  CATEGORY_CREATE_FAILED: 'CATEGORY_CREATE_FAILED',
  CATEGORY_UPDATE_FAILED: 'CATEGORY_UPDATE_FAILED',
  CATEGORY_DELETE_FAILED: 'CATEGORY_DELETE_FAILED',
  CATEGORY_STATUS_UPDATE_FAILED: 'CATEGORY_STATUS_UPDATE_FAILED',
  CATEGORY_LOAD_FAILED: 'CATEGORY_LOAD_FAILED',

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
  AUTH_INVALID_CREDENTIALS: 'Invalid email or password',
  AUTH_SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  AUTH_UNAUTHORIZED: 'You are not authorized to access this resource.',
  CONTEST_NOT_FOUND: 'Contest not found.',
  CONTEST_NOT_ACCEPTING: 'This contest is not accepting submissions.',
  CATEGORY_NOT_FOUND: 'Category not found.',
  INVALID_PARTICIPANT_CODE: 'Invalid participant code.',
  PARTICIPANT_INACTIVE: 'This participant code is no longer active.',
  PARTICIPANT_SESSION_EXPIRED: 'Your session has expired. Please enter your codes again.',
  MISSING_CODES: 'Please enter both codes.',
  DIVISION_NOT_FOUND: 'Division not found.',
  DIVISION_CREATE_FAILED: 'Failed to create division.',
  DIVISION_UPDATE_FAILED: 'Failed to update division.',
  DIVISION_DELETE_FAILED: 'Failed to delete division.',
  DIVISION_LOAD_FAILED: 'Failed to load divisions.',
  DIVISION_LAST_REMAINING: 'Cannot delete the only division. A contest must have at least one division.',
  CATEGORY_DUPLICATE_FAILED: 'Failed to duplicate category.',
  CATEGORY_CLOSED: 'This category is no longer accepting submissions.',
  CATEGORY_HAS_SUBMISSIONS: 'Cannot modify category - it has submissions.',
  CATEGORY_CREATE_FAILED: 'Failed to create category.',
  CATEGORY_UPDATE_FAILED: 'Failed to update category.',
  CATEGORY_DELETE_FAILED: 'Failed to delete category.',
  CATEGORY_STATUS_UPDATE_FAILED: 'Failed to update category status.',
  CATEGORY_LOAD_FAILED: 'Failed to load categories.',
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
