"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGradeScaleSchema = exports.createGradeScaleSchema = void 0;
const zod_1 = require("zod");
/**
 * Zod Schema for Creating Grade Scale
 */
exports.createGradeScaleSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid("Invalid school ID"),
    name: zod_1.z.string().min(1, "Name is required").max(50),
    minPercentage: zod_1.z.number().min(0).max(100),
    maxPercentage: zod_1.z.number().min(0).max(100),
    gradePoint: zod_1.z.number().min(0).max(10).optional().nullable(),
    description: zod_1.z.string().max(100).optional(),
    isActive: zod_1.z.boolean().optional(),
});
/**
 * Zod Schema for Updating Grade Scale
 */
exports.updateGradeScaleSchema = zod_1.z.object({
    name: zod_1.z.string().max(50).optional(),
    minPercentage: zod_1.z.number().min(0).max(100).optional(),
    maxPercentage: zod_1.z.number().min(0).max(100).optional(),
    gradePoint: zod_1.z.number().min(0).max(10).optional().nullable(),
    description: zod_1.z.string().max(100).optional(),
    isActive: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=gradeScale.validation.js.map