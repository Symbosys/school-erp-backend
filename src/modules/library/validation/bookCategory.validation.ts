import { z } from "zod";

/**
 * Zod Schema for Creating Book Category
 */
export const createBookCategorySchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * Zod Schema for Updating Book Category
 */
export const updateBookCategorySchema = z.object({
  name: z.string().max(100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateBookCategoryInput = z.infer<typeof createBookCategorySchema>;
export type UpdateBookCategoryInput = z.infer<typeof updateBookCategorySchema>;
