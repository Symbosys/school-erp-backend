import { z } from "zod";

/**
 * Zod Schema for Single Mark Entry
 */
const markEntrySchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  marksObtained: z.number().min(0, "Marks must be positive"),
  isAbsent: z.boolean().optional(),
  remarks: z.string().optional(),
});

/**
 * Zod Schema for Entering Marks for a Subject
 */
export const enterMarksSchema = z.object({
  examSubjectId: z.string().uuid("Invalid exam subject ID"),
  enteredBy: z.string().max(100).optional(),
  marks: z.array(markEntrySchema).min(1, "At least one mark entry is required"),
});

/**
 * Zod Schema for Updating Single Mark
 */
export const updateMarkSchema = z.object({
  marksObtained: z.number().min(0).optional(),
  isAbsent: z.boolean().optional(),
  remarks: z.string().optional(),
});

export type EnterMarksInput = z.infer<typeof enterMarksSchema>;
export type UpdateMarkInput = z.infer<typeof updateMarkSchema>;
