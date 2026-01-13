// Category Zod schemas - Story 2.5
// Validation for forms and API

import { z } from 'zod';

export const categoryTypeSchema = z.enum(['video', 'photo']);
export const categoryStatusSchema = z.enum(['draft', 'published', 'closed']);

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name must be 100 characters or less'),
  type: categoryTypeSchema,
  description: z.string().max(500, 'Description must be 500 characters or less').optional().or(z.literal('')),
  rules: z.string().max(2000, 'Rules must be 2000 characters or less').optional().or(z.literal('')),
  deadline: z.string().min(1, 'Deadline is required'),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
