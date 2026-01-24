import { z } from "zod";

/**
 * Zod Schema for Assigning Teacher to Class/Section
 */
export const assignTeacherClassSchema = z.object({
  teacherId: z.string().uuid("Invalid teacher ID"),
  sectionId: z.string().uuid("Invalid section ID"),
  academicYearId: z.string().uuid("Invalid academic year ID"),
  subjectId: z.string().uuid("Invalid subject ID").optional().nullable(),
  isClassTeacher: z.boolean().optional(),
});

/**
 * Zod Schema for Updating Teacher Class Assignment
 */
export const updateTeacherClassSchema = z.object({
  isClassTeacher: z.boolean(),
});

export type AssignTeacherClassInput = z.infer<typeof assignTeacherClassSchema>;
export type UpdateTeacherClassInput = z.infer<typeof updateTeacherClassSchema>;
