import { z } from 'zod'

/** Code entry form validation schema */
export const codeEntrySchema = z.object({
  contestCode: z
    .string()
    .min(6, 'Contest code must be 6 characters')
    .max(6, 'Contest code must be 6 characters')
    .regex(
      /^[A-Z0-9]{6}$/i,
      'Contest code must contain only letters and numbers'
    ),
  participantCode: z
    .string()
    .min(8, 'Participant code must be 8 characters')
    .max(8, 'Participant code must be 8 characters')
    .regex(
      /^[A-Z0-9]{8}$/i,
      'Participant code must contain only letters and numbers'
    ),
})

export type CodeEntryFormData = z.infer<typeof codeEntrySchema>

/** Participant info form validation schema (Story 4.2) */
export const participantInfoSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name is too long'),
  organizationName: z
    .string()
    .min(1, 'School/Organization is required')
    .max(255, 'Name is too long'),
  tlcName: z
    .string()
    .min(1, 'Teacher/Leader/Coach name is required')
    .max(255, 'Name is too long'),
  tlcEmail: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
})

export type ParticipantInfoFormData = z.infer<typeof participantInfoSchema>
