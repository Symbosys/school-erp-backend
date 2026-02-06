"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateClassSubjectSchema = exports.assignSubjectToClassSchema = exports.updateSubjectSchema = exports.createSubjectSchema = void 0;
const zod_1 = require("zod");
/**
 * Zod Schema for Subject Creation
 */
exports.createSubjectSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid("Invalid school ID"),
    name: zod_1.z.string().min(1, "Subject name is required").max(100, "Subject name is too long"),
    code: zod_1.z.string().min(1, "Subject code is required").max(50, "Subject code is too long"),
    description: zod_1.z.string().max(500, "Description is too long").optional(),
    isActive: zod_1.z.boolean().optional(),
});
/**
 * Zod Schema for Subject Update
 */
exports.updateSubjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Subject name is required").max(100, "Subject name is too long").optional(),
    description: zod_1.z.string().max(500, "Description is too long").optional().nullable(),
    isActive: zod_1.z.boolean().optional(),
});
/**
 * Zod Schema for ClassSubject Assignment
 */
exports.assignSubjectToClassSchema = zod_1.z.object({
    classId: zod_1.z.string().uuid("Invalid class ID"),
    subjectId: zod_1.z.string().uuid("Invalid subject ID"),
    isCompulsory: zod_1.z.boolean().optional(),
});
/**
 * Zod Schema for ClassSubject Update
 */
exports.updateClassSubjectSchema = zod_1.z.object({
    isCompulsory: zod_1.z.boolean(),
});
//# sourceMappingURL=subject.validation.js.map