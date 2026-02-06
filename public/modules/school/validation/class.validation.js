"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateClassSchema = exports.createClassSchema = void 0;
const zod_1 = require("zod");
/**
 * Zod Schema for Class Creation
 */
exports.createClassSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid("Invalid school ID"),
    name: zod_1.z.string().min(1, "Class name is required").max(50, "Class name is too long"),
    grade: zod_1.z.number().int("Grade must be an integer").min(1, "Grade must be at least 1").max(12, "Grade cannot exceed 12"),
    description: zod_1.z.string().max(500, "Description is too long").optional(),
    isActive: zod_1.z.boolean().optional(),
});
/**
 * Zod Schema for Class Update
 */
exports.updateClassSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Class name is required").max(50, "Class name is too long").optional(),
    description: zod_1.z.string().max(500, "Description is too long").optional(),
    isActive: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=class.validation.js.map