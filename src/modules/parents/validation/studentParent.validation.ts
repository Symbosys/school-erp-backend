import { z } from "zod";

/**
 * Zod Schema for Assigning Parent to Student
 */
export const assignStudentParentSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  parentId: z.string().uuid("Invalid parent ID"),
  relationship: z.string().min(1, "Relationship is required").max(50, "Relationship is too long"), // e.g., Father, Mother, Guardian
  isPrimary: z.boolean().optional(),
});

/**
 * Zod Schema for Updating Student Parent Relationship
 */
export const updateStudentParentSchema = z.object({
  relationship: z.string().max(50).optional(),
  isPrimary: z.boolean().optional(),
});

export type AssignStudentParentInput = z.infer<typeof assignStudentParentSchema>;
export type UpdateStudentParentInput = z.infer<typeof updateStudentParentSchema>;
