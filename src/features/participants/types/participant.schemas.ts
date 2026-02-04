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

/** Story 6-7: Participant feedback view type */
export interface ParticipantFeedback {
  rating: number
  ratingTierLabel: string
  feedback: string
}
