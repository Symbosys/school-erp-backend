import { z } from "zod";

const FeeStatusEnum = z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "WAIVED"]);

/**
 * Zod Schema for Assigning Fee to Student
 */
export const assignStudentFeeSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  feeStructureId: z.string().uuid("Invalid fee structure ID"),
  academicYearId: z.string().uuid("Invalid academic year ID"),
});

/**
 * Zod Schema for Bulk Assign Fees (to all students in a section)
 */
export const bulkAssignStudentFeeSchema = z.object({
  sectionId: z.string().uuid("Invalid section ID"),
  feeStructureId: z.string().uuid("Invalid fee structure ID"),
  academicYearId: z.string().uuid("Invalid academic year ID"),
});

/**
 * Zod Schema for Updating Student Fee Status
 */
export const updateStudentFeeSchema = z.object({
  status: FeeStatusEnum.optional(),
  discountAmount: z.number().min(0).optional(),
});

export type AssignStudentFeeInput = z.infer<typeof assignStudentFeeSchema>;
export type BulkAssignStudentFeeInput = z.infer<typeof bulkAssignStudentFeeSchema>;
export type UpdateStudentFeeInput = z.infer<typeof updateStudentFeeSchema>;
