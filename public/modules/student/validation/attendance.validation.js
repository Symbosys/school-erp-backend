"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAttendanceSchema = exports.markBulkAttendanceSchema = exports.markStudentAttendanceSchema = exports.AttendanceStatusEnum = void 0;
const zod_1 = require("zod");
exports.AttendanceStatusEnum = zod_1.z.enum([
    "PRESENT",
    "ABSENT",
    "LATE",
    "HALF_DAY",
    "ON_LEAVE",
    "HOLIDAY",
]);
/**
 * Zod Schema for Marking Attendance (Single)
 */
exports.markStudentAttendanceSchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid("Invalid student ID"),
    academicYearId: zod_1.z.string().uuid("Invalid academic year ID"),
    schoolId: zod_1.z.string().uuid("Invalid school ID"),
    date: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    }),
    status: exports.AttendanceStatusEnum,
    remarks: zod_1.z.string().optional(),
    markedBy: zod_1.z.string().optional(), // Could be Teacher ID or User ID
});
/**
 * Zod Schema for Bulk Attendance Marking
 */
exports.markBulkAttendanceSchema = zod_1.z.object({
    academicYearId: zod_1.z.string().uuid("Invalid academic year ID"),
    schoolId: zod_1.z.string().uuid("Invalid school ID"),
    sectionId: zod_1.z.string().uuid("Invalid section ID"), // To verify enrollment/class context
    date: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    }),
    markedBy: zod_1.z.string().optional(),
    students: zod_1.z.array(zod_1.z.object({
        studentId: zod_1.z.string().uuid("Invalid student ID"),
        status: exports.AttendanceStatusEnum,
        remarks: zod_1.z.string().optional(),
    })).min(1, "At least one student record is required"),
});
/**
 * Zod Schema for Updating Attendance
 */
exports.updateAttendanceSchema = zod_1.z.object({
    status: exports.AttendanceStatusEnum.optional(),
    remarks: zod_1.z.string().optional(),
});
//# sourceMappingURL=attendance.validation.js.map