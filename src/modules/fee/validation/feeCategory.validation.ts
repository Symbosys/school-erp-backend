import { z } from "zod";

/**
 * Zod Schema for Creating Fee Category
 */
export const createFeeCategorySchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().optional(),
  isRecurring: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

/**
 * Zod Schema for Updating Fee Category
 */
export const updateFeeCategorySchema = z.object({
  name: z.string().max(100).optional(),
  description: z.string().optional(),
  isRecurring: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type CreateFeeCategoryInput = z.infer<typeof createFeeCategorySchema>;
export type UpdateFeeCategoryInput = z.infer<typeof updateFeeCategorySchema>;
