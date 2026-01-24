import { z } from "zod";

const FeeFrequencyEnum = z.enum(["MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY", "ONE_TIME"]);

/**
 * Zod Schema for Fee Structure Item
 */
const feeStructureItemSchema = z.object({
  feeCategoryId: z.string().uuid("Invalid fee category ID"),
  amount: z.number().positive("Amount must be positive"),
  frequency: FeeFrequencyEnum.optional(),
});

/**
 * Zod Schema for Creating Fee Structure
 */
export const createFeeStructureSchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  classId: z.string().uuid("Invalid class ID"),
  academicYearId: z.string().uuid("Invalid academic year ID"),
  name: z.string().min(1, "Name is required").max(200, "Name is too long"),
  totalAmount: z.number().positive("Total amount must be positive"),
  dueDay: z.number().min(1).max(28).optional(),
  lateFeePercentage: z.number().min(0).max(100).optional(),
  lateFeeFixedAmount: z.number().min(0).optional(),
  gracePeriodDays: z.number().min(0).max(30).optional(),
  isActive: z.boolean().optional(),
  items: z.array(feeStructureItemSchema).min(1, "At least one fee item is required"),
});

/**
 * Zod Schema for Updating Fee Structure
 */
export const updateFeeStructureSchema = z.object({
  name: z.string().max(200).optional(),
  totalAmount: z.number().positive().optional(),
  dueDay: z.number().min(1).max(28).optional(),
  lateFeePercentage: z.number().min(0).max(100).optional(),
  lateFeeFixedAmount: z.number().min(0).optional(),
  gracePeriodDays: z.number().min(0).max(30).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Zod Schema for Adding Item to Structure
 */
export const addFeeStructureItemSchema = z.object({
  feeStructureId: z.string().uuid("Invalid fee structure ID"),
  feeCategoryId: z.string().uuid("Invalid fee category ID"),
  amount: z.number().positive("Amount must be positive"),
  frequency: FeeFrequencyEnum.optional(),
});

export type CreateFeeStructureInput = z.infer<typeof createFeeStructureSchema>;
export type UpdateFeeStructureInput = z.infer<typeof updateFeeStructureSchema>;
export type AddFeeStructureItemInput = z.infer<typeof addFeeStructureItemSchema>;
