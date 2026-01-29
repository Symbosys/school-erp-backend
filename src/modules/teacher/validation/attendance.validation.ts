import { z } from "zod";

export const AttendanceStatusEnum = z.enum([
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
export const markTeacherAttendanceSchema = z.object({
  teacherId: z.string().uuid("Invalid teacher ID"),
  schoolId: z.string().uuid("Invalid school ID"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  status: AttendanceStatusEnum,
  checkInTime: z.string().datetime().optional(),
  checkOutTime: z.string().datetime().optional(),
  remarks: z.string().optional(),
});

/**
 * Zod Schema for Bulk Teacher Attendance (e.g. for School Admin)
 */
export const markBulkTeacherAttendanceSchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  teachers: z.array(
    z.object({
      teacherId: z.string().uuid("Invalid teacher ID"),
      status: AttendanceStatusEnum,
      checkInTime: z.string().datetime().optional(),
      checkOutTime: z.string().datetime().optional(),
      remarks: z.string().optional(),
    })
  ).min(1, "At least one teacher record is required"),
});

/**
 * Zod Schema for Updating Teacher Attendance
 */
export const updateTeacherAttendanceSchema = z.object({
  status: AttendanceStatusEnum.optional(),
  checkInTime: z.string().datetime().optional().nullable(), // Allow clearing times
  checkOutTime: z.string().datetime().optional().nullable(),
  remarks: z.string().optional(),
});

export type MarkTeacherAttendanceInput = z.infer<typeof markTeacherAttendanceSchema>;
export type MarkBulkTeacherAttendanceInput = z.infer<typeof markBulkTeacherAttendanceSchema>;
export type UpdateTeacherAttendanceInput = z.infer<typeof updateTeacherAttendanceSchema>;

/**
 * Zod Schema for Teacher Punch In/Out
 */
export const punchAttendanceSchema = z.object({
  type: z.enum(["IN", "OUT"]),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type PunchAttendanceInput = z.infer<typeof punchAttendanceSchema>;

