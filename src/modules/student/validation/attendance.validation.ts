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
 * Zod Schema for Marking Attendance (Single)
 */
export const markStudentAttendanceSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  academicYearId: z.string().uuid("Invalid academic year ID"),
  schoolId: z.string().uuid("Invalid school ID"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  status: AttendanceStatusEnum,
  remarks: z.string().optional(),
  markedBy: z.string().optional(), // Could be Teacher ID or User ID
});

/**
 * Zod Schema for Bulk Attendance Marking
 */
export const markBulkAttendanceSchema = z.object({
  academicYearId: z.string().uuid("Invalid academic year ID"),
  schoolId: z.string().uuid("Invalid school ID"),
  sectionId: z.string().uuid("Invalid section ID"), // To verify enrollment/class context
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  markedBy: z.string().optional(),
  students: z.array(
    z.object({
      studentId: z.string().uuid("Invalid student ID"),
      status: AttendanceStatusEnum,
      remarks: z.string().optional(),
    })
  ).min(1, "At least one student record is required"),
});

/**
 * Zod Schema for Updating Attendance
 */
export const updateAttendanceSchema = z.object({
  status: AttendanceStatusEnum.optional(),
  remarks: z.string().optional(),
});

export type MarkStudentAttendanceInput = z.infer<typeof markStudentAttendanceSchema>;
export type MarkBulkAttendanceInput = z.infer<typeof markBulkAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
