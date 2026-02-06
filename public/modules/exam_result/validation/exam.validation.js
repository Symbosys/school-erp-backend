"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addExamSubjectSchema = exports.updateExamSchema = exports.createExamSchema = void 0;
const zod_1 = require("zod");
const ExamTypeEnum = zod_1.z.enum([
    "UNIT_TEST",
    "MID_TERM",
    "QUARTERLY",
    "HALF_YEARLY",
    "FINAL",
    "PRACTICAL",
    "PROJECT"
]);
/**
 * Zod Schema for Exam Subject Item
 */
const examSubjectItemSchema = zod_1.z.object({
    subjectId: zod_1.z.string().uuid("Invalid subject ID"),
    examDate: zod_1.z.string().optional().nullable(),
    startTime: zod_1.z.string().max(10).optional().nullable(),
    endTime: zod_1.z.string().max(10).optional().nullable(),
    maxMarks: zod_1.z.number().positive().optional(),
    passingMarks: zod_1.z.number().min(0).optional(),
    isOptional: zod_1.z.boolean().optional(),
});
/**
 * Zod Schema for Creating Exam
 */
exports.createExamSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid("Invalid school ID"),
    academicYearId: zod_1.z.string().uuid("Invalid academic year ID"),
    classId: zod_1.z.string().uuid("Invalid class ID"),
    name: zod_1.z.string().min(1, "Name is required").max(100, "Name is too long"),
    examType: ExamTypeEnum,
    startDate: zod_1.z.string().min(1, "Start date is required"),
    endDate: zod_1.z.string().min(1, "End date is required"),
    maxMarks: zod_1.z.number().positive().optional(),
    passingPercentage: zod_1.z.number().min(0).max(100).optional(),
    description: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
    subjects: zod_1.z.array(examSubjectItemSchema).min(1, "At least one subject is required"),
});
/**
 * Zod Schema for Updating Exam
 */
exports.updateExamSchema = zod_1.z.object({
    name: zod_1.z.string().max(100).optional(),
    examType: ExamTypeEnum.optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    maxMarks: zod_1.z.number().positive().optional(),
    passingPercentage: zod_1.z.number().min(0).max(100).optional(),
    description: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
    subjects: zod_1.z.array(examSubjectItemSchema).optional(),
});
/**
 * Zod Schema for Adding Subject to Exam
 */
exports.addExamSubjectSchema = zod_1.z.object({
    examId: zod_1.z.string().uuid("Invalid exam ID"),
    subjectId: zod_1.z.string().uuid("Invalid subject ID"),
    examDate: zod_1.z.string().optional().nullable(),
    startTime: zod_1.z.string().max(10).optional().nullable(),
    endTime: zod_1.z.string().max(10).optional().nullable(),
    maxMarks: zod_1.z.number().positive().optional(),
    passingMarks: zod_1.z.number().min(0).optional(),
    isOptional: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=exam.validation.js.map