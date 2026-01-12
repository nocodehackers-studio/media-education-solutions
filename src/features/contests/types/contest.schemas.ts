import { z } from 'zod';

/**
 * Schema for creating a new contest
 * Used by React Hook Form and API validation
 */
// Valid characters for contest codes: A-H, J-N, P-Z, 2-9 (excludes confusing 0, 1, I, O)
const VALID_CODE_CHARS = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;

export const createContestSchema = z.object({
  name: z.string().min(1, 'Contest name is required').max(255, 'Name too long'),
  description: z.string().optional(),
  contestCode: z
    .string()
    .transform((val) => val.toUpperCase()) // Convert to uppercase for consistency
    .refine(
      (val) => val.length === 0 || (val.length === 6 && VALID_CODE_CHARS.test(val)),
      {
        message:
          'Contest code must be 6 characters using only A-H, J-N, P-Z, 2-9 (no 0, 1, I, O)',
      }
    )
    .optional()
    .or(z.literal('')),
  rules: z.string().optional(),
  coverImage: z.instanceof(File).optional(),
});

/**
 * Type inferred from createContestSchema
 */
export type CreateContestInput = z.infer<typeof createContestSchema>;
