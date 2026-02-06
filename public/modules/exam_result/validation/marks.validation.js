"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMarkSchema = exports.enterMarksSchema = void 0;
const zod_1 = require("zod");
/**
 * Zod Schema for Single Mark Entry
 */
const markEntrySchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid("Invalid student ID"),
    marksObtained: zod_1.z.number().min(0, "Marks must be positive"),
    isAbsent: zod_1.z.boolean().optional(),
    remarks: zod_1.z.string().optional(),
});
/**
 * Zod Schema for Entering Marks for a Subject
 */
exports.enterMarksSchema = zod_1.z.object({
    examSubjectId: zod_1.z.string().uuid("Invalid exam subject ID"),
    enteredBy: zod_1.z.string().max(100).optional(),
    marks: zod_1.z.array(markEntrySchema).min(1, "At least one mark entry is required"),
});
/**
 * Zod Schema for Updating Single Mark
 */
exports.updateMarkSchema = zod_1.z.object({
    marksObtained: zod_1.z.number().min(0).optional(),
    isAbsent: zod_1.z.boolean().optional(),
    remarks: zod_1.z.string().optional(),
});
//# sourceMappingURL=marks.validation.js.map