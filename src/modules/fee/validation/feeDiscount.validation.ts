import { z } from "zod";

const DiscountTypeEnum = z.enum(["PERCENTAGE", "FIXED"]);

/**
 * Zod Schema for Creating Fee Discount
 */
export const createFeeDiscountSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  academicYearId: z.string().uuid("Invalid academic year ID"),
  feeCategoryId: z.string().uuid("Invalid fee category ID").optional().nullable(),
  discountType: DiscountTypeEnum,
  discountValue: z.number().positive("Discount value must be positive"),
  reason: z.string().min(1, "Reason is required").max(255, "Reason is too long"),
  approvedBy: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Zod Schema for Updating Fee Discount
 */
export const updateFeeDiscountSchema = z.object({
  discountType: DiscountTypeEnum.optional(),
  discountValue: z.number().positive().optional(),
  reason: z.string().max(255).optional(),
  approvedBy: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
});

export type CreateFeeDiscountInput = z.infer<typeof createFeeDiscountSchema>;
export type UpdateFeeDiscountInput = z.infer<typeof updateFeeDiscountSchema>;
