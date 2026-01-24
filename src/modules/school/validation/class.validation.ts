import { z } from "zod";

/**
 * Zod Schema for Class Creation
 */
export const createClassSchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  name: z.string().min(1, "Class name is required").max(50, "Class name is too long"),
  grade: z.number().int("Grade must be an integer").min(1, "Grade must be at least 1").max(12, "Grade cannot exceed 12"),
  description: z.string().max(500, "Description is too long").optional(),
  isActive: z.boolean().optional(),
});

/**
 * Zod Schema for Class Update
 */
export const updateClassSchema = z.object({
  name: z.string().min(1, "Class name is required").max(50, "Class name is too long").optional(),
  description: z.string().max(500, "Description is too long").optional(),
  isActive: z.boolean().optional(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
