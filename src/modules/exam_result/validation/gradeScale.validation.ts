import { z } from "zod";

/**
 * Zod Schema for Creating Grade Scale
 */
export const createGradeScaleSchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  name: z.string().min(1, "Name is required").max(50),
  minPercentage: z.number().min(0).max(100),
  maxPercentage: z.number().min(0).max(100),
  gradePoint: z.number().min(0).max(10).optional().nullable(),
  description: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Zod Schema for Updating Grade Scale
 */
export const updateGradeScaleSchema = z.object({
  name: z.string().max(50).optional(),
  minPercentage: z.number().min(0).max(100).optional(),
  maxPercentage: z.number().min(0).max(100).optional(),
  gradePoint: z.number().min(0).max(10).optional().nullable(),
  description: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
});

export type CreateGradeScaleInput = z.infer<typeof createGradeScaleSchema>;
export type UpdateGradeScaleInput = z.infer<typeof updateGradeScaleSchema>;
