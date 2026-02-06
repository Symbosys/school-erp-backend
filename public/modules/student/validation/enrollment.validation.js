"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEnrollmentSchema = exports.createEnrollmentSchema = void 0;
const zod_1 = require("zod");
/**
 * Zod Schema for Enrolling Student (New Entry)
 */
exports.createEnrollmentSchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid("Invalid student ID"),
    academicYearId: zod_1.z.string().uuid("Invalid academic year ID"),
    sectionId: zod_1.z.string().uuid("Invalid section ID"),
    enrollmentDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid enrollment date format",
    }),
    rollNumber: zod_1.z.string().max(50, "Roll number is too long").optional(),
    remarks: zod_1.z.string().optional(),
});
/**
 * Zod Schema for Updating Enrollment
 */
exports.updateEnrollmentSchema = zod_1.z.object({
    sectionId: zod_1.z.string().uuid("Invalid section ID").optional(),
    enrollmentDate: zod_1.z.string().optional(),
    rollNumber: zod_1.z.string().max(50).optional().nullable(),
    isPromoted: zod_1.z.boolean().optional(),
    remarks: zod_1.z.string().optional().nullable(),
});
//# sourceMappingURL=enrollment.validation.js.map