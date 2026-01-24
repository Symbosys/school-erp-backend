import { z } from "zod";

/**
 * Zod Schema for Enrolling Student (New Entry)
 */
export const createEnrollmentSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  academicYearId: z.string().uuid("Invalid academic year ID"),
  sectionId: z.string().uuid("Invalid section ID"),
  enrollmentDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid enrollment date format",
  }),
  rollNumber: z.string().max(50, "Roll number is too long").optional(),
  remarks: z.string().optional(),
});

/**
 * Zod Schema for Updating Enrollment
 */
export const updateEnrollmentSchema = z.object({
  sectionId: z.string().uuid("Invalid section ID").optional(),
  enrollmentDate: z.string().optional(),
  rollNumber: z.string().max(50).optional().nullable(),
  isPromoted: z.boolean().optional(),
  remarks: z.string().optional().nullable(),
});

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;
