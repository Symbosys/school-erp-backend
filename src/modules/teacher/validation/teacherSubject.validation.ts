import { z } from "zod";

/**
 * Zod Schema for Assigning Subject to Teacher
 */
export const assignTeacherSubjectSchema = z.object({
  teacherId: z.string().uuid("Invalid teacher ID"),
  subjectId: z.string().uuid("Invalid subject ID"),
  isPrimary: z.boolean().optional(),
});

/**
 * Zod Schema for Updating Teacher Subject Assignment
 */
export const updateTeacherSubjectSchema = z.object({
  isPrimary: z.boolean(),
});

export type AssignTeacherSubjectInput = z.infer<typeof assignTeacherSubjectSchema>;
export type UpdateTeacherSubjectInput = z.infer<typeof updateTeacherSubjectSchema>;
