"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTeacherSubjectSchema = exports.assignTeacherSubjectSchema = void 0;
const zod_1 = require("zod");
/**
 * Zod Schema for Assigning Subject to Teacher
 */
exports.assignTeacherSubjectSchema = zod_1.z.object({
    teacherId: zod_1.z.string().uuid("Invalid teacher ID"),
    subjectId: zod_1.z.string().uuid("Invalid subject ID"),
    isPrimary: zod_1.z.boolean().optional(),
});
/**
 * Zod Schema for Updating Teacher Subject Assignment
 */
exports.updateTeacherSubjectSchema = zod_1.z.object({
    isPrimary: zod_1.z.boolean(),
});
//# sourceMappingURL=teacherSubject.validation.js.map