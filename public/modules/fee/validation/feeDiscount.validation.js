"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFeeDiscountSchema = exports.createFeeDiscountSchema = void 0;
const zod_1 = require("zod");
const DiscountTypeEnum = zod_1.z.enum(["PERCENTAGE", "FIXED"]);
/**
 * Zod Schema for Creating Fee Discount
 */
exports.createFeeDiscountSchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid("Invalid student ID"),
    academicYearId: zod_1.z.string().uuid("Invalid academic year ID"),
    feeCategoryId: zod_1.z.string().uuid("Invalid fee category ID").optional().nullable(),
    discountType: DiscountTypeEnum,
    discountValue: zod_1.z.number().positive("Discount value must be positive"),
    reason: zod_1.z.string().min(1, "Reason is required").max(255, "Reason is too long"),
    approvedBy: zod_1.z.string().max(100).optional(),
    isActive: zod_1.z.boolean().optional(),
});
/**
 * Zod Schema for Updating Fee Discount
 */
exports.updateFeeDiscountSchema = zod_1.z.object({
    discountType: DiscountTypeEnum.optional(),
    discountValue: zod_1.z.number().positive().optional(),
    reason: zod_1.z.string().max(255).optional(),
    approvedBy: zod_1.z.string().max(100).optional(),
    isActive: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=feeDiscount.validation.js.map