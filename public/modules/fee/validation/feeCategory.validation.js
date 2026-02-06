"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFeeCategorySchema = exports.createFeeCategorySchema = void 0;
const zod_1 = require("zod");
/**
 * Zod Schema for Creating Fee Category
 */
exports.createFeeCategorySchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid("Invalid school ID"),
    name: zod_1.z.string().min(1, "Name is required").max(100, "Name is too long"),
    description: zod_1.z.string().optional(),
    isRecurring: zod_1.z.boolean().optional(),
    isActive: zod_1.z.boolean().optional(),
});
/**
 * Zod Schema for Updating Fee Category
 */
exports.updateFeeCategorySchema = zod_1.z.object({
    name: zod_1.z.string().max(100).optional(),
    description: zod_1.z.string().optional(),
    isRecurring: zod_1.z.boolean().optional(),
    isActive: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=feeCategory.validation.js.map