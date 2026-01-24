import { z } from "zod";

/**
 * Zod Schema for Salary Structure Item
 */
const salaryStructureItemSchema = z.object({
  salaryComponentId: z.string().uuid("Invalid salary component ID"),
  amount: z.number().min(0, "Amount must be positive"),
  percentage: z.number().min(0).max(100).optional().nullable(),
});

/**
 * Zod Schema for Creating Salary Structure
 */
export const createSalaryStructureSchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  name: z.string().min(1, "Name is required").max(200, "Name is too long"),
  description: z.string().optional(),
  baseSalary: z.number().positive("Base salary must be positive"),
  isActive: z.boolean().optional(),
  items: z.array(salaryStructureItemSchema).min(1, "At least one component is required"),
});

/**
 * Zod Schema for Updating Salary Structure
 */
export const updateSalaryStructureSchema = z.object({
  name: z.string().max(200).optional(),
  description: z.string().optional(),
  baseSalary: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

/**
 * Zod Schema for Adding Item to Structure
 */
export const addSalaryStructureItemSchema = z.object({
  salaryStructureId: z.string().uuid("Invalid salary structure ID"),
  salaryComponentId: z.string().uuid("Invalid salary component ID"),
  amount: z.number().min(0, "Amount must be positive"),
  percentage: z.number().min(0).max(100).optional().nullable(),
});

export type CreateSalaryStructureInput = z.infer<typeof createSalaryStructureSchema>;
export type UpdateSalaryStructureInput = z.infer<typeof updateSalaryStructureSchema>;
export type AddSalaryStructureItemInput = z.infer<typeof addSalaryStructureItemSchema>;
