import { z } from "zod";

const ExamTypeEnum = z.enum([
  "UNIT_TEST",
  "MID_TERM",
  "QUARTERLY",
  "HALF_YEARLY",
  "FINAL",
  "PRACTICAL",
  "PROJECT"
]);

/**
 * Zod Schema for Exam Subject Item
 */
const examSubjectItemSchema = z.object({
  subjectId: z.string().uuid("Invalid subject ID"),
  examDate: z.string().optional().nullable(),
  startTime: z.string().max(10).optional().nullable(),
  endTime: z.string().max(10).optional().nullable(),
  maxMarks: z.number().positive().optional(),
  passingMarks: z.number().min(0).optional(),
  isOptional: z.boolean().optional(),
});

/**
 * Zod Schema for Creating Exam
 */
export const createExamSchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  academicYearId: z.string().uuid("Invalid academic year ID"),
  classId: z.string().uuid("Invalid class ID"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  examType: ExamTypeEnum,
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  maxMarks: z.number().positive().optional(),
  passingPercentage: z.number().min(0).max(100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  subjects: z.array(examSubjectItemSchema).min(1, "At least one subject is required"),
});

/**
 * Zod Schema for Updating Exam
 */
export const updateExamSchema = z.object({
  name: z.string().max(100).optional(),
  examType: ExamTypeEnum.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  maxMarks: z.number().positive().optional(),
  passingPercentage: z.number().min(0).max(100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  subjects: z.array(examSubjectItemSchema).optional(),
});

/**
 * Zod Schema for Adding Subject to Exam
 */
export const addExamSubjectSchema = z.object({
  examId: z.string().uuid("Invalid exam ID"),
  subjectId: z.string().uuid("Invalid subject ID"),
  examDate: z.string().optional().nullable(),
  startTime: z.string().max(10).optional().nullable(),
  endTime: z.string().max(10).optional().nullable(),
  maxMarks: z.number().positive().optional(),
  passingMarks: z.number().min(0).optional(),
  isOptional: z.boolean().optional(),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
export type AddExamSubjectInput = z.infer<typeof addExamSubjectSchema>;
