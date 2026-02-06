"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.punchAttendanceSchema = exports.updateTeacherAttendanceSchema = exports.markBulkTeacherAttendanceSchema = exports.markTeacherAttendanceSchema = exports.AttendanceStatusEnum = void 0;
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
 * Zod Schema for Marking Teacher Attendance (Single)
 */
exports.markTeacherAttendanceSchema = zod_1.z.object({
    teacherId: zod_1.z.string().uuid("Invalid teacher ID"),
    schoolId: zod_1.z.string().uuid("Invalid school ID"),
    date: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    }),
    status: exports.AttendanceStatusEnum,
    checkInTime: zod_1.z.string().datetime().optional(),
    checkOutTime: zod_1.z.string().datetime().optional(),
    remarks: zod_1.z.string().optional(),
});
/**
 * Zod Schema for Bulk Teacher Attendance (e.g. for School Admin)
 */
exports.markBulkTeacherAttendanceSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid("Invalid school ID"),
    date: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    }),
    teachers: zod_1.z.array(zod_1.z.object({
        teacherId: zod_1.z.string().uuid("Invalid teacher ID"),
        status: exports.AttendanceStatusEnum,
        checkInTime: zod_1.z.string().datetime().optional(),
        checkOutTime: zod_1.z.string().datetime().optional(),
        remarks: zod_1.z.string().optional(),
    })).min(1, "At least one teacher record is required"),
});
/**
 * Zod Schema for Updating Teacher Attendance
 */
exports.updateTeacherAttendanceSchema = zod_1.z.object({
    status: exports.AttendanceStatusEnum.optional(),
    checkInTime: zod_1.z.string().datetime().optional().nullable(), // Allow clearing times
    checkOutTime: zod_1.z.string().datetime().optional().nullable(),
    remarks: zod_1.z.string().optional(),
});
/**
 * Zod Schema for Teacher Punch In/Out
 */
exports.punchAttendanceSchema = zod_1.z.object({
    type: zod_1.z.enum(["IN", "OUT"]),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
});
//# sourceMappingURL=attendance.validation.js.map