import { z } from "zod";

/**
 * Zod Schema for Subject Creation
 */
export const createSubjectSchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  name: z.string().min(1, "Subject name is required").max(100, "Subject name is too long"),
  code: z.string().min(1, "Subject code is required").max(50, "Subject code is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  isActive: z.boolean().optional(),
});

/**
 * Zod Schema for Subject Update
 */
export const updateSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required").max(100, "Subject name is too long").optional(),
  description: z.string().max(500, "Description is too long").optional().nullable(),
  isActive: z.boolean().optional(),
});

/**
 * Zod Schema for ClassSubject Assignment
 */
export const assignSubjectToClassSchema = z.object({
  classId: z.string().uuid("Invalid class ID"),
  subjectId: z.string().uuid("Invalid subject ID"),
  isCompulsory: z.boolean().optional(),
});

/**
 * Zod Schema for ClassSubject Update
 */
export const updateClassSubjectSchema = z.object({
  isCompulsory: z.boolean(),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type AssignSubjectToClassInput = z.infer<typeof assignSubjectToClassSchema>;
export type UpdateClassSubjectInput = z.infer<typeof updateClassSubjectSchema>;
