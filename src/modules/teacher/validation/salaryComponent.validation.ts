import { z } from "zod";

const SalaryComponentTypeEnum = z.enum(["EARNING", "DEDUCTION"]);

/**
 * Zod Schema for Creating Salary Component
 */
export const createSalaryComponentSchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  type: SalaryComponentTypeEnum,
  isPercentage: z.boolean().optional(),
  defaultValue: z.number().min(0).optional(),
  isTaxable: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

/**
 * Zod Schema for Updating Salary Component
 */
export const updateSalaryComponentSchema = z.object({
  name: z.string().max(100).optional(),
  type: SalaryComponentTypeEnum.optional(),
  isPercentage: z.boolean().optional(),
  defaultValue: z.number().min(0).optional(),
  isTaxable: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type CreateSalaryComponentInput = z.infer<typeof createSalaryComponentSchema>;
export type UpdateSalaryComponentInput = z.infer<typeof updateSalaryComponentSchema>;
