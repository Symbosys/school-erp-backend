"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTeacherClassSchema = exports.assignTeacherClassSchema = void 0;
const zod_1 = require("zod");
/**
 * Zod Schema for Assigning Teacher to Class/Section
 */
exports.assignTeacherClassSchema = zod_1.z.object({
    teacherId: zod_1.z.string().uuid("Invalid teacher ID"),
    sectionId: zod_1.z.string().uuid("Invalid section ID"),
    academicYearId: zod_1.z.string().uuid("Invalid academic year ID"),
    subjectId: zod_1.z.string().uuid("Invalid subject ID").optional().nullable(),
    isClassTeacher: zod_1.z.boolean().optional(),
});
/**
 * Zod Schema for Updating Teacher Class Assignment
 */
exports.updateTeacherClassSchema = zod_1.z.object({
    isClassTeacher: zod_1.z.boolean(),
});
//# sourceMappingURL=teacherClass.validation.js.map