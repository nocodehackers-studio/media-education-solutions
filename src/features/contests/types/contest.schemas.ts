import { z } from 'zod';

/**
 * Schema for creating a new contest
 * Used by React Hook Form and API validation
 */
export const createContestSchema = z.object({
  name: z.string().min(1, 'Contest name is required').max(255, 'Name too long'),
  description: z.string().optional(),
  contestCode: z
    .string()
    .length(6, 'Contest code must be 6 characters')
    .optional()
    .or(z.literal('')),
  rules: z.string().optional(),
  coverImage: z.instanceof(File).optional(),
});

/**
 * Type inferred from createContestSchema
 */
export type CreateContestInput = z.infer<typeof createContestSchema>;
