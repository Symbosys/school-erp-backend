"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudentParentSchema = exports.assignStudentParentSchema = void 0;
const zod_1 = require("zod");
/**
 * Zod Schema for Assigning Parent to Student
 */
exports.assignStudentParentSchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid("Invalid student ID"),
    parentId: zod_1.z.string().uuid("Invalid parent ID"),
    relationship: zod_1.z.string().min(1, "Relationship is required").max(50, "Relationship is too long"), // e.g., Father, Mother, Guardian
    isPrimary: zod_1.z.boolean().optional(),
});
/**
 * Zod Schema for Updating Student Parent Relationship
 */
exports.updateStudentParentSchema = zod_1.z.object({
    relationship: zod_1.z.string().max(50).optional(),
    isPrimary: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=studentParent.validation.js.map