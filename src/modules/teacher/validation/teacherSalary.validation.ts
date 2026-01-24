import { z } from "zod";

const SalaryStatusEnum = z.enum(["PENDING", "PROCESSED", "PAID", "HOLD"]);

/**
 * Zod Schema for Generating/Processing Monthly Salary
 */
export const processTeacherSalarySchema = z.object({
  teacherId: z.string().uuid("Invalid teacher ID"),
  salaryStructureId: z.string().uuid("Invalid salary structure ID"),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
  workingDays: z.number().min(0).max(31).optional(),
  presentDays: z.number().min(0).max(31).optional(),
  leaveDays: z.number().min(0).max(31).optional(),
  remarks: z.string().optional(),
});

/**
 * Zod Schema for Bulk Process Salaries (All teachers of a school)
 */
export const bulkProcessSalarySchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
});

/**
 * Zod Schema for Updating Teacher Salary
 */
export const updateTeacherSalarySchema = z.object({
  workingDays: z.number().min(0).max(31).optional(),
  presentDays: z.number().min(0).max(31).optional(),
  leaveDays: z.number().min(0).max(31).optional(),
  status: SalaryStatusEnum.optional(),
  remarks: z.string().optional(),
});

export type ProcessTeacherSalaryInput = z.infer<typeof processTeacherSalarySchema>;
export type BulkProcessSalaryInput = z.infer<typeof bulkProcessSalarySchema>;
export type UpdateTeacherSalaryInput = z.infer<typeof updateTeacherSalarySchema>;
