import { z } from 'zod';

/**
 * Schema for creating a new contest
 * Used by React Hook Form and API validation
 */
// Valid characters for contest codes: A-H, J-N, P-Z, 2-9 (excludes confusing 0, 1, I, O)
const VALID_CODE_CHARS = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;

/**
 * Generate slug from name - must produce non-empty result
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const createContestSchema = z.object({
  name: z
    .string()
    .min(1, 'Contest name is required')
    .max(255, 'Name too long')
    .refine((val) => generateSlug(val).length > 0, {
      message: 'Contest name must contain at least one letter or number',
    }),
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

/**
 * Schema for updating an existing contest
 * All fields are optional since we support partial updates
 */
export const updateContestSchema = z.object({
  name: z
    .string()
    .min(1, 'Contest name is required')
    .max(255, 'Name too long')
    .refine((val) => generateSlug(val).length > 0, {
      message: 'Contest name must contain at least one letter or number',
    })
    .optional(),
  description: z.string().optional(),
  rules: z.string().optional(),
});

/**
 * Type inferred from updateContestSchema
 */
export type UpdateContestInput = z.infer<typeof updateContestSchema>;
