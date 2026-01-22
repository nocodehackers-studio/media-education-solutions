// Division schemas - Story 2.9
// Zod schemas for form validation

import { z } from 'zod';

// Schema for creating a division
export const createDivisionSchema = z.object({
  name: z
    .string()
    .min(1, 'Division name is required')
    .max(100, 'Name must be 100 characters or less'),
});

// Schema for updating a division
export const updateDivisionSchema = z.object({
  name: z
    .string()
    .min(1, 'Division name is required')
    .max(100, 'Name must be 100 characters or less'),
  displayOrder: z.number().int().min(0).optional(),
});

// Infer types from schemas
export type CreateDivisionInput = z.infer<typeof createDivisionSchema>;
export type UpdateDivisionInput = z.infer<typeof updateDivisionSchema>;
