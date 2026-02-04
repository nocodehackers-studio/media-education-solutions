import { z } from 'zod'

/** Submission info form validation schema (collected per-submission on upload page) */
export const submissionInfoSchema = z.object({
  studentName: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name is too long'),
  tlcName: z
    .string()
    .min(1, 'Teacher/Leader/Coach name is required')
    .max(255, 'Name is too long'),
  tlcEmail: z
    .string()
    .min(1, 'Email is required')
    .max(255, 'Email is too long')
    .email('Please enter a valid email address'),
  groupMemberNames: z
    .string()
    .max(1000, 'Group member names are too long')
    .optional()
    .or(z.literal('')),
})

export type SubmissionInfoFormData = z.infer<typeof submissionInfoSchema>
