"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFeeStructureItemSchema = exports.updateFeeStructureSchema = exports.createFeeStructureSchema = void 0;
const zod_1 = require("zod");
const FeeFrequencyEnum = zod_1.z.enum(["MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY", "ONE_TIME"]);
/**
 * Zod Schema for Fee Structure Item
 */
const feeStructureItemSchema = zod_1.z.object({
    feeCategoryId: zod_1.z.string().uuid("Invalid fee category ID"),
    amount: zod_1.z.number().positive("Amount must be positive"),
    frequency: FeeFrequencyEnum.optional(),
});
/**
 * Zod Schema for Creating Fee Structure
 */
exports.createFeeStructureSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid("Invalid school ID"),
    classId: zod_1.z.string().uuid("Invalid class ID"),
    academicYearId: zod_1.z.string().uuid("Invalid academic year ID"),
    name: zod_1.z.string().min(1, "Name is required").max(200, "Name is too long"),
    totalAmount: zod_1.z.number().positive("Total amount must be positive"),
    dueDay: zod_1.z.number().min(1).max(28).optional(),
    lateFeePercentage: zod_1.z.number().min(0).max(100).optional(),
    lateFeeFixedAmount: zod_1.z.number().min(0).optional(),
    gracePeriodDays: zod_1.z.number().min(0).max(30).optional(),
    isActive: zod_1.z.boolean().optional(),
    items: zod_1.z.array(feeStructureItemSchema).min(1, "At least one fee item is required"),
});
/**
 * Zod Schema for Updating Fee Structure
 */
exports.updateFeeStructureSchema = zod_1.z.object({
    name: zod_1.z.string().max(200).optional(),
    totalAmount: zod_1.z.number().positive().optional(),
    dueDay: zod_1.z.number().min(1).max(28).optional(),
    lateFeePercentage: zod_1.z.number().min(0).max(100).optional(),
    lateFeeFixedAmount: zod_1.z.number().min(0).optional(),
    gracePeriodDays: zod_1.z.number().min(0).max(30).optional(),
    isActive: zod_1.z.boolean().optional(),
});
/**
 * Zod Schema for Adding Item to Structure
 */
exports.addFeeStructureItemSchema = zod_1.z.object({
    feeStructureId: zod_1.z.string().uuid("Invalid fee structure ID"),
    feeCategoryId: zod_1.z.string().uuid("Invalid fee category ID"),
    amount: zod_1.z.number().positive("Amount must be positive"),
    frequency: FeeFrequencyEnum.optional(),
});
//# sourceMappingURL=feeStructure.validation.js.map